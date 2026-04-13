import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/erp');
    const u = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    if (u) {
      console.log(`MOBILE: ${u.mobile}`);
      // For testing, update password to 'password123'
      const bcrypt = await import('bcryptjs');
      u.password = await bcrypt.default.hash('password123', 10);
      u.passwordLength = 11;
      await u.save();
      console.log("PASSWORD_UPDATED: password123");
    } else {
      console.log("ADMIN_NOT_FOUND");
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}
run();
