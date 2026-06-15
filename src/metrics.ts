import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const poolsFetched = new client.Counter({
  name: 'pools_fetched_total',
  help: 'Number of pools fetched',
  labelNames: ['source'],
  registers: [register],
});

export const lastFetch = new client.Gauge({
  name: 'pools_last_fetch_timestamp',
  help: 'Last fetch timestamp for source',
  labelNames: ['source'],
  registers: [register],
});

export const fetchDuration = new client.Histogram({
  name: 'pools_fetch_duration_seconds',
  help: 'Fetch duration in seconds',
  labelNames: ['source'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export function metricsMetrics() {
  return register.metrics();
}

export { register };
