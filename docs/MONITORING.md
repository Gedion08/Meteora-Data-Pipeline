# Monitoring & Alerting

This document describes the monitoring setup for the Meteora Data Pipeline.

## Metrics

The pipeline exposes Prometheus metrics on `/metrics` at port `9091` (configurable via `METRICS_PORT`).

### Key Metrics

- `pools_fetched_total` (Counter) — Total number of pools fetched per source (DLMM, DAMM_V2).
- `pools_last_fetch_timestamp` (Gauge) — Last successful fetch timestamp per source.
- `pools_fetch_duration_seconds` (Histogram) — Fetch duration distribution with source labels.
- `database_errors_total` (Counter) — Total database errors by operation.
- `validation_errors_total` (Counter) — Total validation errors by source.
- Standard Node.js metrics (process uptime, memory, CPU, etc.) collected by `prom-client`.

## Setup

### 1. Start Prometheus

Copy `monitoring/prometheus.yml` to your Prometheus config directory and start:

```bash
docker run --rm -p 9090:9090 -v $(pwd)/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

Visit http://localhost:9090 to view Prometheus UI.

### 2. Start Grafana

```bash
docker run --rm -p 3000:3000 -e GF_SECURITY_ADMIN_PASSWORD=admin grafana/grafana:latest
```

Visit http://localhost:3000 (user: admin, password: admin).

### 3. Add Prometheus Data Source

In Grafana:
1. Go to Configuration > Data Sources
2. Add Prometheus: http://localhost:9090
3. Save & Test

### 4. Import Dashboard

1. Go to Dashboards > Import
2. Upload `monitoring/grafana-dashboard.json` or paste the JSON content
3. Select Prometheus data source

### 5. Alerting (Optional)

Enable Alertmanager and update `monitoring/alerting.yml` with your notification channels (Slack, Email, PagerDuty, etc.):

```bash
docker run --rm -p 9093:9093 -v $(pwd)/monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml prom/alertmanager
```

Update `prometheus.yml` to point to your Alertmanager instance.

## SLOs

- **Availability**: Pools fetched successfully > 99% of the time.
- **Latency (p95)**: Fetch operations < 10s on average.
- **Freshness**: Last fetch within 1 hour (configurable).

## Queries

### High Error Rate
```promql
rate(pools_fetched_total{job="meteora-pipeline"}[5m]) == 0
```

### Fetch Latency (p95)
```promql
histogram_quantile(0.95, rate(pools_fetch_duration_seconds_bucket[5m]))
```

### Stale Fetch
```promql
(time() - pools_last_fetch_timestamp) > 3600
```

## Troubleshooting

- **Metrics not appearing**: Ensure `METRICS_PORT` is accessible and pipeline is running.
- **No data in Grafana**: Check Prometheus data source URL and Prometheus scrape config.
- **Alerts not firing**: Verify Alertmanager is running and configured in `prometheus.yml`.
