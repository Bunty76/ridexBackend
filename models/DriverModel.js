import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const driverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    vehicle: {
        type: {
            type: String,
            enum: ['bike', 'auto', 'economy', 'premium'],
            required: true
        },
        model: { type: String, required: true },
        plateNumber: { type: String, required: true },
        color: { type: String, required: true }
    },
    rating: {
        type: Number,
        default: 5.0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['ONLINE', 'OFFLINE'],
        default: 'OFFLINE'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    }
}, { timestamps: true });

driverSchema.index({ location: '2dsphere' });

// Hash password before saving
driverSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
driverSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Driver = mongoose.model('Driver', driverSchema);

export default Driver;
