const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vehicle name is required'],
    trim: true,
    minlength: [2, 'Vehicle name must be at least 2 characters long'],
    maxlength: [100, 'Vehicle name cannot exceed 100 characters']
  },
  capacityKg: {
    type: Number,
    required: [true, 'Vehicle capacity is required'],
    min: [1, 'Vehicle capacity must be at least 1 kg'],
    max: [100000, 'Vehicle capacity cannot exceed 100,000 kg'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value > 0;
      },
      message: 'Vehicle capacity must be a positive integer'
    }
  },
  tyres: {
    type: Number,
    required: [true, 'Number of tyres is required'],
    min: [2, 'Vehicle must have at least 2 tyres'],
    max: [20, 'Vehicle cannot have more than 20 tyres'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value > 0;
      },
      message: 'Number of tyres must be a positive integer'
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9\-\s]+$/, 'Registration number can only contain letters, numbers, hyphens and spaces']
  },
  vehicleType: {
    type: String,
    enum: {
      values: ['truck', 'van', 'pickup', 'trailer', 'motorcycle', 'other'],
      message: 'Vehicle type must be one of: truck, van, pickup, trailer, motorcycle, other'
    },
    default: 'truck',
    lowercase: true
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

// Indexes for better query performance
vehicleSchema.index({ capacityKg: 1, isActive: 1 });
vehicleSchema.index({ vehicleType: 1, isActive: 1 });
vehicleSchema.index({ name: 'text' }); // Text search index

// Virtual for capacity in tons
vehicleSchema.virtual('capacityTons').get(function() {
  return Math.round((this.capacityKg / 1000) * 100) / 100; // Round to 2 decimal places
});

// Instance method to check if vehicle can handle capacity
vehicleSchema.methods.canHandleCapacity = function(requiredCapacity) {
  return this.isActive && this.capacityKg >= requiredCapacity;
};

// Static method to find available vehicles by capacity
vehicleSchema.statics.findByMinCapacity = function(minCapacity) {
  return this.find({
    capacityKg: { $gte: minCapacity },
    isActive: true
  }).sort({ capacityKg: 1 });
};

// Pre-save middleware for data normalization
vehicleSchema.pre('save', function(next) {
  // Normalize name
  if (this.name) {
    this.name = this.name.trim().replace(/\s+/g, ' ');
  }
  
  // Ensure capacity and tyres are integers
  if (this.capacityKg) {
    this.capacityKg = Math.floor(this.capacityKg);
  }
  if (this.tyres) {
    this.tyres = Math.floor(this.tyres);
  }
  
  next();
});

// Post-save middleware for logging
vehicleSchema.post('save', function(doc, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`Vehicle saved: ${doc.name} (${doc.capacityKg}kg, ${doc.tyres} tyres)`);
  }
  next();
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;

