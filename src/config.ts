import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Load environment-specific config if it exists
const env = process.env.NODE_ENV || 'development';
const envConfigPath = path.join(process.cwd(), `.env.${env}`);
if (fs.existsSync(envConfigPath)) {
  dotenv.config({ path: envConfigPath });
}

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Database
  databaseUrl: z.string().url('DATABASE_URL must be a valid connection string'),
  databasePoolMin: z.coerce.number().int().positive().default(2),
  databasePoolMax: z.coerce.number().int().positive().default(10),
  
  // Data Output
  dataDir: z.string().default('./data'),
  
  // Logging
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  lokiUrl: z.string().url().optional(),
  
  // Metrics
  metricsPort: z.coerce.number().int().min(1024).max(65535).default(9091),
  
  // Tracing
  otelExporterEndpoint: z.string().url().optional(),
  otelServiceName: z.string().default('meteora-pipeline'),
  
  // API Configuration
  apiRetryAttempts: z.coerce.number().int().min(1).max(10).default(5),
  apiRetryBaseDelay: z.coerce.number().int().min(100).default(300),
  apiRequestTimeout: z.coerce.number().int().min(1000).default(30000),
  apiPageSize: z.coerce.number().int().min(1).max(100).default(50),
  
  // Alerting
  slackWebhookUrl: z.string().url().optional(),
  pagerdutyIntegrationKey: z.string().optional(),
  
  // Feature Flags
  enableDatabasePersistence: z.string().transform((v) => v === 'true').default('true'),
  enableTracing: z.string().transform((v) => v === 'true').default('true'),
  enableLokiLogging: z.string().transform((v) => v === 'true').default('false'),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const result = configSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    databasePoolMin: process.env.DATABASE_POOL_MIN,
    databasePoolMax: process.env.DATABASE_POOL_MAX,
    dataDir: process.env.DATA_DIR,
    logLevel: process.env.LOG_LEVEL,
    lokiUrl: process.env.LOKI_URL,
    metricsPort: process.env.METRICS_PORT,
    otelExporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    otelServiceName: process.env.OTEL_SERVICE_NAME,
    apiRetryAttempts: process.env.API_RETRY_ATTEMPTS,
    apiRetryBaseDelay: process.env.API_RETRY_BASE_DELAY,
    apiRequestTimeout: process.env.API_REQUEST_TIMEOUT,
    apiPageSize: process.env.API_PAGE_SIZE,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    pagerdutyIntegrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
    enableDatabasePersistence: process.env.ENABLE_DATABASE_PERSISTENCE,
    enableTracing: process.env.ENABLE_TRACING,
    enableLokiLogging: process.env.ENABLE_LOKI_LOGGING,
  });

  if (!result.success) {
    const errors = result.error.errors.map((e) => `  ${e.path.join('.')}: ${e.message}`).join('\n');
    console.error('Configuration validation failed:\n' + errors);
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
