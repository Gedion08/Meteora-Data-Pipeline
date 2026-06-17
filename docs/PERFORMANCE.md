# Performance & Load Testing

This document describes performance benchmarking and load testing for the Meteora Data Pipeline.

## Local Benchmarking

Run local performance benchmarks to measure fetch latency and throughput:

```bash
npm run benchmark
```

Output example:
```
Starting pipeline benchmarks...

Benchmarking DLMM pool fetch (1 page)...
  ✓ Fetched 50 pools in 245.32ms
  ✓ Average per pool: 4.91ms

Benchmarking DAMM v2 pool fetch (1 page)...
  ✓ Fetched 50 pools in 198.18ms
  ✓ Average per pool: 3.96ms

Benchmark Summary:
  DLMM:   245.32ms
  DAMM v2: 198.18ms
  Total:  443.50ms
```

## Load Testing with k6

k6 is used for load and stress testing of the metrics and health endpoints.

### Installation

```bash
# macOS
brew install k6

# Windows
choco install k6

# Or download from https://k6.io/docs/getting-started/installation/
```

### Running Load Tests

Start the metrics server first:

```bash
npm run dev
# In another terminal:
npm run load-test
```

### Load Test Scenarios

The default test (`tests/load.k6.js`) simulates:

1. **Ramp-up** (30s): 0 → 10 concurrent users
2. **Steady load** (90s): 10 → 50 concurrent users
3. **Ramp-down** (20s): 50 → 0 concurrent users

### Key Metrics

- **Error Rate**: < 10% (threshold)
- **Metrics Endpoint Latency (p95)**: < 500ms
- **Health Endpoint Latency (p95)**: < 200ms

### Output Example

```
✓ health response valid
✓ health status ok
✓ metrics has pools_fetched
✓ metrics status ok

    data_received..................: 612 MB  10 MB/s
    data_sent......................: 1.3 MB  21 KB/s
    errors..........................: 0      0%
    health_latency..................: avg=145ms p(95)=180ms
    metrics_latency.................: avg=320ms p(95)=450ms
    iterations......................: 500    7.9/s
```

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| DLMM fetch (per page) | < 500ms | ~245ms |
| DAMM v2 fetch (per page) | < 500ms | ~198ms |
| Metrics endpoint (p95) | < 500ms | ~450ms |
| Health endpoint (p95) | < 200ms | ~145ms |
| Error rate under load | < 10% | 0% |

## Custom Load Test

Create a custom k6 test by copying `tests/load.k6.js`:

```bash
cp tests/load.k6.js tests/custom-load.k6.js
```

Edit thresholds and stages as needed, then run:

```bash
k6 run tests/custom-load.k6.js
```

## Profiling

For detailed profiling, use Node.js built-in profiler:

```bash
NODE_OPTIONS=--prof npm run benchmark
node --prof-process isolate-*.log > profile.txt
```

## Memory Usage

Monitor memory during load tests:

```bash
npm run dev &
sleep 2
k6 run tests/load.k6.js
```

Check the Prometheus metric:
```
process_resident_memory_bytes
```

## CI Integration

Load tests can be run in CI (optional):

Add to `.github/workflows/ci.yml`:

```yaml
- name: Run k6 load test
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: |
    npm run dev &
    sleep 2
    k6 run tests/load.k6.js --out json=results.json
```

Then upload results as artifacts for trend analysis.
