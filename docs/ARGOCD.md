# ArgoCD GitOps Deployment Guide

This guide covers deploying the AI Content Workflow application using ArgoCD for GitOps-based continuous delivery.

## 🎯 Overview

ArgoCD enables declarative GitOps continuous delivery for Kubernetes applications. This setup provides:

- **Automated Deployments**: Git commits automatically trigger deployments
- **Self-Healing**: Applications automatically sync when cluster state drifts
- **Rollback Capability**: Easy rollback to any previous Git revision
- **Multi-Environment Support**: Manage dev, staging, and production from one place
- **Audit Trail**: Complete deployment history tracked in Git
- **Visual Dashboard**: Web UI for monitoring application health

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Git Repository                      │
│  (Source of Truth for Kubernetes Manifests)                │
│                                                             │
│  k8s/                                                       │
│  ├── argocd-project.yaml       (ArgoCD Project)            │
│  ├── argocd-application.yaml   (ArgoCD Application)        │
│  ├── namespace.yaml                                         │
│  ├── postgres-deployment.yaml                              │
│  ├── backend-deployment.yaml                               │
│  └── frontend-deployment.yaml                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ monitors & syncs
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     ArgoCD Server                           │
│  - Monitors Git repository for changes                     │
│  - Compares desired state (Git) vs actual state (K8s)      │
│  - Automatically syncs when out of sync                    │
│  - Provides Web UI for management                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ applies manifests
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  Kubernetes Cluster                         │
│  Namespace: ai-content-workflow                             │
│  ├── PostgreSQL Deployment                                 │
│  ├── Backend Deployment                                     │
│  ├── Frontend Deployment                                    │
│  └── Services, Ingress, ConfigMaps, etc.                   │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

### 1. Kubernetes Cluster
```bash
# Verify cluster access
kubectl cluster-info
kubectl get nodes
```

### 2. Install ArgoCD
```bash
# Create ArgoCD namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Verify installation
kubectl get pods -n argocd
```

### 3. Access ArgoCD UI
```bash
# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access at: https://localhost:8080
# Username: admin
# Password: (from above command)
```

### 4. Install ArgoCD CLI (Optional)
```bash
# macOS
brew install argocd

# Linux
curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /usr/local/bin/argocd

# Login via CLI
argocd login localhost:8080 --username admin --password <password> --insecure
```

## 🚀 Deployment

### Step 1: Prepare Git Repository

Ensure your repository structure matches:
```
k8s/
├── argocd-project.yaml         # ArgoCD project definition
├── argocd-application.yaml     # ArgoCD application definition
├── namespace.yaml              # Application namespace
├── configmap.yaml              # Configuration
├── secret.yaml                 # Secrets (encrypted or managed externally)
├── postgres-deployment.yaml    # Database
├── backend-deployment.yaml     # Backend API
├── frontend-deployment.yaml    # Frontend
├── ingress.yaml                # Ingress routing
├── hpa.yaml                    # Autoscaling
├── network-policy.yaml         # Network security
└── monitoring.yaml             # Monitoring setup
```

### Step 2: Update ArgoCD Manifests

**Edit `k8s/argocd-application.yaml`**:
```yaml
spec:
  source:
    repoURL: https://github.com/YOUR-ORG/fullstack-engineer-ai-content-workflow-challenge.git
    targetRevision: main  # or your branch name
    path: k8s
```

**Edit `k8s/argocd-project.yaml`** (if needed):
```yaml
spec:
  sourceRepos:
    - https://github.com/YOUR-ORG/fullstack-engineer-ai-content-workflow-challenge.git
```

### Step 3: Create ArgoCD Project

```bash
# Apply the project definition
kubectl apply -f k8s/argocd-project.yaml

# Verify project creation
kubectl get appproject -n argocd
argocd proj get ai-content-workflow-project
```

### Step 4: Create ArgoCD Application

```bash
# Apply the application definition
kubectl apply -f k8s/argocd-application.yaml

# Verify application creation
kubectl get application -n argocd
argocd app get ai-content-workflow
```

### Step 5: Monitor Initial Sync

```bash
# Watch sync progress
argocd app sync ai-content-workflow --watch

# Or use kubectl
kubectl get application ai-content-workflow -n argocd -w

# Check application status
argocd app get ai-content-workflow

# View sync history
argocd app history ai-content-workflow
```

## 🔧 Configuration

### Automated Sync Policy

The application is configured with automated sync:

