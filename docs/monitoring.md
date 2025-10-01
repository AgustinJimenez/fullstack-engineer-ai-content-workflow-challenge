# Monitoring and Health Checks

## Overview

The application provides comprehensive monitoring and health check endpoints for production deployment, container orchestration, and observability.

## Health Check Endpoints

### 1. Comprehensive Health Check
**Endpoint**: `GET /health`

Returns detailed application health status including all subsystems.

**Response Structure**:
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": 123456,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 45
    },
    "memory": {
      "status": "healthy",
      "used": 1234567890,
      "total": 8589934592,
      "percentage": 14.37,
      "heapUsed": 123456789,
      "heapTotal": 234567890
    },
    "disk": {
      "status": "healthy"
    },
    "dependencies": {
      "status": "healthy",
      "services": {
        "openai-api": {
          "status": "healthy",
          "responseTime": 200
        },
        "anthropic-api": {
          "status": "healthy", 
          "responseTime": 150
        }
      }
    }
  }
}
```

**HTTP Status Codes**:
- `200`: Healthy or degraded (still operational)
- `503`: Unhealthy (service unavailable)
- `500`: Health check system error

### 2. Liveness Probe (Kubernetes)
**Endpoint**: `GET /health/live`

Simple check to determine if the application process is alive.

**Response**:
```json
{
  "status": "alive",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**HTTP Status Codes**:
- `200`: Application is alive
- `503`: Application is dead (should restart)

### 3. Readiness Probe (Kubernetes)
**Endpoint**: `GET /health/ready`

Checks if the application is ready to serve traffic (dependencies available).

**Response**:
```json
{
  "status": "ready",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**HTTP Status Codes**:
- `200`: Ready to serve traffic
- `503`: Not ready (don't send traffic)

## Metrics Endpoint

### Prometheus Metrics
**Endpoint**: `GET /metrics`

Returns metrics in Prometheus format for monitoring systems.

**Available Metrics**:
- `app_health_status` - Overall application health (0=unhealthy, 1=degraded, 2=healthy)
- `app_uptime_seconds` - Application uptime in seconds
- `app_memory_usage_bytes` - Memory usage (heap_used, heap_total, system_used, system_total)
- `app_database_response_time_milliseconds` - Database response time
- `app_database_status` - Database health status (0=unhealthy, 1=healthy)
- `app_dependency_status` - External dependency status per service
- `app_dependency_response_time_milliseconds` - External dependency response times

**Example Output**:
```
# HELP app_health_status Application health status (0=unhealthy, 1=degraded, 2=healthy)
# TYPE app_health_status gauge
app_health_status{environment="production"} 2

# HELP app_uptime_seconds Application uptime in seconds
# TYPE app_uptime_seconds counter
app_uptime_seconds{environment="production"} 86400
```

## Application Info

### Info Endpoint
**Endpoint**: `GET /info`

Returns static application information for operational dashboards.

**Response**:
```json
{
  "application": {
    "name": "AI Content Workflow Backend",
    "version": "1.0.0",
    "description": "Backend service for AI-powered content creation and translation workflow",
    "environment": "production"
  },
  "build": {
    "timestamp": "2024-01-01T12:00:00Z",
    "commit": "abc123def456",
    "branch": "main"
  },
  "runtime": {
    "node": "v18.17.0",
    "platform": "linux",
    "architecture": "x64",
    "timezone": "UTC"
  },
  "features": {
    "apis": ["REST", "GraphQL"],
    "aiProviders": ["OpenAI", "Anthropic"],
    "languages": ["TypeScript", "JavaScript"],
    "databases": ["PostgreSQL"]
  }
}
```

## Health Status Levels

### Healthy ✅
- All systems operational
- Normal response times
- All dependencies available
- Memory usage < 80%

### Degraded ⚠️
- System operational but with issues
- Some non-critical dependencies unavailable
- Memory usage 80-95%
- Elevated response times

### Unhealthy ❌
- Critical systems failing
- Database unavailable
- Memory usage > 95%
- Unable to serve traffic

## Kubernetes Integration

### Deployment Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-content-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        image: ai-content-backend:latest
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
```

## Docker Health Check

### Dockerfile Configuration
```dockerfile
FROM node:18-alpine
# ... other instructions ...

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health/live || exit 1
```

## Monitoring Stack Integration

### Prometheus Configuration
```yaml
scrape_configs:
- job_name: 'ai-content-backend'
  static_configs:
  - targets: ['backend:8080']
  metrics_path: '/metrics'
  scrape_interval: 15s
```

### Grafana Dashboard Queries
```promql
# Application uptime
app_uptime_seconds

# Memory usage percentage
(app_memory_usage_bytes{type="heap_used"} / app_memory_usage_bytes{type="heap_total"}) * 100

# Database response time
app_database_response_time_milliseconds

# Dependency availability
app_dependency_status
```

### Alerting Rules
```yaml
groups:
- name: ai-content-backend
  rules:
  - alert: ApplicationDown
    expr: app_health_status == 0
    for: 1m
    annotations:
      summary: "AI Content Backend is unhealthy"
      
  - alert: DatabaseSlow
    expr: app_database_response_time_milliseconds > 1000
    for: 2m
    annotations:
      summary: "Database response time is slow"
      
  - alert: HighMemoryUsage
    expr: (app_memory_usage_bytes{type="heap_used"} / app_memory_usage_bytes{type="heap_total"}) * 100 > 90
    for: 5m
    annotations:
      summary: "High memory usage detected"
```

## Logging Integration

The health service integrates with the application's logging system to provide:
- Health check request logs
- Alert notifications for status changes
- Performance metrics logging
- Error tracking for failed health checks

## Production Recommendations

1. **Set up alerts** for critical health status changes
2. **Monitor trends** in response times and resource usage
3. **Configure dashboards** for operational visibility
4. **Test health checks** regularly in staging environments
5. **Set appropriate timeouts** for Kubernetes probes based on your SLAs
6. **Use circuit breakers** for external dependency checks
7. **Implement graceful shutdown** handling with health checks