#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# TSN DevOps Stack Deploy Script
# Deploys: Prometheus + Grafana + Alertmanager + Jenkins + SonarQube
#
# Usage:
#   ./scripts/deploy-devops.sh local     → docker-compose (dev machine)
#   ./scripts/deploy-devops.sh k8s       → Kubernetes cluster
# ═══════════════════════════════════════════════════════════════════════════════
set -e
MODE=${1:-local}

print_header() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║       TSN DevOps Stack — $1"
  echo "╚══════════════════════════════════════════════════════════╝"
}

# ── LOCAL (Docker Compose) ────────────────────────────────────────────────────
if [ "$MODE" = "local" ]; then
  print_header "Docker Compose"

  echo "▶ Starting DevOps stack..."
  docker-compose -f docker-compose.devops.yml up -d

  echo ""
  echo "⏳ Waiting for services to start..."
  sleep 10

  echo ""
  echo "▶ Health checks..."
  services=(
    "Prometheus:http://localhost:9090/-/healthy"
    "Grafana:http://localhost:3100/api/health"
    "SonarQube:http://localhost:9000/api/system/status"
    "Jenkins:http://localhost:8080/login"
    "Alertmanager:http://localhost:9093/-/healthy"
  )
  for item in "${services[@]}"; do
    name="${item%%:*}"
    url="${item#*:}"
    if curl -sf "$url" > /dev/null 2>&1; then
      echo "  ✓ $name is UP"
    else
      echo "  ⏳ $name starting... (may take 1-2 min)"
    fi
  done

  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║              TSN DevOps Stack URLs                      ║"
  echo "╠══════════════════════════════════════════════════════════╣"
  echo "║  📊 Grafana      → http://localhost:3100                 ║"
  echo "║     Login: admin / tsn_grafana_2024                     ║"
  echo "║                                                          ║"
  echo "║  📈 Prometheus   → http://localhost:9090                 ║"
  echo "║  🔔 Alertmanager → http://localhost:9093                 ║"
  echo "║                                                          ║"
  echo "║  🔧 Jenkins      → http://localhost:8080                 ║"
  echo "║     Login: admin / tsn_jenkins_2024                     ║"
  echo "║                                                          ║"
  echo "║  🔍 SonarQube    → http://localhost:9000                 ║"
  echo "║     Login: admin / admin  (change on first login)       ║"
  echo "╚══════════════════════════════════════════════════════════╝"

# ── KUBERNETES ─────────────────────────────────────────────────────────────────
elif [ "$MODE" = "k8s" ]; then
  print_header "Kubernetes"

  echo "▶ Deploying monitoring stack (Prometheus + Grafana)..."
  kubectl apply -f k8s/monitoring/monitoring-stack.yaml
  kubectl rollout status deployment/prometheus -n tsn-monitoring --timeout=120s
  kubectl rollout status deployment/grafana     -n tsn-monitoring --timeout=120s
  echo "  ✓ Monitoring stack ready"

  echo ""
  echo "▶ Deploying Jenkins..."
  kubectl apply -f k8s/jenkins/jenkins.yaml
  kubectl rollout status deployment/jenkins -n tsn-cicd --timeout=180s
  echo "  ✓ Jenkins ready"

  echo ""
  echo "▶ Deploying SonarQube..."
  kubectl apply -f k8s/sonarqube/sonarqube.yaml
  echo "  ⏳ SonarQube takes ~3 minutes to start..."
  kubectl wait --for=condition=available deployment/sonarqube \
    -n tsn-quality --timeout=300s || true
  echo "  ✓ SonarQube deployed"

  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║              Kubernetes External IPs                    ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  echo "  Monitoring:"
  kubectl get svc grafana-service     -n tsn-monitoring --no-headers 2>/dev/null | awk '{print "  Grafana:     http://"$4":3000"}'
  kubectl get svc prometheus-service  -n tsn-monitoring --no-headers 2>/dev/null | awk '{print "  Prometheus:  http://"$4":9090"}'
  echo ""
  echo "  CI/CD:"
  kubectl get svc jenkins-service     -n tsn-cicd      --no-headers 2>/dev/null | awk '{print "  Jenkins:     http://"$4":8080"}'
  echo ""
  echo "  Quality:"
  kubectl get svc sonarqube-service   -n tsn-quality   --no-headers 2>/dev/null | awk '{print "  SonarQube:   http://"$4":9000"}'

else
  echo "Usage: ./scripts/deploy-devops.sh [local|k8s]"
  exit 1
fi