```yaml
syncPolicy:
  automated:
    prune: true       # Delete resources not in Git
    selfHeal: true    # Auto-fix drift from desired state
    allowEmpty: false # Safety: don't delete everything
```

**Benefits:**
- Changes to Git automatically deploy to cluster
- Cluster state stays in sync with Git
- Manual changes to cluster are auto-corrected

**To disable automated sync:**
```bash
argocd app set ai-content-workflow --sync-policy none
```

### Sync Windows

Deployments are restricted to business hours:

```yaml
syncWindows:
  - kind: allow
    schedule: '0 9-17 * * 1-5'  # Mon-Fri, 9am-5pm
    duration: 8h
```

**Override for urgent deployments:**
```bash
argocd app sync ai-content-workflow --force
```

### Ignore Differences

HPA-managed replica counts are ignored:

```yaml
ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
      - /spec/replicas  # HPA controls this
```

## 📊 Managing Applications

### Manual Sync
```bash
# Sync application
argocd app sync ai-content-workflow

# Sync specific resource
argocd app sync ai-content-workflow --resource apps:Deployment:ai-content-backend-deployment

# Dry run (preview changes)
argocd app sync ai-content-workflow --dry-run --prune
```

### View Application Status
```bash
# Get application details
argocd app get ai-content-workflow

# List all applications
argocd app list

# View application tree
argocd app get ai-content-workflow --show-params
```

### View Application Logs
```bash
# View logs from ArgoCD
argocd app logs ai-content-workflow

# View specific pod logs
argocd app logs ai-content-workflow --kind Deployment --name ai-content-backend-deployment
```

### Rollback
```bash
# View history
argocd app history ai-content-workflow

# Rollback to specific revision
argocd app rollback ai-content-workflow <revision-number>

# Rollback to previous revision
argocd app rollback ai-content-workflow
```

### Delete Application
```bash
# Delete application (keeps resources in cluster)
argocd app delete ai-content-workflow

# Delete application and all resources
argocd app delete ai-content-workflow --cascade
```

## 🌍 Multi-Environment Setup

### Directory Structure for Multiple Environments

```
k8s/
├── base/                       # Base manifests
│   ├── namespace.yaml
│   ├── postgres-deployment.yaml
│   ├── backend-deployment.yaml
│   └── frontend-deployment.yaml
├── overlays/
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   └── production/
│       ├── kustomization.yaml
│       └── patches/
└── argocd/
    ├── dev-application.yaml
    ├── staging-application.yaml
    └── prod-application.yaml
```

### Create Applications for Each Environment

**Development:**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-content-workflow-dev
  namespace: argocd
spec:
  project: ai-content-workflow-project
  source:
    repoURL: https://github.com/YOUR-ORG/repo.git
    targetRevision: develop
    path: k8s/overlays/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: ai-content-workflow-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Staging:**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-content-workflow-staging
  namespace: argocd
spec:
  project: ai-content-workflow-project
  source:
    repoURL: https://github.com/YOUR-ORG/repo.git
    targetRevision: main
    path: k8s/overlays/staging
  destination:
    server: https://kubernetes.default.svc
    namespace: ai-content-workflow-staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: false  # Require manual approval
```

**Production:**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-content-workflow-prod
  namespace: argocd
spec:
  project: ai-content-workflow-project
  source:
    repoURL: https://github.com/YOUR-ORG/repo.git
    targetRevision: v1.0.0  # Use tags for production
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: ai-content-workflow
  syncPolicy:
    automated:
      prune: false      # No auto-prune in production
      selfHeal: false   # Manual control for production
```

## 🔒 Security Best Practices

### 1. Secret Management

**Option A: Sealed Secrets**
```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Encrypt secrets
kubeseal --format yaml < secret.yaml > sealed-secret.yaml

# Commit sealed-secret.yaml to Git (safe)
```

**Option B: External Secrets Operator**
```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "ai-content-workflow"
```

### 2. RBAC for ArgoCD

```yaml
# Create read-only role for developers
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: argocd-developer
  namespace: argocd
rules:
  - apiGroups: ["argoproj.io"]
    resources: ["applications"]
    verbs: ["get", "list", "watch"]
```

### 3. Repository Access

```bash
# Add private repository with SSH key
argocd repo add git@github.com:YOUR-ORG/repo.git \
  --ssh-private-key-path ~/.ssh/id_rsa

# Or with HTTPS and token
argocd repo add https://github.com/YOUR-ORG/repo.git \
  --username git \
  --password <github-token>
```

## 📈 Monitoring & Notifications

