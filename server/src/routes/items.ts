import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Item } from '../models/Item.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { itemCreateSchema, itemUpdateSchema } from '../schemas/index.js';

const router = Router();

// All item routes require authentication
router.use(verifyToken);

// ── GET /api/items ────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await Item.find({ userId: req.user!.userId }).sort({ updatedAt: -1 });
    res.json({ items });
  } catch (err) {
    console.error('Get items error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── POST /api/items ───────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = itemCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    return;
  }

  try {
    const item = await Item.create({
      ...parsed.data,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      userId: req.user!.userId,
    });
    res.status(201).json({ item });
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── PUT /api/items/:id ────────────────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  const parsed = itemUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    return;
  }

  try {
    const item = await Item.findById(id);
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }

    if (String(item.userId) !== req.user!.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const $set: Record<string, unknown> = {
      ...parsed.data,
      ...(parsed.data.deadline !== undefined && {
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      }),
    };
    const $unset: Record<string, unknown> = {};

    if (parsed.data.status === 'done' && item.status !== 'done') {
      $set.completedAt = new Date();
    } else if (parsed.data.status !== undefined && parsed.data.status !== 'done') {
      $unset.completedAt = 1;
    }

    const updated = await Item.findByIdAndUpdate(
      id,
      Object.keys($unset).length ? { $set, $unset } : { $set },
      { new: true },
    );
    res.json({ item: updated });
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── DELETE /api/items/:id ─────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;

  if (!Types.ObjectId.isValid(id)) {
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  try {
    const item = await Item.findById(id);
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }

    if (String(item.userId) !== req.user!.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await item.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
