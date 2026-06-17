# Deployment Guide

This document describes how to deploy the Meteora Data Pipeline locally with Docker Compose and in Kubernetes with Helm.

## Local Development with Docker Compose

### Prerequisites

- Docker & Docker Compose
- 4GB RAM available
- Ports 5432, 3000, 9090, 9091, 3100, 16686 available

### Quick Start

1. Clone the repository and navigate to the project root:

```bash
cd Meteora\ Data\ Pipieline
```

2. Create a `.env` file from the example:

```bash
cp .env.example .env
```

3. Update `.env` with your local database credentials:

```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/meteora"
LOKI_URL="http://loki:3100"
OTEL_EXPORTER_OTLP_ENDPOINT="http://jaeger:4318/v1/traces"
```

4. Start all services:

```bash
docker-compose up -d
```

5. Wait for PostgreSQL to be healthy (check logs):

```bash
docker-compose logs -f postgres
```

6. Initialize the database:

```bash
docker-compose exec postgres psql -U postgres -d meteora -c "SELECT 1;"
```

7. Run the pipeline:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

8. Access services:

| Service | URL | Credentials |
|---------|-----|-------------|
| Postgres | localhost:5432 | postgres / postgres |
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3000 | admin / admin |
| Loki | http://localhost:3100 | - |
| Jaeger | http://localhost:16686 | - |
| Metrics | http://localhost:9091/metrics | - |

### Stopping Services

```bash
docker-compose down
```

To remove volumes (clear all data):

```bash
docker-compose down -v
```

## Production Deployment with Kubernetes & Helm

### Prerequisites

- Kubernetes cluster (1.19+)
- Helm 3+
- kubectl configured to access your cluster
- PostgreSQL database (external or via Helm)
- Secret management (GitHub Secrets, Vault, etc.)

### Installation

1. Add the repository (if using a Helm chart repository):

```bash
# Optional: If hosting on a Helm repository
helm repo add meteora https://charts.meteora.ag
helm repo update
```

2. Create a namespace:

```bash
kubectl create namespace meteora
```

3. Create secrets:

```bash
kubectl create secret generic meteora-pipeline \
  --from-literal=database-url="postgresql://user:pass@postgres:5432/meteora" \
  --from-literal=loki-url="http://loki:3100" \
  --from-literal=otel-endpoint="http://jaeger:4318/v1/traces" \
  -n meteora
```

4. Create a `values-prod.yaml` for production overrides:

```yaml
replicaCount: 3

image:
  tag: v0.1.0  # Use specific version, not latest

env:
  NODE_ENV: production
  LOG_LEVEL: warn
  DATABASE_POOL_MIN: "10"
  DATABASE_POOL_MAX: "50"

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 75

persistence:
  enabled: true
  storageClassName: standard
  size: 50Gi

livenessProbe:
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

5. Install the Helm chart:

```bash
helm install meteora-pipeline ./helm/meteora-pipeline \
  -n meteora \
  -f values-prod.yaml
```

6. Verify the deployment:

```bash
kubectl get pods -n meteora
kubectl logs -n meteora -l app.kubernetes.io/name=meteora-pipeline -f
```

### Upgrade

```bash
helm upgrade meteora-pipeline ./helm/meteora-pipeline \
  -n meteora \
  -f values-prod.yaml
```

### Rollback

```bash
helm rollback meteora-pipeline -n meteora
```

### Uninstall

```bash
helm uninstall meteora-pipeline -n meteora
```

## Database Migrations

### Local Development

```bash
# Create and apply migrations
npx prisma migrate dev --name init

# Reset database (warning: deletes all data)
npx prisma migrate reset
```

### Production

```bash
# Apply pending migrations
npx prisma migrate deploy

# View migration status
npx prisma migrate status
```

## Monitoring & Logging

### Local (Docker Compose)

- **Metrics**: http://localhost:9090 (Prometheus)
- **Dashboards**: http://localhost:3000 (Grafana)
- **Logs**: http://localhost:3100 (Loki)
- **Traces**: http://localhost:16686 (Jaeger)

### Kubernetes

1. Port-forward to access dashboards:

```bash
# Grafana
kubectl port-forward -n meteora svc/grafana 3000:3000

# Prometheus
kubectl port-forward -n meteora svc/prometheus 9090:9090

# Jaeger
kubectl port-forward -n meteora svc/jaeger 16686:16686
```

2. Access via http://localhost:3000, etc.

## Performance Tuning

### Database Connection Pool

Adjust in `values.yaml`:

```yaml
env:
  DATABASE_POOL_MIN: "10"
  DATABASE_POOL_MAX: "50"
```

### Resource Limits

Increase if needed:

```yaml
resources:
  limits:
    cpu: 2000m
    memory: 2Gi
```

### Autoscaling

Enable and configure:

```yaml
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 75
```

## Troubleshooting

### Pod Fails to Start

```bash
kubectl describe pod <pod-name> -n meteora
kubectl logs <pod-name> -n meteora
```

### Database Connection Error

1. Verify `DATABASE_URL` secret:

```bash
kubectl get secret meteora-pipeline -n meteora -o jsonpath='{.data.database-url}' | base64 -d
```

2. Test connectivity from pod:

```bash
kubectl run -it --rm debug --image=postgres:15 --restart=Never -n meteora -- \
  psql <YOUR_DATABASE_URL>
```

### Out of Memory

Increase memory limits in `values.yaml` and redeploy.

### Metrics Not Appearing

1. Check metrics endpoint is accessible:

```bash
kubectl port-forward -n meteora svc/meteora-pipeline 9091:9091
curl http://localhost:9091/metrics
```

2. Verify Prometheus scrape config includes the service.

## Disaster Recovery

### Backup Database

```bash
# Local (docker-compose)
docker-compose exec postgres pg_dump -U postgres meteora > backup.sql

# Kubernetes
kubectl exec -it postgres-0 -n meteora -- \
  pg_dump -U postgres meteora > backup.sql
```

### Restore Database

```bash
# Local
docker-compose exec postgres psql -U postgres meteora < backup.sql

# Kubernetes
kubectl exec -i postgres-0 -n meteora -- \
  psql -U postgres meteora < backup.sql
```

## Security

### RBAC

Helm chart creates a ServiceAccount with minimal permissions. Review and update RBAC as needed:

```bash
kubectl describe sa meteora-pipeline -n meteora
```

### Network Policies

Consider adding NetworkPolicies to restrict traffic between services:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: meteora-pipeline
  namespace: meteora
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: meteora-pipeline
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
```

---

**Last Updated**: 2026-06-16
