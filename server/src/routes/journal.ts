import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Journal } from '../models/Journal.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = Router();

router.use(verifyToken);

const createSchema = z.object({
  title: z.string().trim().optional().default(''),
  body: z.string().min(1, 'Body is required').trim(),
  tags: z.array(z.string().trim()).optional().default([]),
});

const updateSchema = createSchema.partial();

// ── GET /api/journal ──────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const entries = await Journal.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    res.json({ entries });
  } catch (err) {
    console.error('Get journal error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── POST /api/journal ─────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    return;
  }

  try {
    const entry = await Journal.create({ ...parsed.data, userId: req.user!.userId });
    res.status(201).json({ entry });
  } catch (err) {
    console.error('Create journal error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── PUT /api/journal/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({ message: 'Entry not found' });
    return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    return;
  }

  try {
    const entry = await Journal.findById(id);
    if (!entry) {
      res.status(404).json({ message: 'Entry not found' });
      return;
    }
    if (String(entry.userId) !== req.user!.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const updated = await Journal.findByIdAndUpdate(id, { $set: parsed.data }, { new: true });
    res.json({ entry: updated });
  } catch (err) {
    console.error('Update journal error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── DELETE /api/journal/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({ message: 'Entry not found' });
    return;
  }

  try {
    const entry = await Journal.findById(id);
    if (!entry) {
      res.status(404).json({ message: 'Entry not found' });
      return;
    }
    if (String(entry.userId) !== req.user!.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await entry.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete journal error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
