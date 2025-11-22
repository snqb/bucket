import winston from 'winston';
import { configService } from './config';

const config = configService.get();

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, stack }) => {
      if (stack) {
        return `${timestamp} [${level}]: ${message}\n${stack}`;
      }
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: config.logFile,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: config.logFile.replace('.log', '.exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: config.logFile.replace('.log', '.rejections.log') })
  ]
});

export { logger };