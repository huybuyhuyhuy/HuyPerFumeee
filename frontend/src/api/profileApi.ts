import apiClient, { unwrapApiData } from './apiClient';
import type { User } from '../types';

export async function getCurrentProfile() {
  const { data } = await apiClient.get<{ data: { user: User } }>('/auth/me');
  const responseData: any = unwrapApiData(data);
  return responseData.user ?? responseData;
}

export async function updateProfile(payload: Partial<User>) {
  const { data } = await apiClient.put<{ data: User }>('/auth/profile', payload);
  const responseData: any = unwrapApiData(data);
  return responseData.user ?? responseData;
}
