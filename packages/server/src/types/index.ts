import { WebSocket } from 'ws';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface WebSocketWithUserId extends WebSocket {
  userId?: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  dbPath: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  logLevel: string;
  logFile: string;
}

export interface DatabaseSchema {
  users: {
    [userId: string]: User;
  };
  sessions: {
    [sessionId: string]: {
      userId: string;
      createdAt: Date;
      expiresAt: Date;
    };
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  memory: {
    used: number;
    total: number;
  };
  database: {
    connected: boolean;
    path: string;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}