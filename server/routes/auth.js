const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "drivekhata_secret_2024";

// In-memory store for reset codes { email: { code, expiresAt } }
const resetCodes = {};

// ─── Email transporter ───
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,  // your Gmail in .env
    pass: process.env.EMAIL_PASS,  // Gmail App Password in .env
  },
});

// REGISTER (run once to create your account)
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed });

    res.json({ message: "User created", id: user._id });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Register error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login error" });
  }
});

// FORGOT PASSWORD — generate & email code
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return res.json({ message: "If this email exists, a code was sent." });
    }

    // Generate 6-digit code, valid for 15 minutes
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodes[email] = { code, expiresAt: Date.now() + 15 * 60 * 1000 };

    // Send email
    await transporter.sendMail({
      from: `"DriveKhata" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "DriveKhata Password Reset Code",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 24px; border: 1.5px solid #ddd6fe; border-radius: 16px; background: #faf8ff;">
          <div style="font-size: 28px; font-weight: 900; color: #7c3aed; letter-spacing: -1px; margin-bottom: 8px;">DriveKhata</div>
          <div style="font-size: 16px; color: #1e1b4b; font-weight: 700; margin-bottom: 16px;">Your Password Reset Code</div>
          <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; font-size: 32px; font-weight: 900; letter-spacing: 8px; text-align: center; border-radius: 12px; padding: 18px 0; margin-bottom: 16px;">
            ${code}
          </div>
          <div style="font-size: 13px; color: #9ca3af;">This code expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email.</div>
        </div>
      `,
    });

    res.json({ message: "If this email exists, a code was sent." });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Error sending reset email" });
  }
});

// RESET PASSWORD — verify code + set new password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const record = resetCodes[email];
    if (!record) return res.status(400).json({ message: "No reset request found. Please request a new code." });
    if (Date.now() > record.expiresAt) {
      delete resetCodes[email];
      return res.status(400).json({ message: "Code expired. Please request a new one." });
    }
    if (record.code !== code) {
      return res.status(400).json({ message: "Invalid code. Check your email." });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashed });
    delete resetCodes[email];

    res.json({ message: "Password reset successfully. You can now login." });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Error resetting password" });
  }
});

module.exports = router;