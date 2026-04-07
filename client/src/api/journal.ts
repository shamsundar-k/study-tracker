import { api } from './client';

export interface JournalEntry {
  _id: string;
  userId: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalInput {
  title?: string;
  body: string;
  tags?: string[];
}

export const journalApi = {
  getAll: () =>
    api.get<{ entries: JournalEntry[] }>('/journal'),

  create: (data: JournalInput) =>
    api.post<{ entry: JournalEntry }>('/journal', data),

  update: (id: string, data: Partial<JournalInput>) =>
    api.put<{ entry: JournalEntry }>(`/journal/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/journal/${id}`),
};
