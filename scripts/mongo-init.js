// MongoDB initialization script for FleetLink database
// This script runs when the MongoDB container starts for the first time

// Switch to fleetlink database
db = db.getSiblingDB('fleetlink');

// Create application user with read/write permissions
db.createUser({
  user: 'fleetlink_user',
  pwd: 'fleetlink_password',
  roles: [
    {
      role: 'readWrite',
      db: 'fleetlink'
    }
  ]
});

// Create indexes for better performance
print('Creating indexes for vehicles collection...');
db.vehicles.createIndex({ "capacityKg": 1, "isActive": 1 });
db.vehicles.createIndex({ "vehicleType": 1, "isActive": 1 });
db.vehicles.createIndex({ "registrationNumber": 1 }, { unique: true, sparse: true });
db.vehicles.createIndex({ "name": "text" });

print('Creating indexes for bookings collection...');
db.bookings.createIndex({ "vehicleId": 1, "startTime": 1, "endTime": 1 });
db.bookings.createIndex({ "customerId": 1, "status": 1 });
db.bookings.createIndex({ "status": 1, "startTime": 1 });
db.bookings.createIndex({ "fromPincode": 1, "toPincode": 1, "startTime": 1 });
db.bookings.createIndex({ "startTime": 1 });
db.bookings.createIndex({ "endTime": 1 });

// Insert sample data for testing
print('Inserting sample vehicles...');
db.vehicles.insertMany([
  {
    name: "Heavy Duty Truck",
    capacityKg: 15000,
    tyres: 10,
    vehicleType: "truck",
    registrationNumber: "TRK001",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Delivery Van",
    capacityKg: 3000,
    tyres: 4,
    vehicleType: "van",
    registrationNumber: "VAN001",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Small Pickup",
    capacityKg: 1500,
    tyres: 4,
    vehicleType: "pickup",
    registrationNumber: "PKP001",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Large Trailer",
    capacityKg: 25000,
    tyres: 18,
    vehicleType: "trailer",
    registrationNumber: "TRL001",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Express Motorcycle",
    capacityKg: 50,
    tyres: 2,
    vehicleType: "motorcycle",
    registrationNumber: "MCL001",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Sample data inserted successfully!');
print('FleetLink database initialization completed.');

