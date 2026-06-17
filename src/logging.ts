import winston from 'winston';
import Loki from 'winston-loki';
import dotenv from 'dotenv';

dotenv.config();

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    ),
  }),
];

// Add Loki transport if configured
if (process.env.LOKI_URL) {
  transports.push(
    new Loki({
      host: process.env.LOKI_URL,
      labels: {
        job: 'meteora-pipeline',
        env: process.env.NODE_ENV || 'development',
      },
      batching: true,
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
  defaultMeta: { service: 'meteora-pipeline' },
});
