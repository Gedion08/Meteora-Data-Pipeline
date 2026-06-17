# Runbooks

Operational runbooks for common tasks and incident response procedures.

## Table of Contents

- [Daily Operations](#daily-operations)
- [Incident Response](#incident-response)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## Daily Operations

### Monitoring Dashboards

**Daily health check** (5 min)

1. Open Grafana: http://localhost:3000 (admin/admin)
2. View "Meteora Pipeline" dashboard
3. Check key metrics:
   - Pools fetched in last 24h > 0
   - Error rate < 1%
   - Fetch latency p95 < 1s
4. Review recent alerts in Prometheus

### Scaling the Pipeline

**Increase ingestion capacity**

```bash
# Local development
# Adjust DATABASE_POOL_MAX in .env
DATABASE_POOL_MAX=50

# Or edit src/config.ts defaults
```

**For Kubernetes**

```bash
helm upgrade meteora-pipeline ./helm/meteora-pipeline \
  --set replicaCount=5 \
  -n meteora
```

### Checking Pipeline Status

```bash
# Check logs
npm run dev 2>&1 | grep -i "error|fetching"

# Or with kubectl
kubectl logs -n meteora -l app.kubernetes.io/name=meteora-pipeline -f --tail=100
```

## Incident Response

### High Error Rate

**Symptom**: Error counter rapidly increasing, fetch latency spiking

**Investigation** (10 min):

```bash
# 1. Check logs for root cause
kubectl logs -n meteora -l app.kubernetes.io/name=meteora-pipeline -f

# 2. Check database connectivity
kubectl exec postgres-0 -n meteora -- psql -U postgres -c "SELECT 1;"

# 3. Check API endpoint availability
curl -v https://dlmm.datapi.meteora.ag/pools?page=1&page_size=1

# 4. Review metrics in Prometheus
# Navigate to http://localhost:9090
# Query: rate(validation_errors_total[5m])
```

**Resolution** (15 min):

1. If DB connection failed:
   ```bash
   # Restart pipeline pods
   kubectl rollout restart deployment/meteora-pipeline -n meteora
   ```

2. If API endpoint is down:
   ```bash
   # Pipeline will retry automatically with exponential backoff
   # Monitor logs for recovery
   ```

3. If validation errors:
   ```bash
   # Check data format hasn't changed
   # Update schemas in src/pipeline.ts if needed
   ```

### Database Connection Pool Exhausted

**Symptom**: "Too many connections" errors in logs

**Investigation**:

```bash
# Check current connections
kubectl exec postgres-0 -n meteora -- \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check max connections setting
kubectl exec postgres-0 -n meteora -- \
  psql -U postgres -c "SHOW max_connections;"
```

**Resolution**:

1. Increase pool size in Helm values:

```bash
helm upgrade meteora-pipeline ./helm/meteora-pipeline \
  --set env.DATABASE_POOL_MAX=100 \
  -n meteora
```

2. Or reduce replica count temporarily:

```bash
helm upgrade meteora-pipeline ./helm/meteora-pipeline \
  --set replicaCount=1 \
  -n meteora
```

3. Monitor recovery:

```bash
kubectl logs -n meteora -l app.kubernetes.io/name=meteora-pipeline -f
```

### Out of Disk Space

**Symptom**: "No space left on device" errors

**Investigation**:

```bash
# Check disk usage
df -h /app/data

# Check data directory size
du -sh ./data

# Find largest files
find ./data -type f -size +100M | sort -h
```

**Resolution**:

1. Archive old data files:

```bash
tar -czf data_archive_$(date +%Y%m%d).tar.gz data/*.json
rm data/*.json
```

2. Increase persistent volume (Kubernetes):

```bash
# Update PVC size in values.yaml
persistence:
  size: 100Gi

helm upgrade meteora-pipeline ./helm/meteora-pipeline -n meteora
```

3. Enable data retention policy:

```bash
# Add to pipeline.ts
const maxDataAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days
// Auto-delete old files
```

## Troubleshooting

### Pipeline Not Starting

```bash
# Check environment variables
kubectl describe pod meteora-pipeline-0 -n meteora | grep -A 20 "Environment:"

# Check for startup errors
kubectl logs -n meteora -l app.kubernetes.io/name=meteora-pipeline --tail=50

# Test configuration
npm run dev 2>&1 | head -20
```

### Metrics Not Appearing in Prometheus

```bash
# 1. Check metrics endpoint is accessible
curl http://localhost:9091/metrics

# 2. Check Prometheus scrape config
cat monitoring/prometheus.yml | grep -A 5 "static_configs"

# 3. Check Prometheus targets
# Navigate to http://localhost:9090/targets
# Look for "meteora-pipeline" job status

# 4. Restart Prometheus
docker-compose restart prometheus
```

### Database Migrations Stuck

```bash
# Check migration status
npx prisma migrate status

# View migration details
ls -la prisma/migrations/

# If stuck, view logs
npx prisma migrate resolve --rolled-back <migration_name>

# Or reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Memory Leak Suspected

```bash
# Profile memory usage
NODE_OPTIONS=--prof npm run dev

# Analyze profile
node --prof-process isolate-*.log > profile.txt
grep -i "heap" profile.txt | tail -20

# Monitor in production
# Query: process_resident_memory_bytes in Prometheus
```

### API Rate Limiting

**Symptom**: "429 Too Many Requests" errors

**Investigation**:

```bash
# Check request rate
# Query in Prometheus: rate(pools_fetched_total[1m])

# Review current backoff settings
grep -i "retry\|delay" src/pipeline.ts
```

**Resolution**:

1. Increase retry delay:

```env
API_RETRY_BASE_DELAY=1000  # Increase from 300ms
```

2. Reduce parallel requests by lowering page size:

```env
API_PAGE_SIZE=25  # Reduce from 50
```

3. Implement request throttling (add to pipeline.ts):

```typescript
const throttleMs = 100; // 100ms between requests
await sleep(throttleMs);
```

## Maintenance

### Daily

- [ ] Review Grafana dashboards
- [ ] Check error logs for anomalies
- [ ] Verify data directory free space

### Weekly

- [ ] Run performance benchmarks
- [ ] Review dependency updates (Dependabot PRs)
- [ ] Check security advisories

### Monthly

- [ ] Rotate database credentials
- [ ] Archive old data files
- [ ] Review and update runbooks
- [ ] Performance tuning analysis

### Quarterly

- [ ] Security audit (review SECURITY.md)
- [ ] Capacity planning review
- [ ] Disaster recovery drill

### Annually

- [ ] Full infrastructure review
- [ ] License compliance check
- [ ] Strategic feature planning

### Database Maintenance

**Vacuum and analyze** (monthly):

```bash
# Local
docker-compose exec postgres psql -U postgres -d meteora -c "VACUUM ANALYZE;"

# Kubernetes
kubectl exec postgres-0 -n meteora -- \
  psql -U postgres -d meteora -c "VACUUM ANALYZE;"
```

**Backup** (before major changes):

```bash
# Local
docker-compose exec postgres pg_dump -U postgres meteora > backup_$(date +%Y%m%d).sql

# Kubernetes
kubectl exec postgres-0 -n meteora -- \
  pg_dump -U postgres meteora > backup_$(date +%Y%m%d).sql
```

**Restore**:

```bash
# Local
docker-compose exec postgres psql -U postgres meteora < backup_20260616.sql

# Kubernetes
kubectl exec -i postgres-0 -n meteora -- \
  psql -U postgres meteora < backup_20260616.sql
```

---

## Quick Reference

| Task | Command |
|------|---------|
| View logs | `kubectl logs -n meteora -f` |
| Check metrics | `http://localhost:9091/metrics` |
| View dashboard | `http://localhost:3000` |
| Database shell | `kubectl exec postgres-0 -n meteora -- psql -U postgres` |
| Restart pipeline | `kubectl rollout restart deployment/meteora-pipeline -n meteora` |
| Scale up | `kubectl scale deployment meteora-pipeline --replicas=5 -n meteora` |

## Escalation

For issues not covered by these runbooks:

1. **Critical** (service down): Page on-call engineer immediately
2. **High** (degraded): Create incident and notify team lead
3. **Medium/Low**: File issue in GitHub for investigation

---

**Last Updated**: 2026-06-16

For updates to these runbooks, see the CONTRIBUTING.md guide.
