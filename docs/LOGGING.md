# Tracing & Centralized Logging

This document describes the distributed tracing and log aggregation setup for the Meteora Data Pipeline.

## OpenTelemetry Tracing

The pipeline uses OpenTelemetry for distributed tracing with OTLP (OpenTelemetry Protocol) exporter.

### Setup

1. Start an OTEL Collector or Jaeger backend:

```bash
docker run --rm -p 4318:4318 -p 16686:16686 jaegertracing/all-in-one:latest
```

2. Set the OTEL endpoint:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

3. Tracing is automatically enabled when the pipeline starts (see `src/tracing.ts`).

4. View traces in Jaeger UI: http://localhost:16686

## Centralized Logging with Loki

The pipeline sends structured logs to Grafana Loki for aggregation and querying.

### Setup

1. Start Loki:

```bash
docker run --rm -p 3100:3100 grafana/loki:latest
```

2. Configure log forwarding in your environment:

```bash
export LOKI_URL=http://localhost:3100
```

3. Logs are automatically batched and sent to Loki when configured.

### Viewing Logs in Grafana

1. Go to Grafana (http://localhost:3000)
2. Add Loki as a data source: http://localhost:3100
3. Explore logs with queries like:
   ```
   {job="meteora-pipeline"}
   ```

### Log Fields

Logs include:
- `job` — Identifies the service (meteora-pipeline)
- `env` — Environment label (development/production)
- `service` — Default metadata field
- `timestamp` — ISO 8601 timestamp
- `level` — Log level (info, warn, error, debug)
- `message` — Log message

### Log Queries

#### All logs for the pipeline
```
{job="meteora-pipeline"}
```

#### Error logs only
```
{job="meteora-pipeline"} | level="error"
```

#### Logs containing specific text
```
{job="meteora-pipeline"} |= "fetch"
```

#### Recent pool fetch events
```
{job="meteora-pipeline"} |= "Fetching"
```

## Integration

Both tracing and logging are enabled automatically:

- **Tracing**: Requires `OTEL_EXPORTER_OTLP_ENDPOINT` (optional; defaults to http://localhost:4318/v1/traces)
- **Logging to Loki**: Requires `LOKI_URL` (optional; if not set, logs go to console only)

## Environment Variables

```bash
# Tracing
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_SERVICE_NAME=meteora-pipeline

# Logging
LOKI_URL=http://localhost:3100
LOG_LEVEL=info
```

## Docker Compose

See `docker-compose.yml` for a full local stack including Prometheus, Grafana, Loki, and Jaeger.
