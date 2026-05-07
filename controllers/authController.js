import Driver from '../models/DriverModel.js';
import Admin from '../models/AdminModel.js';
import User from '../models/UserModel.js';
import Otp from '../models/OtpModel.js';
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
    const { name, email, password, phone, vehicle } = req.body;

    if (!name || !email || !password || !phone || !vehicle || !vehicle.type || !vehicle.model || !vehicle.plateNumber || !vehicle.color) {
        return res.status(400).json({ message: 'Please provide name, email, password, phone, and complete vehicle details' });
    }

    try {
        const driverExists = await Driver.findOne({ email });

        if (driverExists) {
            return res.status(400).json({ message: 'Driver already exists' });
        }

        const driver = await Driver.create({
            name,
            email,
            password,
            phone,
            vehicle
        });

        if (driver) {
            res.status(201).json({
                _id: driver._id,
                name: driver.name,
                email: driver.email,
                phone: driver.phone,
                vehicle: driver.vehicle,
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

// @desc    Register a new user
// @route   POST /user/register
// @access  Public
export const registerUser = async (req, res, next) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
        return res.status(400).json({ message: 'Please provide name, email, phone and password' });
    }

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            phone
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Auth user & get token
// @route   POST /user/login
// @access  Public
export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get user profile
// @route   GET /user/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /user/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Send OTP for user login/registration
// @route   POST /user/send-otp
// @access  Public
export const sendOtp = async (req, res, next) => {
    const { phone } = req.body;
    
    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    // Generate a random 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    try {
        // Clear any existing OTP for this phone
        await Otp.findOneAndDelete({ phone });
        
        // Save new OTP
        await Otp.create({ phone, otp: otpCode });

        // IMPORTANT: In a real production app, integrate Twilio, Fast2SMS, or Firebase here to actually send the SMS
        console.log(`\n\n==========================================`);
        console.log(`📱 SMS SIMULATION: OTP for ${phone} is ${otpCode}`);
        console.log(`==========================================\n\n`);

        res.json({ message: 'OTP sent successfully', testOtp: otpCode }); 
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP for user login/registration
// @route   POST /user/verify-otp
// @access  Public
export const verifyOtpUser = async (req, res, next) => {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
        return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    try {
        // Verify against DB
        const validOtp = await Otp.findOne({ phone, otp });

        if (!validOtp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // OTP is correct, remove it so it can't be reused
        await Otp.deleteOne({ _id: validOtp._id });

        const user = await User.findOne({ phone });

        if (user) {
            res.json({
                isNewUser: false,
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                token: generateToken(user._id),
            });
        } else {
            res.json({ isNewUser: true });
        }
    } catch (error) {
        next(error);
    }
};
