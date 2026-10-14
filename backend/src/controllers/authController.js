import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );
};

export const registerUser = async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: "A valid request body is required",
      });
    }

    const { name, email, password, status, role } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashPassword,
      status,
      role,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: "A valid request body is required",
      });
    }
    const { email, password } = body;
    if (!email.trim() || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const token = generateToken(user);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProfile = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    // Use the same response whether or not the email exists.
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the account exists, a reset link will be sent.",
      });
    }

    // Generate a secure random token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the SHA-256 hash of the token.
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires after 15 minutes.
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Reset Your Password",
        text: `Open this link to reset your password: ${resetURL}\n\nThis link expires in 15 minutes.`,
      });
    } catch (emailError) {
      // Invalidate the token if sending the email fails.
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message: "If the account exists, a reset link will be sent.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Hash the incoming token to compare with the stored hash.
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or has expired",
      });
    }

    // The User model's pre-save hook hashes this password.
    user.password = password;

    // Make the reset link usable only once.
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    next(error);
  }
};

export const createDummyUsers = async () => {
  try {
    const TOTAL_USERS = 100000;
    const BATCH_SIZE = 5000;

    // Hash the password only once for better performance.
    const hashedPassword = await bcrypt.hash("Test@12345", 10);

    const roles = ["admin", "manager", "staff"];
    const statuses = ["active", "inactive"];

    for (let start = 0; start < TOTAL_USERS; start += BATCH_SIZE) {
      const end = Math.min(start + BATCH_SIZE, TOTAL_USERS);
      const users = [];

      for (let i = start + 1; i <= end; i++) {
        users.push({
          name: `Test User ${i}`,
          email: `dummyuser${String(i).padStart(6, "0")}@example.com`,
          password: hashedPassword,
          status: Math.random() < 0.9 ? "active" : "inactive",
          role: i <= 10 ? "admin" : roles[Math.floor(Math.random() * roles.length)],
          resetPasswordToken: null,
          resetPasswordExpires: null,
        });
      }

      await User.insertMany(users, { ordered: false });

      console.log(
        `Inserted batch: ${end}/${TOTAL_USERS} users`
      );
    }

    res.status(200).json({
      success : true,
      message : 'Successfully created 100,000 dummy users!'
    })

  } catch (error) {
    console.error("Error creating dummy users:", error.message);
    throw error;
  }
};