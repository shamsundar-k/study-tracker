import { z } from 'zod';

// ── Auth schemas ──────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ── Item schemas ──────────────────────────────────────────────────────────────

export const platforms = ['Coursera', "O'Reilly", 'Frontend Masters'] as const;
export const itemTypes = ['Course', 'Book', 'Video'] as const;
export const itemStatuses = ['active', 'paused', 'done'] as const;

export type Platform = (typeof platforms)[number];
export type ItemType = (typeof itemTypes)[number];
export type ItemStatus = (typeof itemStatuses)[number];

export const platformTypeMap: Record<Platform, ItemType[]> = {
  Coursera: ['Course'],
  "O'Reilly": ['Course', 'Book', 'Video'],
  'Frontend Masters': ['Course'],
};

const itemBaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  platform: z.enum(platforms),
  type: z.enum(itemTypes),
  progress: z.number().int().min(0).max(100).default(0),
  hours: z.number().min(0).optional(),
  deadline: z.string().optional(),
  status: z.enum(itemStatuses).default('active'),
  tags: z.array(z.string()).optional().default([]),
  note: z.string().optional(),
  archived: z.boolean().optional(),
});

export const itemCreateSchema = itemBaseSchema.refine(
  (data) => platformTypeMap[data.platform].includes(data.type),
  (data) => ({
    message: `"${data.type}" is not available on ${data.platform}`,
    path: ['type'],
  }),
);

export const itemUpdateSchema = itemBaseSchema.partial().refine(
  (data) => {
    if (data.platform && data.type) {
      return platformTypeMap[data.platform].includes(data.type);
    }
    return true;
  },
  (data) => ({
    message: `"${data.type}" is not available on ${data.platform}`,
    path: ['type'],
  }),
);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ItemCreateInput = z.infer<typeof itemCreateSchema>;
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;
