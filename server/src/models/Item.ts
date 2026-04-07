import { Schema, model, Document, Types } from 'mongoose';

export type Platform = 'Coursera' | "O'Reilly" | 'Frontend Masters';
export type ItemType = 'Course' | 'Book' | 'Video';
export type ItemStatus = 'active' | 'paused' | 'done';

export interface IItem extends Document {
  userId: Types.ObjectId;
  name: string;
  platform: Platform;
  type: ItemType;
  progress: number;
  hours?: number;
  deadline?: Date;
  status: ItemStatus;
  tags: string[];
  note?: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    platform: {
      type: String,
      required: true,
      enum: ['Coursera', "O'Reilly", 'Frontend Masters'],
    },
    type: {
      type: String,
      required: true,
      enum: ['Course', 'Book', 'Video'],
    },
    progress: { type: Number, required: true, min: 0, max: 100, default: 0 },
    hours: { type: Number, min: 0 },
    deadline: { type: Date },
    status: {
      type: String,
      required: true,
      enum: ['active', 'paused', 'done'],
      default: 'active',
    },
    tags: { type: [String], default: [] },
    note: { type: String, trim: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Item = model<IItem>('Item', itemSchema);
