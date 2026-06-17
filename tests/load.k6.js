import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const metricsLatency = new Trend('metrics_latency');
const healthLatency = new Trend('health_latency');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m30s', target: 50 }, // Ramp up to 50 users
    { duration: '20s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    errors: ['rate<0.1'],             // Error rate should be < 10%
    'metrics_latency': ['p(95)<500'],  // 95th percentile latency < 500ms
    'health_latency': ['p(95)<200'],
  },
};

export default function () {
  // Test /metrics endpoint
  const metricsRes = http.get('http://localhost:9091/metrics');
  metricsLatency.add(metricsRes.timings.duration);
  check(metricsRes, {
    'metrics status ok': (r) => r.status === 200,
    'metrics has pools_fetched': (r) => r.body.includes('pools_fetched_total'),
  }) || errorRate.add(1);

  sleep(1);

  // Test /health endpoint
  const healthRes = http.get('http://localhost:9091/health');
  healthLatency.add(healthRes.timings.duration);
  check(healthRes, {
    'health status ok': (r) => r.status === 200,
    'health response valid': (r) => JSON.parse(r.body).status === 'ok',
  }) || errorRate.add(1);

  sleep(1);
}
