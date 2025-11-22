import { config } from 'dotenv';
import { ServerConfig } from '@/types';

// Load environment variables
config();

export class ConfigService {
  private static instance: ConfigService;
  private config: ServerConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfig(): ServerConfig {
    const requiredEnvVars = ['JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
      );
    }

    return {
      port: parseInt(process.env.PORT || '8040', 10),
      host: process.env.HOST || 'localhost',
      nodeEnv: process.env.NODE_ENV || 'development',
      dbPath:
        process.env.NODE_ENV === 'production'
          ? '/data/storage.db'
          : process.env.DB_PATH || './data/storage.db',
      jwtSecret: process.env.JWT_SECRET!,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      rateLimitWindowMs: parseInt(
        process.env.RATE_LIMIT_WINDOW_MS || '900000',
        10
      ),
      rateLimitMaxRequests: parseInt(
        process.env.RATE_LIMIT_MAX_REQUESTS || '100',
        10
      ),
      logLevel: process.env.LOG_LEVEL || 'info',
      logFile: process.env.LOG_FILE || './logs/server.log',
    };
  }

  public get(): ServerConfig {
    return this.config;
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }
}

export const configService = ConfigService.getInstance();