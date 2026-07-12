import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';
import { connectDB } from '../config/db';

dotenv.config();

const adminName = process.env.ADMIN_NAME || 'Admin User';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@dealership.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';

async function seedAdmin() {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingAdmin) {
      console.log(`Admin user with email "${adminEmail}" already exists.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const admin = new User({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
    });

    await admin.save();
    console.log(`Successfully created admin user:`);
    console.log(`- Email: ${adminEmail}`);
    console.log(`- Password: ${adminPassword}`);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

seedAdmin();
