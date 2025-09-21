# FleetLink - Logistics Vehicle Booking System

A production-grade backend API for logistics vehicle booking and fleet management, built with Node.js, Express.js, and MongoDB.

## 🚀 Features

### Core Functionality
- **Vehicle Management**: Add, update, and manage fleet vehicles with capacity and type specifications
- **Booking System**: Book vehicles with automatic availability checking and conflict prevention
- **Real-time Availability**: Search available vehicles based on capacity, location, and time requirements
- **Duration Calculation**: Automatic ride duration estimation based on pincode difference
- **Status Management**: Track booking lifecycle from pending to completed

### Technical Features
- **Production-Ready**: Industry-standard architecture with proper error handling and validation
- **Scalable Design**: Layered architecture (controllers, services, models, utilities)
- **Data Integrity**: Mongoose validation with business logic constraints
- **Race Condition Prevention**: Atomic operations and transactions for booking conflicts
- **Comprehensive Testing**: Unit and integration tests with Jest
- **Docker Support**: Full containerization with MongoDB
- **API Documentation**: RESTful API with proper HTTP status codes and responses

## 🏗️ Architecture

```
src/
├── config/          # Database and environment configuration
├── controllers/     # HTTP request handlers
├── middleware/      # Authentication, validation, error handling
├── models/          # Mongoose schemas and data models
├── routes/          # API route definitions
├── services/        # Business logic layer
├── utils/           # Utility functions and helpers
└── server.js        # Application entry point
```

## 📋 Prerequisites

- **Node.js** >= 16.0.0
- **MongoDB** >= 5.0
- **Docker** (optional, for containerized deployment)
- **npm** >= 8.0.0

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd fleetlink-backend
npm install
```

### 2. Environment Setup
```bash
cp env.example .env
# Edit .env with your configuration
```

### 3. Start Development Server
```bash
# Start MongoDB (if not using Docker)
mongod

# Start the application
npm run dev
```

### 4. Using Docker (Recommended)
```bash
# Start all services (MongoDB + Backend)
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/fleetlink

# API Settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
JWT_SECRET=your_jwt_secret_here
```

## 📚 API Endpoints

### Vehicle Management

#### Create Vehicle
```http
POST /api/vehicles
Content-Type: application/json

{
  "name": "Heavy Duty Truck",
  "capacityKg": 15000,
  "tyres": 10,
  "vehicleType": "truck",
  "registrationNumber": "TRK001"
}
```

#### Find Available Vehicles
```http
GET /api/vehicles/available?capacityRequired=5000&fromPincode=110001&toPincode=110025&startTime=2024-01-01T10:00:00Z
```

**Response:**
```json
{
  "success": true,
  "message": "Found 3 available vehicles out of 5 suitable vehicles",
  "data": {
    "availableVehicles": [
      {
        "id": "...",
        "name": "Medium Truck",
        "capacityKg": 8000,
        "tyres": 6,
        "vehicleType": "truck",
        "estimatedRideDurationHours": 24,
        "estimatedEndTime": "2024-01-02T10:00:00Z"
      }
    ],
    "estimatedRideDurationHours": 24,
    "totalAvailable": 3,
    "totalSuitable": 5
  }
}
```

### Booking Management

#### Create Booking
```http
POST /api/bookings
Content-Type: application/json

{
  "vehicleId": "vehicle_id_here",
  "customerId": "customer123",
  "fromPincode": "110001",
  "toPincode": "110025",
  "startTime": "2024-01-01T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "...",
    "vehicleId": {
      "id": "...",
      "name": "Heavy Duty Truck",
      "capacityKg": 15000
    },
    "customerId": "customer123",
    "fromPincode": "110001",
    "toPincode": "110025",
    "startTime": "2024-01-01T10:00:00Z",
    "endTime": "2024-01-02T10:00:00Z",
    "estimatedRideDurationHours": 24,
    "status": "confirmed"
  }
}
```

#### Cancel Booking
```http
DELETE /api/bookings/{bookingId}
Content-Type: application/json

