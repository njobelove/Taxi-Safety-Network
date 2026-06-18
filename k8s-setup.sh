#!/bin/bash

echo "=== Creating Kubernetes Namespaces ==="
kubectl create namespace tsn
kubectl create namespace tsn-cicd
kubectl create namespace tsn-monitoring
kubectl create namespace tsn-quality

echo ""
echo "=== Verifying Namespaces ==="
kubectl get namespaces

echo ""
echo "=== Applying ConfigMaps and Secrets ==="
kubectl apply -f k8s/configmaps/tsn-config.yaml
kubectl apply -f k8s/secrets/tsn-secrets.yaml

echo ""
echo "=== Applying Database Deployments (MongoDB & Redis) ==="
kubectl apply -f k8s/deployments/mongo.yaml
kubectl apply -f k8s/deployments/redis.yaml

echo ""
echo "=== Waiting for Database Services (30 seconds) ==="
sleep 30

echo ""
echo "=== Applying Core Microservices ==="
kubectl apply -f k8s/deployments/api-gateway.yaml
kubectl apply -f k8s/deployments/microservices.yaml

echo ""
echo "=== Applying Monitoring Stack ==="
kubectl apply -f k8s/monitoring/monitoring-stack.yaml

echo ""
echo "=== Applying Jenkins CI/CD ==="
kubectl apply -f k8s/jenkins/jenkins.yaml

echo ""
echo "=== Applying SonarQube ==="
kubectl apply -f k8s/sonarqube/sonarqube.yaml

echo ""
echo "=== Verifying Services ==="
kubectl get svc --all-namespaces

echo ""
echo "=== Checking Deployments Status ==="
kubectl get deployments --all-namespaces

echo ""
echo "✓ Kubernetes setup complete! Services are deploying..."
echo ""
echo "Dashboard Access (once pods are ready):"
echo "  - Jenkins:    http://localhost:8080"
echo "  - Grafana:    http://localhost:3000 (admin/tsn_grafana_2024)"
echo "  - Prometheus: kubectl port-forward -n tsn-monitoring svc/prometheus-service 9090:9090"
echo "  - SonarQube:  http://localhost:9000 (admin/admin)"
echo ""
echo "Monitor pod status with:"
echo "  kubectl get pods --all-namespaces -w"
