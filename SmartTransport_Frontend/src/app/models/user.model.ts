export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  role: 'ADMIN' | 'USER' | 'DRIVER' | 'PASSENGER';
  organizationDomain: string;
  department: string;
  city: string;
  profilePic: string;
  enabled: boolean;
  createdAt: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  department: string;
  city: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
}

