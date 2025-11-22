#!/usr/bin/env tsx

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createWsServer } from 'tinybase/synchronizers/synchronizer-ws-server';
import { createMergeableStore } from 'tinybase';
import { createSqlite3Persister } from 'tinybase/persisters/persister-sqlite3';
import sqlite3 from 'sqlite3';

import { configService } from './services/config.js';
import { logger } from './services/logger.js';
import { dbService } from './db/database.js';

import type { WebSocketWithUserId } from './types/index.js';

class BucketServer {
  private app: express.Application;
  private httpServer: any;
  private wss: WebSocketServer;
  private tinybaseServer: any;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.wss = new WebSocketServer({
      server: this.httpServer,
      host: configService.get().nodeEnv === 'production' ? '0.0.0.0' : 'localhost',
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));

    // CORS configuration
    const config = configService.get();
    this.app.use(cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Request logging
    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      const config = configService.get();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime,
        version: '2.0.0',
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
        },
        database: {
          connected: true, // We'll check this in the future
          path: config.dbPath,
        },
      });
    });

    // API info endpoint
    this.app.get('/api', (_req, res) => {
      const config = configService.get();
      res.json({
        name: 'Bucket Server API',
        version: '2.0.0',
        description: 'Real-time sync server with user management',
        endpoints: {
          health: '/health',
          websocket: `ws://${config.host}:${config.port}/<userId>`,
        },
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
      });
    });
  }

  private setupWebSocket(): void {
    // Log WebSocket connections
    this.wss.on('connection', (ws: WebSocketWithUserId, req) => {
      const path = req.url || '';
      logger.info(`New WebSocket connection on path: ${path}`);

      ws.on('close', () => {
        logger.info(`WebSocket disconnected from path: ${path}`);
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket error on path ${path}:`, error);
      });
    });

    // Create TinyBase WebSocket server with user isolation
    this.tinybaseServer = createWsServer(
      this.wss,
      // Create a persister for each user (pathId = userId)
      (pathId) => {
        logger.info(`Creating persister for user: ${pathId}`);
        const store = createMergeableStore();

        // Use SQLite with user-specific table prefix for proper isolation
        const db = new sqlite3.Database(configService.get().dbPath);
        const persister = createSqlite3Persister(store, db, {
          mode: 'json',
          storeTableName: `tinybase_${pathId}`, // User-specific table name
          autoLoadIntervalSeconds: 1,
        });

        // Log when data changes
        store.addTablesListener(() => {
          const tables = store.getTables();
          const tableNames = Object.keys(tables);
          const counts = tableNames.map(
            (t) => `${t}: ${Object.keys(tables[t] || {}).length}`,
          );
          logger.info(`Store updated for ${pathId}: ${counts.join(', ')}`);
        });

        // Auto-load existing data for this user
        persister
          .startAutoLoad()
          .then(() => {
            const tables = store.getTables();
            const tableNames = Object.keys(tables);
            const counts = tableNames.map(
              (t) => `${t}: ${Object.keys(tables[t] || {}).length}`,
            );
            logger.info(`Loaded data for user ${pathId}: ${counts.join(', ')}`);
          })
          .catch((error) => {
            logger.info(`No existing data for user: ${pathId} (new user)`, error);
          });

        // Auto-save changes
        persister.startAutoSave().then(() => {
          logger.info(`Auto-save started for user: ${pathId}`);
        });

        return persister;
      },
    );

    logger.info('TinyBase WebSocket server configured');
  }

  private setupErrorHandling(): void {
    // Error handling middleware
    this.app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Unhandled error:', err);
      res.status(err.status || 500).json({
        success: false,
        error: 'Internal Server Error',
        message: configService.get().nodeEnv === 'development' ? err.message : undefined,
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown();
    });
  }

  public async start(): Promise<void> {
    try {
      // Ensure database is initialized
      await dbService.init();
      await dbService.getDatabase();

      // Get config once for this method
      const config = configService.get();

      // Start the HTTP server
      this.httpServer.listen(
        config.port,
        config.nodeEnv === 'production' ? '0.0.0.0' : 'localhost',
        () => {
          const host = config.nodeEnv === 'production' ? '0.0.0.0' : config.host;
          logger.info(`🚀 Bucket Server v2.0.0 started successfully!`);
          logger.info(`🔄 HTTP server: http://${host}:${config.port}`);
          logger.info(`🔌 WebSocket server: ws://${host}:${config.port}`);
          logger.info(`📁 Data persistence: ${config.dbPath}`);
          logger.info(`🏥 Health check: http://${host}:${config.port}/health`);
          logger.info(`💡 Connect with: ws://${host}:${config.port}/<userId>`);
          logger.info(`🌍 Environment: ${config.nodeEnv}`);
        },
      );

      // Handle graceful shutdown
      process.on('SIGINT', () => this.gracefulShutdown());
      process.on('SIGTERM', () => this.gracefulShutdown());

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async gracefulShutdown(): Promise<void> {
    logger.info('🛑 Shutting down Bucket Server...');

    try {
      // Destroy TinyBase server
      if (this.tinybaseServer) {
        this.tinybaseServer.destroy();
        logger.info('✅ TinyBase server shut down');
      }

      // Close HTTP server
      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer.close(() => {
            logger.info('✅ HTTP server shut down');
            resolve();
          });
        });
      }

      // Close database connections
      await dbService.close();
      logger.info('✅ Database connections closed');

      logger.info('👋 Bucket Server shut down gracefully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new BucketServer();
server.start();