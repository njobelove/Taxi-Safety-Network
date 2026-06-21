#!/bin/bash
# ── TSN Local Development ──────────────────────────────────────────────────────
# Usage:
#   ./scripts/local-dev.sh          → start all services
#   ./scripts/local-dev.sh down     → stop all services
#   ./scripts/local-dev.sh logs     → tail all logs
#   ./scripts/local-dev.sh status   → show running containers

set -e
CMD=${1:-"up"}

case $CMD in
  up)
    echo "Starting TSN services locally..."
    docker-compose up --build -d
    echo ""
    echo "Services running:"
    docker-compose ps
    echo ""
    echo "  API Gateway → http://localhost:3000"
    echo "  Auth        → http://localhost:3001"
    echo "  Alerts      → http://localhost:3002"
    echo "  Location    → http://localhost:3003"
    echo "  SMS         → http://localhost:3004"
    echo "  USSD        → http://localhost:3005"
    echo "  Socket.IO   → http://localhost:3006"
    echo "  MongoDB     → mongodb://localhost:27017"
    echo "  Redis       → redis://localhost:6379"
    ;;
  down)
    echo "Stopping TSN services..."
    docker-compose down
    ;;
  logs)
    docker-compose logs -f
    ;;
  status)
    docker-compose ps
    ;;
  reset)
    echo "Resetting all data (volumes deleted)..."
    docker-compose down -v
    docker-compose up --build -d
    ;;
  *)
    echo "Usage: ./scripts/local-dev.sh [up|down|logs|status|reset]"
    ;;
esac
