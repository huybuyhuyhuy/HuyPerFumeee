import apiClient, { unwrapApiData } from './apiClient';
import type { JwtResponse, LoginRequest, RegisterRequest, User } from '../types';

function unwrapAuthResponse(responseData: any): JwtResponse {
  return unwrapApiData(responseData);
}

export async function login(payload: LoginRequest) {
  const { data } = await apiClient.post<JwtResponse>('/auth/login', payload);
  return unwrapAuthResponse(data);
}

export async function register(payload: RegisterRequest) {
  const { data } = await apiClient.post<JwtResponse>('/auth/register', payload);
  return unwrapAuthResponse(data);
}

export async function getProfile() {
  const { data } = await apiClient.get<{ data: { user: User } }>('/auth/me');
  const payload = unwrapApiData(data);
  return payload.user;
}
