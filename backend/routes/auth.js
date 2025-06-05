import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { verifyToken } from '../middleware/auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

// Generate a 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching user' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const userExists = await prisma.user.findUnique({
      where: { email: email }
    });

    if (userExists) {
      return res.status(409).json({ message: "Email already in use" });
    }
    
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        role: "USER"
      },
    });

    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60, 
    });

    return res.status(200).json({ message: `Registered successfully for ${email}` });
  }
  catch (error) {
    console.error("Registration failed")
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // User does not exist
    if (!user) {
      return res.status(401).json({ message: 'User with this email does not exist' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Incorrect password
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, 
    });

    return res.status(200).json({ message: 'Login successful' });
  }
  catch (error) {
    return res.status(500).json({ message: "Login failed" });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
  });
  
  res.status(200).json({ message: 'Logged out successfully' });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Return success even if user doesn't exist for security
      return res.status(200).json({ 
        message: 'If an account exists with this email, you will receive a verification code.' 
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 15 * 60000); // 15 minutes from now

    // Store the verification code in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        resetToken: verificationCode,
        resetTokenExpiry: codeExpiry
      }
    });

    // Send the email
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Password Reset Verification Code',
      text: `Your verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes.`,
      html: `
        <p>Your verification code is:</p>
        <h2 style="font-size: 24px; letter-spacing: 2px; color: #333;">${verificationCode}</h2>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Verification code sent successfully to:', email);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      throw emailError;
    }

    return res.status(200).json({ 
      message: 'If an account exists with this email, you will receive a verification code.',
      email: email // Send back email for verification step
    });
  } catch (error) {
    console.error('Password reset request failed:', error);
    return res.status(500).json({ 
      message: 'Failed to process password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// New endpoint to verify the code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Check if code has expired
    if (new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Check if code matches
    if (user.resetToken !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Generate a temporary token for password reset
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({ 
      message: 'Code verified successfully',
      resetToken
    });
  } catch (error) {
    console.error('Code verification failed:', error);
    return res.status(500).json({ message: 'Failed to verify code' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset failed:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

export default router;