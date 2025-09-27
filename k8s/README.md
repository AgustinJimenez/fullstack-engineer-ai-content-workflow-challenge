# Kubernetes Deployment Guide

This directory contains Kubernetes manifests and deployment scripts for the AI Content Workflow application.

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kubernetes Cluster                       │
├─────────────────────────────────────────────────────────────────┤
│  Namespace: ai-content-workflow                                 │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Frontend   │    │   Backend   │    │ PostgreSQL  │         │
│  │   (3 pods)  │    │  (3 pods)   │    │  (1 pod)    │         │
│  │   Port 3000 │    │  Port 8080  │    │  Port 5432  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                   │                   │               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Service   │    │   Service   │    │   Service   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                             │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Ingress                             │   │
│  │  app.example.com → Frontend                            │   │
│  │  api.example.com → Backend                             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
k8s/
├── README.md                    # This file
├── deploy.sh                    # Deployment script
├── namespace.yaml              # Namespace definition
├── configmap.yaml              # Configuration data
├── secret.yaml                 # Sensitive data (base64 encoded)
├── postgres-deployment.yaml    # PostgreSQL database
├── backend-deployment.yaml     # Backend API service
├── frontend-deployment.yaml    # Frontend React application
├── ingress.yaml                # External access routing
├── hpa.yaml                    # Horizontal Pod Autoscaling
├── network-policy.yaml         # Network security policies
├── rbac.yaml                   # Role-based access control
└── monitoring.yaml             # Prometheus monitoring
```

## 🚀 Quick Deployment

### Prerequisites

- Kubernetes cluster (1.21+ recommended)
- kubectl configured and connected
- Ingress controller installed (nginx recommended)
- Container images built and pushed to registry

### Basic Deployment

```bash
# Clone the repository and navigate to k8s directory
cd k8s

# Deploy everything with the deployment script
./deploy.sh

# Or deploy manually step by step
kubectl apply -f namespace.yaml
kubectl apply -f rbac.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml
kubectl apply -f network-policy.yaml
kubectl apply -f monitoring.yaml
```

### Deployment Options

```bash
# Dry run to preview changes
./deploy.sh --dry-run

# Skip secrets (if managed externally)
./deploy.sh --skip-secrets

# Use specific kubectl context
./deploy.sh --context production

# Get help
./deploy.sh --help
```

## 🔧 Configuration

### Environment-Specific Configuration

#### Development/Staging
```bash
# Update configmap.yaml
NODE_ENV: "staging"
LOG_LEVEL: "debug"
ENABLE_GRAPHQL_PLAYGROUND: "true"

# Use staging ingress (single domain)
kubectl apply -f ingress.yaml  # Use the staging ingress section
```

#### Production
```bash
# Update configmap.yaml  
NODE_ENV: "production"
LOG_LEVEL: "warn"
ENABLE_GRAPHQL_PLAYGROUND: "false"

# Use production ingress (separate domains)
kubectl apply -f ingress.yaml  # Use the production ingress section
```

### Secrets Management

**⚠️ IMPORTANT**: The provided secrets are base64 encoded examples. Replace with actual values:

```bash
# Generate base64 encoded secrets
echo -n "your-actual-password" | base64

# Update secret.yaml with real values
DB_PASS: <your-base64-encoded-password>
OPENAI_API_KEY: <your-base64-encoded-openai-key>
ANTHROPIC_API_KEY: <your-base64-encoded-anthropic-key>
```

#### External Secrets Management Options

1. **Kubernetes External Secrets Operator**
   ```yaml
   apiVersion: external-secrets.io/v1beta1
   kind: SecretStore
   metadata:
     name: vault-backend
   spec:
     provider:
       vault:
         server: "https://vault.example.com"
   ```

2. **AWS Secrets Manager**
   ```bash
   # Install AWS Load Balancer Controller and configure
   kubectl apply -f aws-secrets-integration.yaml
   ```

3. **Azure Key Vault**
   ```bash
   # Install Azure Key Vault CSI driver
   kubectl apply -f azure-keyvault-integration.yaml
   ```

### Container Images

Update deployment files with your container registry:

```yaml
# In backend-deployment.yaml and frontend-deployment.yaml
spec:
  template:
    spec:
      containers:
      - name: ai-content-backend
        image: your-registry.com/ai-content-backend:v1.0.0  # Update this
        imagePullPolicy: Always
```

## 📊 Monitoring & Observability

### Prometheus Integration

The monitoring setup includes:

- ServiceMonitor for metrics scraping
- PrometheusRule for alerting
- Grafana dashboard configuration

### Key Metrics

- `app_health_status` - Application health
- `http_requests_total` - Request count
- `http_request_duration_seconds` - Response times
- `app_database_response_time_milliseconds` - Database performance

### Grafana Dashboard

Import the provided dashboard or create custom dashboards:

```bash
# Port forward to Grafana (if using Prometheus stack)
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Access at http://localhost:3000
```

### Alerting Rules

Pre-configured alerts for:
- Application downtime
- High error rates
- High latency
- Resource usage
- Database issues

## 🔒 Security

### Network Policies

- Ingress restrictions
- Inter-pod communication rules
- Database isolation
- External API access controls

### RBAC Configuration

- Service accounts with minimal permissions
- Role-based access for each component
- Resource quotas and limits

### Pod Security

- Non-root containers
- Read-only root filesystem
- Dropped capabilities
- Security contexts

## 🔄 Autoscaling

### Horizontal Pod Autoscaler (HPA)

Backend autoscaling based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- Custom metrics (requests per second)

Frontend autoscaling based on:
- CPU utilization (target: 60%)
- Memory utilization (target: 70%)

### Scaling Configuration

```yaml
# Backend: 3-10 replicas
minReplicas: 3
maxReplicas: 10

