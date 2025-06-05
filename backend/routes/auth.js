import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { verifyToken } from '../middleware/auth.js';
const router = express.Router();

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

export default router;