{
  "reason": "Customer request"
}
```

### Additional Endpoints

- `GET /api/vehicles` - List all vehicles with filters
- `GET /api/vehicles/{id}` - Get vehicle by ID
- `PUT /api/vehicles/{id}` - Update vehicle
- `DELETE /api/vehicles/{id}` - Deactivate vehicle
- `GET /api/bookings` - List bookings with filters
- `GET /api/bookings/{id}` - Get booking by ID
- `PATCH /api/bookings/{id}/status` - Update booking status
- `GET /api/bookings/customer/{customerId}` - Get customer bookings
- `GET /health` - Health check endpoint

## 🧮 Duration Calculation Logic

The system calculates estimated ride duration using the formula:
```javascript
estimatedRideDurationHours = Math.abs(parseInt(toPincode) - parseInt(fromPincode)) % 24
```

**Examples:**
- `110001` → `110025` = `24 hours`
- `400001` → `400002` = `1 hour`
- `560001` → `560100` = `3 hours` (99 % 24)

**Enhanced Duration** (optional):
- Includes vehicle type factors (motorcycle: 0.8x, truck: 1.3x, trailer: 1.5x)
- Traffic multipliers (1.2x default)
- Loading/unloading time estimation

## 🔒 Data Validation

### Vehicle Validation
- **Name**: 2-100 characters, alphanumeric with spaces/hyphens
- **Capacity**: 1-100,000 kg (integer)
- **Tyres**: 2-20 (integer)
- **Type**: truck, van, pickup, trailer, motorcycle, other
- **Registration**: Unique, alphanumeric with spaces/hyphens

### Booking Validation
- **Pincodes**: Exactly 6 digits (100000-999999)
- **Start Time**: At least 5 minutes in future, max 1 year
- **End Time**: Must be after start time
- **Customer ID**: 1-100 characters, alphanumeric
- **Vehicle**: Must exist and be active
- **Conflicts**: No overlapping bookings for same vehicle

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Coverage
- **Models**: Validation, business logic, instance methods
- **Services**: Availability checking, booking logic, data integrity
- **Controllers**: HTTP handling, error responses, validation
- **Integration**: End-to-end API testing, error scenarios
- **Utils**: Time calculations, validation functions

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose --profile production up -d
```

### With Database Management UI
```bash
docker-compose --profile tools up -d
# Access Mongo Express at http://localhost:8081
```

## 📊 Monitoring & Health

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T10:00:00.000Z",
  "uptime": 3600.123,
  "environment": "production"
}
```

### Statistics Endpoints
- `GET /api/vehicles/stats` - Vehicle statistics
- `GET /api/bookings/stats` - Booking analytics
- `GET /api/bookings/upcoming` - Upcoming bookings

## 🔧 Development

### Code Style
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Database Operations
```bash
# Connect to MongoDB in Docker
docker exec -it fleetlink_mongodb mongosh mongodb://admin:fleetlink123@localhost:27017/fleetlink?authSource=admin
```

## 🚦 Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "error": {
    "message": "Vehicle not found",
    "type": "NotFoundError"
  },
  "timestamp": "2024-01-01T10:00:00.000Z",
  "path": "/api/vehicles/invalid-id",
  "method": "GET"
}
```

**Error Types:**
- `ValidationError` (400)
- `NotFoundError` (404)
- `ConflictError` (409)
- `RateLimitError` (429)
- `ServerError` (500)

## 🔐 Security Features

- **Rate Limiting**: Configurable request limits per IP
- **Input Validation**: Comprehensive data sanitization
- **Security Headers**: Helmet.js for secure HTTP headers
- **CORS**: Configurable cross-origin resource sharing
- **MongoDB Injection Prevention**: Mongoose schema validation
- **Error Sanitization**: No sensitive data in error responses

## 📈 Performance Optimizations

- **Database Indexes**: Optimized queries for common operations
- **Connection Pooling**: Efficient MongoDB connection management
- **Compression**: Gzip compression for API responses
- **Atomic Operations**: Transaction support for critical operations
- **Caching**: Optimized for future Redis integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation
- Review the test files for usage examples

---

**FleetLink Backend** - Production-grade logistics vehicle booking system built with modern Node.js practices.

#   F l e e t l i n k _ b a c k e n d  
 