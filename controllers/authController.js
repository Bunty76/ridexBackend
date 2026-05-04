import Driver from '../models/DriverModel.js';
import Admin from '../models/AdminModel.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new driver
// @route   POST /auth/register
// @access  Public
export const registerDriver = async (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide name, email and password' });
    }

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
                status: driver.status,
                token: generateToken(driver._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid driver data' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Auth driver & get token
// @route   POST /auth/login
// @access  Public
export const loginDriver = async (req, res, next) => {
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
        next(error);
    }
};

// @desc    Update driver status (ONLINE/OFFLINE)
// @route   PATCH /driver/status
// @access  Private
export const updateDriverStatus = async (req, res, next) => {
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
        next(error);
    }
};
// @desc    Auth admin & get token
// @route   POST /admin/login
// @access  Public
export const loginAdmin = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        const admin = await Admin.findOne({ email });

        if (admin && (await admin.matchPassword(password))) {
            res.json({
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                token: generateToken(admin._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        next(error);
    }
};
