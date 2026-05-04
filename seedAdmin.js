import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/AdminModel.js';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
connectDB();

const seedAdmin = async () => {
  try {
    await Admin.deleteMany({ email: 'admin@ridex.com' });

    const admin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@ridex.com',
      password: 'password123',
    });

    console.log('Admin seeded successfully:', admin.email);
    process.exit();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
