import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "../utils/sendOtpEmail.js";

// Register (Updated to require mobile)
export const register = async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res.status(400).json({ msg: "User with this mobile already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userCount = await User.countDocuments();
    const roleToSet = userCount === 0 ? "super_admin" : (role || "worker");

    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      role: roleToSet,
    });

    res.json({ msg: "User registered successfully", user: { id: user._id, name: user.name, mobile: user.mobile } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login Step 1: Verify Mobile/Password & Send OTP
export const loginStep1 = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(400).json({ msg: "Invalid mobile or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid mobile or password" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // DEBUG: Log OTP to server console (since email might be slow or failing)
    console.log(`[AUTH DEBUG] OTP for Mobile ${mobile}: ${otp}`);

    // Send the OTP via Email to the user's registered email address
    await sendOtpEmail(user.email, otp);

    res.json({ success: true, msg: `OTP sent to ${user.email}`, emailMasked: user.email.replace(/(.{2})(.*)(?=@)/, "$1***") });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login Step 2: Verify OTP and grant JWT
export const loginStep2 = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(400).json({ msg: "Invalid request" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ msg: "OTP has expired. Please log in again." });
    }

    // OTP is valid. Clear it out and sign JWT.
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email, mobile: user.mobile, gstin: user.gstin, state: user.state, companyName: user.companyName, address: user.address } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Current password does not match" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { name, gstin, companyName, address, state } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, gstin, companyName, address, state },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};