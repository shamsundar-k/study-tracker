import { Schema, model, Document, Types } from 'mongoose';

export interface IJournal extends Document {
  userId: Types.ObjectId;
  title: string;
  body: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const journalSchema = new Schema<IJournal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true, default: '' },
    body: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Journal = model<IJournal>('Journal', journalSchema);
