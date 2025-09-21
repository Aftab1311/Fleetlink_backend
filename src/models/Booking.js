const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required'],
    index: true
  },
  customerId: {
    type: String,
    required: [true, 'Customer ID is required'],
    trim: true,
    minlength: [1, 'Customer ID cannot be empty'],
    maxlength: [100, 'Customer ID cannot exceed 100 characters'],
    index: true
  },
  fromPincode: {
    type: String,
    required: [true, 'From pincode is required'],
    trim: true,
    match: [/^\d{6}$/, 'From pincode must be exactly 6 digits'],
    index: true
  },
  toPincode: {
    type: String,
    required: [true, 'To pincode is required'],
    trim: true,
    match: [/^\d{6}$/, 'To pincode must be exactly 6 digits'],
    index: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
    index: true,
    validate: {
      validator: function(value) {
        // Ensure start time is not in the past (with 5 minute buffer)
        const now = new Date();
        const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
        return value >= new Date(now.getTime() - buffer);
      },
      message: 'Start time cannot be in the past'
    }
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
    index: true,
    validate: {
      validator: function(value) {
        return value > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  estimatedRideDurationHours: {
    type: Number,
    required: [true, 'Estimated ride duration is required'],
    min: [0.1, 'Ride duration must be at least 0.1 hours'],
    max: [168, 'Ride duration cannot exceed 168 hours (1 week)']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      message: 'Status must be one of: pending, confirmed, in_progress, completed, cancelled'
    },
    default: 'confirmed',
    index: true
  },
  totalDistance: {
    type: Number,
    min: [0, 'Total distance cannot be negative'],
    validate: {
      validator: function(value) {
        return value === undefined || value === null || (typeof value === 'number' && value >= 0);
      },
      message: 'Total distance must be a non-negative number'
    }
  },
  estimatedCost: {
    type: Number,
    min: [0, 'Estimated cost cannot be negative'],
    validate: {
      validator: function(value) {
        return value === undefined || value === null || (typeof value === 'number' && value >= 0);
      },
      message: 'Estimated cost must be a non-negative number'
    }
  },
  actualStartTime: {
    type: Date,
    validate: {
      validator: function(value) {
        // Allow actual start time to be different from scheduled time for demo purposes
        return !value || true; // Always valid for demo
      },
      message: 'Actual start time validation'
    }
  },
  actualEndTime: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || !this.actualStartTime || value >= this.actualStartTime;
      },
      message: 'Actual end time cannot be before actual start time'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for efficient queries
bookingSchema.index({ vehicleId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ status: 1, startTime: 1 });
bookingSchema.index({ fromPincode: 1, toPincode: 1, startTime: 1 });

// Virtual for booking duration in hours
bookingSchema.virtual('actualDurationHours').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round(((this.actualEndTime - this.actualStartTime) / (1000 * 60 * 60)) * 100) / 100;
  }
  return null;
});

// Virtual for booking route description
bookingSchema.virtual('route').get(function() {
  return `${this.fromPincode} → ${this.toPincode}`;
});

// Instance method to check if booking overlaps with given time range
bookingSchema.methods.overlapsWithTimeRange = function(startTime, endTime) {
  return (
    this.status !== 'cancelled' &&
    this.startTime < endTime &&
    this.endTime > startTime
  );
};

// Instance method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  
  return (
    ['pending', 'confirmed'].includes(this.status) &&
    this.startTime > oneHourFromNow
  );
};

// Static method to find overlapping bookings for a vehicle
bookingSchema.statics.findOverlappingBookings = function(vehicleId, startTime, endTime, excludeBookingId = null) {
  const query = {
    vehicleId,
    status: { $nin: ['cancelled', 'completed'] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return this.find(query);
};

// Static method to get bookings for a time period
bookingSchema.statics.findByDateRange = function(startDate, endDate, options = {}) {
  const query = {
    startTime: {
      $gte: startDate,
      $lte: endDate
    }
  };

  if (options.status) {
    query.status = options.status;
  }

  if (options.vehicleId) {
    query.vehicleId = options.vehicleId;
  }

  if (options.customerId) {
    query.customerId = options.customerId;
  }

  return this.find(query)
    .populate('vehicleId', 'name capacityKg tyres vehicleType')
    .sort({ startTime: 1 });
};

// Pre-save middleware for data validation and normalization
bookingSchema.pre('save', function(next) {
  // Ensure pincodes are strings and properly formatted
  if (this.fromPincode) {
    this.fromPincode = this.fromPincode.toString().padStart(6, '0');
  }
  if (this.toPincode) {
    this.toPincode = this.toPincode.toString().padStart(6, '0');
  }

  // Calculate estimated duration if not provided
  if (!this.estimatedRideDurationHours && this.startTime && this.endTime) {
    this.estimatedRideDurationHours = Math.round(
      ((this.endTime - this.startTime) / (1000 * 60 * 60)) * 100
    ) / 100;
  }

  next();
});

// Pre-save middleware for business logic validation
bookingSchema.pre('save', async function(next) {
  // Skip validation for cancelled bookings
  if (this.status === 'cancelled') {
    return next();
  }

  try {
    // Check if vehicle exists and is active
    const Vehicle = mongoose.model('Vehicle');
    const vehicle = await Vehicle.findById(this.vehicleId);
    
    if (!vehicle) {
      return next(new Error('Vehicle not found'));
    }
    
    if (!vehicle.isActive) {
      return next(new Error('Vehicle is not active'));
    }

    // Check for overlapping bookings (only for new bookings or when time is changed)
    if (this.isNew || this.isModified('startTime') || this.isModified('endTime')) {
      const overlappingBookings = await this.constructor.findOverlappingBookings(
        this.vehicleId,
        this.startTime,
        this.endTime,
        this._id
      );

      if (overlappingBookings.length > 0) {
        return next(new Error('Vehicle is not available for the selected time slot'));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware for logging
bookingSchema.post('save', function(doc, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`Booking ${doc.status}: ${doc.route} (${doc.estimatedRideDurationHours}h)`);
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;

