import { api } from './client';
import type { ItemCreateInput, ItemUpdateInput, Platform, ItemType, ItemStatus, Priority } from '../schemas';

export interface Item {
  _id: string;
  userId: string;
  name: string;
  platform: Platform;
  type: ItemType;
  progress: number;
  hours?: number;
  deadline?: string;
  status: ItemStatus;
  tags: string[];
  note?: string;
  archived: boolean;
  priority: Priority;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const itemsApi = {
  getAll: () =>
    api.get<{ items: Item[] }>('/items'),

  create: (data: ItemCreateInput) =>
    api.post<{ item: Item }>('/items', data),

  update: (id: string, data: ItemUpdateInput) =>
    api.put<{ item: Item }>(`/items/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/items/${id}`),
};
