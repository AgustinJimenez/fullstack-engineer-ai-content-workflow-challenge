#!/bin/bash

# AI Content Workflow Kubernetes Deployment Script
# This script deploys the AI Content Workflow application to Kubernetes

set -euo pipefail

# Configuration
NAMESPACE="ai-content-workflow"
KUBECTL_CONTEXT=""  # Set if you need a specific context
DRY_RUN=false
SKIP_SECRETS=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy AI Content Workflow to Kubernetes

Options:
    -c, --context CONTEXT   Kubectl context to use
    -d, --dry-run          Perform a dry run (don't actually apply)
    -s, --skip-secrets     Skip applying secrets (useful if managed externally)
    -h, --help             Show this help message

Examples:
    $0                      # Deploy with default settings
    $0 --dry-run           # Preview changes without applying
    $0 --context prod      # Deploy to specific context
    $0 --skip-secrets      # Deploy without applying secrets

EOF
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Set context if specified
    if [[ -n "$KUBECTL_CONTEXT" ]]; then
        kubectl config use-context "$KUBECTL_CONTEXT"
        log_info "Using kubectl context: $KUBECTL_CONTEXT"
    fi
    
    log_success "Prerequisites check passed"
}

create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE already exists"
    else
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would create namespace: $NAMESPACE"
        else
            kubectl apply -f namespace.yaml
            log_success "Namespace created: $NAMESPACE"
        fi
    fi
}

apply_secrets() {
    if [[ "$SKIP_SECRETS" == "true" ]]; then
        log_warning "Skipping secrets (--skip-secrets flag used)"
        return
    fi
    
    log_info "Applying secrets..."
    log_warning "⚠️  IMPORTANT: Update secrets with real values before production deployment!"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would apply secrets"
        kubectl apply -f secret.yaml --dry-run=client
    else
        kubectl apply -f secret.yaml
        log_success "Secrets applied"
    fi
}

apply_configmaps() {
    log_info "Applying ConfigMaps..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would apply ConfigMaps"
        kubectl apply -f configmap.yaml --dry-run=client
    else
        kubectl apply -f configmap.yaml
        log_success "ConfigMaps applied"
    fi
}

deploy_postgres() {
    log_info "Deploying PostgreSQL..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy PostgreSQL"
        kubectl apply -f postgres-deployment.yaml --dry-run=client
    else
        kubectl apply -f postgres-deployment.yaml
        
        # Wait for PostgreSQL to be ready
        log_info "Waiting for PostgreSQL to be ready..."
        kubectl wait --for=condition=ready pod -l app=postgres -n "$NAMESPACE" --timeout=300s
        log_success "PostgreSQL is ready"
    fi
}

deploy_backend() {
    log_info "Deploying AI Content Backend..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy backend"
        kubectl apply -f backend-deployment.yaml --dry-run=client
    else
        kubectl apply -f backend-deployment.yaml
        
        # Wait for backend to be ready
        log_info "Waiting for backend to be ready..."
        kubectl wait --for=condition=ready pod -l app=ai-content-backend -n "$NAMESPACE" --timeout=300s
        log_success "Backend is ready"
    fi
}

deploy_frontend() {
    log_info "Deploying AI Content Frontend..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy frontend"
        kubectl apply -f frontend-deployment.yaml --dry-run=client
    else
        kubectl apply -f frontend-deployment.yaml
        
        # Wait for frontend to be ready
        log_info "Waiting for frontend to be ready..."
        kubectl wait --for=condition=ready pod -l app=ai-content-frontend -n "$NAMESPACE" --timeout=300s
        log_success "Frontend is ready"
    fi
}

apply_networking() {
    log_info "Applying networking configuration..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would apply networking"
        kubectl apply -f ingress.yaml --dry-run=client
        kubectl apply -f network-policy.yaml --dry-run=client
    else
        kubectl apply -f ingress.yaml
        kubectl apply -f network-policy.yaml
        log_success "Networking configuration applied"
    fi
}

apply_rbac() {
    log_info "Applying RBAC configuration..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would apply RBAC"
        kubectl apply -f rbac.yaml --dry-run=client
    else
        kubectl apply -f rbac.yaml
        log_success "RBAC configuration applied"
    fi
}