# Frontend: 3-8 replicas  
minReplicas: 3
maxReplicas: 8
```

### Custom Metrics

For advanced scaling, implement custom metrics:

```yaml
- type: Pods
  pods:
    metric:
      name: ai_requests_per_second
    target:
      type: AverageValue
      averageValue: "100"
```

## 🗄 Persistent Storage

### PostgreSQL Storage

- 20Gi PersistentVolumeClaim
- ReadWriteOnce access mode
- Configurable storage class

### Storage Classes

```bash
# List available storage classes
kubectl get storageclass

# Create custom storage class for production
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iops: "3000"
allowVolumeExpansion: true
EOF
```

## 🌐 Ingress Configuration

### Single Domain Setup (Development)

```yaml
# All services under one domain
staging.example.com/        → Frontend
staging.example.com/api     → Backend API
staging.example.com/graphql → GraphQL API
```

### Multi-Domain Setup (Production)

```yaml
# Separate domains for frontend and API
app.example.com    → Frontend
api.example.com    → Backend (all endpoints)
```

### SSL/TLS Certificates

Using cert-manager for automatic certificates:

```bash
# Install cert-manager
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.12.0/cert-manager.yaml

# Configure ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## 🛠 Maintenance Operations

### Upgrading Applications

```bash
# Update image tags in deployment files
# Backend
kubectl set image deployment/ai-content-backend-deployment ai-content-backend=your-registry.com/ai-content-backend:v1.1.0 -n ai-content-workflow

# Frontend
kubectl set image deployment/ai-content-frontend-deployment ai-content-frontend=your-registry.com/ai-content-frontend:v1.1.0 -n ai-content-workflow

# Check rollout status
kubectl rollout status deployment/ai-content-backend-deployment -n ai-content-workflow
```

### Backup Operations

```bash
# Database backup
kubectl exec -n ai-content-workflow deployment/postgres-deployment -- pg_dump -U postgres ai_content_workflow > backup-$(date +%Y%m%d).sql

# Persistent volume backup
kubectl get pv postgres-pv -o yaml > pv-backup-$(date +%Y%m%d).yaml
```

### Scaling Operations

```bash
# Manual scaling
kubectl scale deployment ai-content-backend-deployment --replicas=5 -n ai-content-workflow

# Check HPA status
kubectl get hpa -n ai-content-workflow

# Describe HPA for details
kubectl describe hpa ai-content-backend-hpa -n ai-content-workflow
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status and events
kubectl get pods -n ai-content-workflow
kubectl describe pod <pod-name> -n ai-content-workflow

# Check logs
kubectl logs <pod-name> -n ai-content-workflow
```

#### 2. Image Pull Issues

```bash
# Check if images exist and are accessible
kubectl describe pod <pod-name> -n ai-content-workflow

# Verify image registry credentials
kubectl get secrets -n ai-content-workflow
```

#### 3. Database Connection Issues

```bash
# Test database connectivity
kubectl exec -n ai-content-workflow deployment/ai-content-backend-deployment -- /bin/sh -c "nc -z postgres-service 5432"

# Check database logs
kubectl logs deployment/postgres-deployment -n ai-content-workflow
```

#### 4. Ingress Not Working

```bash
# Check ingress status
kubectl get ingress -n ai-content-workflow
kubectl describe ingress ai-content-workflow-ingress -n ai-content-workflow

# Verify ingress controller
kubectl get pods -n ingress-nginx
```

### Debugging Commands

```bash
# Get all resources in namespace
kubectl get all -n ai-content-workflow

# Check resource usage
kubectl top pods -n ai-content-workflow
kubectl top nodes

# Check network policies
kubectl get networkpolicy -n ai-content-workflow

# Check events
kubectl get events -n ai-content-workflow --sort-by='.lastTimestamp'
```

### Health Checks

```bash
# Port forward and check health endpoints
kubectl port-forward service/ai-content-backend-service -n ai-content-workflow 8080:8080

# Test health endpoints
curl http://localhost:8080/health
curl http://localhost:8080/health/live
curl http://localhost:8080/health/ready
curl http://localhost:8080/metrics
```

## 📋 Production Checklist

Before deploying to production:

### Security
- [ ] Replace default secrets with strong, unique values
- [ ] Configure proper RBAC policies
- [ ] Enable network policies
- [ ] Set up Pod Security Standards
- [ ] Configure SSL/TLS certificates

### Performance
- [ ] Set appropriate resource requests and limits
- [ ] Configure HPA with proper metrics
- [ ] Optimize container images
- [ ] Set up monitoring and alerting
- [ ] Configure persistent storage

### Reliability
- [ ] Test backup and restore procedures
- [ ] Verify health checks are working
- [ ] Set up log aggregation
- [ ] Configure anti-affinity rules
- [ ] Test disaster recovery procedures

### Operations
- [ ] Set up CI/CD pipelines
- [ ] Configure monitoring dashboards
- [ ] Document runbooks
- [ ] Train operations team
- [ ] Set up alerting notification channels

## 🔗 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [Cert-Manager](https://cert-manager.io/)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)

## 🆘 Support

For deployment issues:

1. Check the troubleshooting section above
2. Review application logs
3. Consult the main project documentation
4. Contact the development team

---

**Remember**: Always test deployments in a non-production environment first!