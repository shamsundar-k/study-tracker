import { api } from './client';
import type { RegisterInput, LoginInput } from '../schemas';

export interface User {
  _id: string;
  name: string;
  email: string;
  weeklyHoursGoal?: number;
  createdAt?: string;
}

export const authApi = {
  register: (data: RegisterInput) =>
    api.post<{ user: User }>('/auth/register', data),

  login: (data: LoginInput) =>
    api.post<{ user: User }>('/auth/login', data),

  logout: () =>
    api.post<{ message: string }>('/auth/logout', {}),

  me: () =>
    api.get<{ user: User }>('/auth/me'),

  updateProfile: (data: { name?: string; email?: string; weeklyHoursGoal?: number }) =>
    api.put<{ user: User }>('/auth/me', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<{ message: string }>('/auth/me/password', data),
};
