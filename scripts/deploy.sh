#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# TSN — Full Docker Build + Kubernetes Deploy Script
# Usage: ./scripts/deploy.sh [registry] [tag]
# Example: ./scripts/deploy.sh myregistry.io v1.0.0
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # exit on any error

REGISTRY=${1:-"tsn"}
TAG=${2:-"latest"}

echo "╔══════════════════════════════════════════════════════╗"
echo "║     Taxi Safety Network — Docker + K8s Deploy       ║"
echo "║     Registry: $REGISTRY  Tag: $TAG                  ║"
echo "╚══════════════════════════════════════════════════════╝"

SERVICES=("api-gateway" "auth-service" "alert-service" "location-service" "sms-service" "ussd-service" "socket-service")

# ── Step 1: Build all Docker images ───────────────────────────────────────────
echo ""
echo "▶ Step 1: Building Docker images..."
for SERVICE in "${SERVICES[@]}"; do
  echo "  Building $SERVICE..."
  docker build \
    -t "$REGISTRY/$SERVICE:$TAG" \
    -t "$REGISTRY/$SERVICE:latest" \
    ./services/$SERVICE
  echo "  ✓ $SERVICE built"
done

# ── Step 2: Push images to registry ───────────────────────────────────────────
echo ""
echo "▶ Step 2: Pushing images to registry..."
for SERVICE in "${SERVICES[@]}"; do
  echo "  Pushing $SERVICE..."
  docker push "$REGISTRY/$SERVICE:$TAG"
  docker push "$REGISTRY/$SERVICE:latest"
  echo "  ✓ $SERVICE pushed"
done

# ── Step 3: Create namespace ───────────────────────────────────────────────────
echo ""
echo "▶ Step 3: Creating namespace..."
kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: tsn
  labels:
    name: tsn
EOF
echo "  ✓ Namespace 'tsn' ready"

# ── Step 4: Apply secrets and configmaps ──────────────────────────────────────
echo ""
echo "▶ Step 4: Applying secrets and config..."
kubectl apply -f k8s/secrets/tsn-secrets.yaml
kubectl apply -f k8s/configmaps/tsn-config.yaml
echo "  ✓ Secrets and ConfigMaps applied"

# ── Step 5: Deploy databases ───────────────────────────────────────────────────
echo ""
echo "▶ Step 5: Deploying databases..."
kubectl apply -f k8s/deployments/mongo.yaml
kubectl apply -f k8s/deployments/redis.yaml
echo "  Waiting for MongoDB to be ready..."
kubectl rollout status deployment/mongo  -n tsn --timeout=120s
kubectl rollout status deployment/redis  -n tsn --timeout=60s
echo "  ✓ Databases ready"

# ── Step 6: Deploy microservices ───────────────────────────────────────────────
echo ""
echo "▶ Step 6: Deploying microservices..."
kubectl apply -f k8s/deployments/microservices.yaml
kubectl apply -f k8s/deployments/api-gateway.yaml
echo "  Waiting for services to roll out..."
for SERVICE in auth-service alert-service location-service sms-service socket-service api-gateway; do
  echo "  Waiting for $SERVICE..."
  kubectl rollout status deployment/$SERVICE -n tsn --timeout=120s
done
echo "  ✓ All microservices deployed"

# ── Step 7: Apply HPA ──────────────────────────────────────────────────────────
echo ""
echo "▶ Step 7: Applying Horizontal Pod Autoscalers..."
kubectl apply -f k8s/hpa/hpa.yaml
echo "  ✓ HPA configured"

# ── Step 8: Apply Ingress ──────────────────────────────────────────────────────
echo ""
echo "▶ Step 8: Applying Ingress..."
kubectl apply -f k8s/ingress/ingress.yaml
echo "  ✓ Ingress applied"

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║           ✅ Deployment Complete!                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Pods status:"
kubectl get pods -n tsn
echo ""
echo "Services:"
kubectl get services -n tsn
echo ""
echo "Get external IPs:"
echo "  kubectl get svc -n tsn api-gateway-service"
echo "  kubectl get svc -n tsn socket-service"
