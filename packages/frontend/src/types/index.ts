export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiErrorResponse {
  message: string;
}
