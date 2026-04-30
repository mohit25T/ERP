import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Check if super admin already exists
    let admin = await User.findOne({ email: "admin@erp.com" });
    const hashedPassword = await bcrypt.hash("admin123", 10);

    if (admin) {
      admin.mobile = "1234567890";
      admin.role = "super_admin";
      admin.password = hashedPassword;
      await admin.save();
      console.log("SUCCESS: Super Admin updated: Mobile: 1234567890 / Pass: admin123");
      process.exit();
    }

    await User.create({
      name: "Global Super Admin",
      email: "admin@erp.com",
      mobile: "1234567890",
      password: hashedPassword,
      role: "super_admin"
    });

    console.log("SUCCESS: Super Admin created: Mobile: 1234567890 / Pass: admin123");
    process.exit();
  } catch (error) {
    console.error("Error with script: ", error);
    process.exit(1);
  }
};

seedSuperAdmin();
