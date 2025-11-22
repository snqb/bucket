import sqlite3 from 'sqlite3';
import { configService } from '@/services/config';
import { logger } from '@/services/logger';
import { promises as fs } from 'fs';
import path from 'path';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: sqlite3.Database | null = null;
  private config = configService.get();
  private initialized = false;

  private constructor() {
    // Don't initialize in constructor - call init() explicitly
  }

  public async init(): Promise<void> {
    if (!this.initialized) {
      await this.initializeDatabase();
      this.initialized = true;
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Ensure data directory exists
        const dbDir = path.dirname(this.config.dbPath);
        fs.mkdir(dbDir, { recursive: true }).then(() => {
          // Open database connection
          this.db = new sqlite3.Database(this.config.dbPath, (err) => {
            if (err) {
              logger.error('Failed to open database:', err);
              reject(err);
              return;
            }

            // Configure SQLite for better performance
            this.db!.run('PRAGMA journal_mode = WAL');
            this.db!.run('PRAGMA synchronous = NORMAL');
            this.db!.run('PRAGMA cache_size = 1000000');
            this.db!.run('PRAGMA temp_store = memory');

            // Run migrations
            this.runMigrations().then(() => {
              logger.info(`Database initialized: ${this.config.dbPath}`);
              resolve();
            }).catch(reject);
          });
        });
      } catch (error) {
        logger.error('Failed to initialize database:', error);
        reject(error);
      }
    });
  }

  private async runMigrations(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // Create migrations table if it doesn't exist
      this.db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Define migrations
        const migrations = [
          {
            name: '001_create_users_table',
            sql: `
              CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login_at DATETIME,
                is_active INTEGER DEFAULT 1
              )
            `
          },
          {
            name: '002_create_sessions_table',
            sql: `
              CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
              )
            `
          }
        ];

        // Run pending migrations
        let migrationsCompleted = 0;

        migrations.forEach((migration) => {
          this.db!.get('SELECT id FROM migrations WHERE name = ?', [migration.name], (err, row) => {
            if (err) {
              reject(err);
              return;
            }

            if (!row) {
              this.db!.serialize(() => {
                this.db!.run(migration.sql);
                this.db!.run('INSERT INTO migrations (name) VALUES (?)', [migration.name]);
                logger.info(`Migration executed: ${migration.name}`);
              });
            }

            migrationsCompleted++;
            if (migrationsCompleted === migrations.length) {
              resolve();
            }
          });
        });
      });
    });
  }

  public getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  public close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error('Error closing database:', err);
          } else {
            logger.info('Database connection closed');
          }
          this.db = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public healthCheck(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(false);
        return;
      }

      this.db.get('SELECT 1', (err) => {
        resolve(!err);
      });
    });
  }
}

export const dbService = DatabaseService.getInstance();