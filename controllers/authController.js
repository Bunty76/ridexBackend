import Driver from '../models/DriverModel.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new driver
// @route   POST /auth/register
// @access  Public
export const registerDriver = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const driverExists = await Driver.findOne({ email });

        if (driverExists) {
            return res.status(400).json({ message: 'Driver already exists' });
        }

        const driver = await Driver.create({
            name,
            email,
            password
        });

        if (driver) {
            res.status(201).json({
                _id: driver._id,
                name: driver.name,
                email: driver.email,
                status: driver.status
            });
        } else {
            res.status(400).json({ message: 'Invalid driver data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Auth driver & get token
// @route   POST /auth/login
// @access  Public
export const loginDriver = async (req, res) => {
    const { email, password } = req.body;

    try {
        const driver = await Driver.findOne({ email });

        if (driver && (await driver.matchPassword(password))) {
            res.json({
                _id: driver._id,
                name: driver.name,
                email: driver.email,
                status: driver.status,
                token: generateToken(driver._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update driver status (ONLINE/OFFLINE)
// @route   PATCH /driver/status
// @access  Private
export const updateDriverStatus = async (req, res) => {
    const { status } = req.body;

    if (!['ONLINE', 'OFFLINE'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be ONLINE or OFFLINE' });
    }

    try {
        const driver = await Driver.findById(req.driver._id);

        if (driver) {
            driver.status = status;
            await driver.save();
            res.json({
                _id: driver._id,
                name: driver.name,
                status: driver.status
            });
        } else {
            res.status(404).json({ message: 'Driver not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
};
