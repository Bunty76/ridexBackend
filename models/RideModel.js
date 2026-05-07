import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver'
    },
    pickupLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        },
        address: String
    },
    dropoffLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        },
        address: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    fare: {
        type: Number,
        default: 0
    },
    vehicleType: {
        type: String,
        enum: ['bike', 'auto', 'economy', 'premium'],
        required: true
    },
    duration: {
        type: Number, // estimated duration in minutes
        default: 0
    },
    distance: {
        type: Number, // in km or miles
        default: 0
    },
    otp: {
        type: String,
        default: null
    },
    driversNotifiedCount: {
        type: Number,
        default: 0
    },
    driversRejectedCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

rideSchema.index({ pickupLocation: '2dsphere' });
rideSchema.index({ dropoffLocation: '2dsphere' });

const Ride = mongoose.model('Ride', rideSchema);

export default Ride;
