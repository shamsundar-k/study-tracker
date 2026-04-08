import { z } from 'zod';

// ── Auth schemas ──────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  weeklyHoursGoal: z.number().min(0).optional(),
  customPlatforms: z.array(z.string().min(1).trim()).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// ── Item schemas ──────────────────────────────────────────────────────────────

const platforms = ['Coursera', "O'Reilly", 'Frontend Masters', 'Udemy', 'YouTube'] as const;
const itemTypes = ['Course', 'Book', 'Video'] as const;
const itemStatuses = ['active', 'paused', 'done'] as const;

// Valid platform → type combinations
const platformTypeMap: Record<(typeof platforms)[number], (typeof itemTypes)[number][]> = {
  Coursera: ['Course'],
  "O'Reilly": ['Course', 'Book', 'Video'],
  'Frontend Masters': ['Course'],
  Udemy: ['Course', 'Video'],
  YouTube: ['Video'],
};

const itemBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  platform: z.string().min(1, 'Platform is required'),
  type: z.enum(itemTypes),
  progress: z.number().int().min(0).max(100).default(0),
  hours: z.number().min(0).optional(),
  deadline: z.string().optional(),
  status: z.enum(itemStatuses).default('active'),
  tags: z.array(z.string().trim()).optional().default([]),
  note: z.string().trim().optional(),
  archived: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

export const itemCreateSchema = itemBaseSchema.refine(
  (data) => {
    const allowed = platformTypeMap[data.platform as (typeof platforms)[number]];
    return !allowed || allowed.includes(data.type);
  },
  (data) => ({
    message: `Type "${data.type}" is not valid for platform "${data.platform}"`,
    path: ['type'],
  }),
);

export const itemUpdateSchema = itemBaseSchema.partial().refine(
  (data) => {
    if (data.platform && data.type) {
      const allowed = platformTypeMap[data.platform as (typeof platforms)[number]];
      return !allowed || allowed.includes(data.type);
    }
    return true;
  },
  (data) => ({
    message: `Type "${data.type}" is not valid for platform "${data.platform}"`,
    path: ['type'],
  }),
);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ItemCreateInput = z.infer<typeof itemCreateSchema>;
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;