apply_autoscaling() {
    log_info "Applying autoscaling configuration..."
    
    # Check if metrics server is available
    if ! kubectl get apiservice v1beta1.metrics.k8s.io &> /dev/null; then
        log_warning "Metrics server not found, skipping HPA deployment"
        return
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would apply autoscaling"
        kubectl apply -f hpa.yaml --dry-run=client
    else
        kubectl apply -f hpa.yaml
        log_success "Autoscaling configuration applied"
    fi
}

apply_monitoring() {
    log_info "Applying monitoring configuration..."
    
    # Check if Prometheus CRDs are available
    if ! kubectl get crd servicemonitors.monitoring.coreos.com &> /dev/null; then
        log_warning "Prometheus CRDs not found, skipping monitoring deployment"
        return
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would apply monitoring"
        kubectl apply -f monitoring.yaml --dry-run=client
    else
        kubectl apply -f monitoring.yaml
        log_success "Monitoring configuration applied"
    fi
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check pod status
    log_info "Pod status:"
    kubectl get pods -n "$NAMESPACE" -o wide
    
    # Check service status
    log_info "Service status:"
    kubectl get services -n "$NAMESPACE"
    
    # Check ingress status
    log_info "Ingress status:"
    kubectl get ingress -n "$NAMESPACE"
    
    # Health check
    log_info "Performing health checks..."
    
    # Get backend service endpoint
    BACKEND_SERVICE=$(kubectl get service ai-content-backend-service -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    
    if [[ -n "$BACKEND_SERVICE" ]]; then
        # Port forward for health check (run in background)
        kubectl port-forward service/ai-content-backend-service -n "$NAMESPACE" 8080:8080 &
        PORT_FORWARD_PID=$!
        
        # Wait a moment for port forward to establish
        sleep 3
        
        # Health check
        if curl -f http://localhost:8080/health/live &> /dev/null; then
            log_success "Backend health check passed"
        else
            log_warning "Backend health check failed"
        fi
        
        # Clean up port forward
        kill $PORT_FORWARD_PID &> /dev/null || true
    fi
    
    log_success "Deployment verification completed"
}

print_access_info() {
    log_info "Access Information:"
    
    # Get ingress information
    INGRESS_INFO=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[*].host}')
    
    if [[ -n "$INGRESS_INFO" ]]; then
        echo "🌐 Application URLs:"
        for host in $INGRESS_INFO; do
            echo "   https://$host"
        done
    else
        echo "🌐 Use port-forwarding to access services:"
        echo "   kubectl port-forward service/ai-content-frontend-service -n $NAMESPACE 3000:3000"
        echo "   kubectl port-forward service/ai-content-backend-service -n $NAMESPACE 8080:8080"
    fi
    
    echo ""
    echo "📊 Monitoring:"
    echo "   kubectl port-forward service/ai-content-backend-service -n $NAMESPACE 8080:8080"
    echo "   curl http://localhost:8080/metrics"
    echo ""
    echo "🔧 Useful commands:"
    echo "   kubectl get pods -n $NAMESPACE"
    echo "   kubectl logs -f deployment/ai-content-backend-deployment -n $NAMESPACE"
    echo "   kubectl describe hpa -n $NAMESPACE"
}

cleanup() {
    # Clean up any background processes
    jobs -p | xargs -r kill &> /dev/null || true
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--context)
            KUBECTL_CONTEXT="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -s|--skip-secrets)
            SKIP_SECRETS=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Set trap for cleanup
trap cleanup EXIT

# Main execution
main() {
    echo "🚀 AI Content Workflow Kubernetes Deployment"
    echo "=============================================="
    echo ""
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No changes will be applied"
    fi
    
    check_prerequisites
    create_namespace
    apply_rbac
    apply_secrets
    apply_configmaps
    deploy_postgres
    deploy_backend
    deploy_frontend
    apply_networking
    apply_autoscaling
    apply_monitoring
    
    if [[ "$DRY_RUN" == "false" ]]; then
        verify_deployment
        print_access_info
    fi
    
    log_success "Deployment completed successfully!"
}

# Run main function
main "$@"