### Prometheus Metrics

ArgoCD exposes metrics for monitoring:
```bash
# Port forward to metrics endpoint
kubectl port-forward svc/argocd-metrics -n argocd 8082:8082

# Access metrics
curl http://localhost:8082/metrics
```

**Key Metrics:**
- `argocd_app_sync_total` - Total sync operations
- `argocd_app_health_status` - Application health
- `argocd_app_sync_status` - Sync status

### Slack Notifications

Configure notifications in ArgoCD:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.slack: |
    token: $slack-token
  trigger.on-sync-succeeded: |
    - when: app.status.operationState.phase in ['Succeeded']
      send: [app-sync-succeeded]
  template.app-sync-succeeded: |
    message: |
      Application {{.app.metadata.name}} synced successfully.
      {{if .app.status.operationState.syncResult}}
      Revision: {{.app.status.operationState.syncResult.revision}}
      {{end}}
```

### Grafana Dashboard

Import ArgoCD dashboard:
1. Go to Grafana
2. Import dashboard ID: `14584` (ArgoCD operational overview)
3. Configure Prometheus data source

## 🚨 Troubleshooting

### Application Out of Sync

```bash
# Check diff between Git and cluster
argocd app diff ai-content-workflow

# View sync status details
argocd app get ai-content-workflow --show-operation

# Force refresh from Git
argocd app get ai-content-workflow --refresh
```

### Application Degraded

```bash
# Check resource health
argocd app get ai-content-workflow --show-operation

# View specific resource status
kubectl get deployment ai-content-backend-deployment -n ai-content-workflow -o yaml

# Check events
kubectl get events -n ai-content-workflow --sort-by='.lastTimestamp'
```

### Sync Failures

```bash
# View sync errors
argocd app get ai-content-workflow

# Check ArgoCD logs
kubectl logs -n argocd deployment/argocd-application-controller

# Retry sync with prune
argocd app sync ai-content-workflow --prune --force
```

### Repository Connection Issues

```bash
# List repositories
argocd repo list

# Test repository connection
argocd repo get https://github.com/YOUR-ORG/repo.git

# Re-add repository
argocd repo rm https://github.com/YOUR-ORG/repo.git
argocd repo add https://github.com/YOUR-ORG/repo.git --username git --password <token>
```

## 📚 Advanced Features

### ApplicationSet

For deploying to multiple clusters:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: ai-content-workflow-multicluster
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - cluster: production-us-east
            url: https://prod-us-east.example.com
          - cluster: production-eu-west
            url: https://prod-eu-west.example.com
  template:
    metadata:
      name: 'ai-content-workflow-{{cluster}}'
    spec:
      project: ai-content-workflow-project
      source:
        repoURL: https://github.com/YOUR-ORG/repo.git
        targetRevision: main
        path: k8s
      destination:
        server: '{{url}}'
        namespace: ai-content-workflow
```

### Sync Hooks

Add hooks for pre/post sync operations:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      containers:
        - name: migration
          image: your-registry.com/ai-content-backend:latest
          command: ["npm", "run", "migrate"]
```

### Health Checks

Custom health checks:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  resource.customizations: |
    apps/Deployment:
      health.lua: |
        hs = {}
        if obj.status.readyReplicas == obj.spec.replicas then
          hs.status = "Healthy"
          hs.message = "All replicas are ready"
        else
          hs.status = "Progressing"
          hs.message = "Waiting for replicas"
        end
        return hs
```

## 🔗 Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [ArgoCD Best Practices](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/)
- [GitOps Principles](https://opengitops.dev/)
- [ArgoCD GitHub](https://github.com/argoproj/argo-cd)
- [Kubernetes Documentation](docs/ARCHITECTURE.md)

## ✅ Deployment Checklist

Before deploying with ArgoCD:

- [ ] ArgoCD installed and accessible
- [ ] Git repository URL updated in manifests
- [ ] Secrets encrypted or managed externally
- [ ] Repository access configured (SSH/HTTPS)
- [ ] ArgoCD project created
- [ ] Sync windows configured for environment
- [ ] Notifications configured (Slack/Email)
- [ ] RBAC policies configured
- [ ] Monitoring and alerts set up
- [ ] Tested in non-production environment

---

**Next Steps:**
1. Follow the deployment steps above
2. Monitor initial sync in ArgoCD UI
3. Verify application health
4. Set up notifications for your team
5. Configure access control for team members

For issues, consult the troubleshooting section or check ArgoCD logs.