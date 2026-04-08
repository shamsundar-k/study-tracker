import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../schemas/index.js';

const router = Router();

// In production the frontend and backend are on different subdomains, so the
// cookie must be SameSite=None + Secure to be sent on cross-origin requests.
// Locally (development) SameSite=Strict is fine because Vite proxies all /api
// calls to the same origin.
const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict',
  secure: isProd, // SameSite=None requires Secure=true
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    return;
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      // Don't reveal whether the email exists
      res.status(409).json({ message: 'Unable to register with that email' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const secret = process.env.JWT_SECRET ?? '';
    const token = jwt.sign({ userId: String(user._id) }, secret, { expiresIn: '7d' });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', verifyToken, (_req: Request, res: Response): void => {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: 'Logged out' });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user: { _id: user._id, name: user.name, email: user.email, weeklyHoursGoal: user.weeklyHoursGoal, customPlatforms: user.customPlatforms, createdAt: user.createdAt } });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── PUT /api/auth/me ──────────────────────────────────────────────────────────
router.put('/me', verifyToken, async (req: Request, res: Response): Promise<void> => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    return;
  }

  try {
    const { name, email, weeklyHoursGoal, customPlatforms } = parsed.data;

    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user!.userId } });
      if (existing) {
        res.status(409).json({ message: 'Email already in use' });
        return;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(weeklyHoursGoal !== undefined && { weeklyHoursGoal }),
        ...(customPlatforms !== undefined && { customPlatforms }),
      },
      { new: true },
    ).select('-passwordHash');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user: { _id: user._id, name: user.name, email: user.email, weeklyHoursGoal: user.weeklyHoursGoal, customPlatforms: user.customPlatforms } });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── PUT /api/auth/me/password ─────────────────────────────────────────────────
router.put('/me/password', verifyToken, async (req: Request, res: Response): Promise<void> => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
