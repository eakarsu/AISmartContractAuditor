#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

print_banner() {
    echo ""
    echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║              AI Smart Contract Auditor                       ║${NC}"
    echo -e "${CYAN}${BOLD}║          Solidity/Move Vulnerability Detection                ║${NC}"
    echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${MAGENTA}  Features:${NC}"
    echo -e "    ${GREEN}AI:${NC} Vulnerability Scan | Gas Optimization | Compliance Check"
    echo -e "    ${GREEN}AI:${NC} Test Generation | Code Quality | Reentrancy Detection"
    echo -e "    ${BLUE}Mgmt:${NC} Contracts | Audits | Projects | Templates | History"
    echo ""
}

load_env() {
    if [ -f "$PROJECT_DIR/.env" ]; then
        set -a
        source "$PROJECT_DIR/.env"
        set +a
        echo -e "${GREEN}[✓]${NC} Environment loaded from .env"
    else
        echo -e "${RED}[✗]${NC} .env file not found!"
        exit 1
    fi
    export BACKEND_PORT=${BACKEND_PORT:-4000}
    export FRONTEND_PORT=${FRONTEND_PORT:-3000}
}

clean_ports() {
    echo -e "${YELLOW}[~]${NC} Cleaning ports $BACKEND_PORT and $FRONTEND_PORT..."
    for PORT in $BACKEND_PORT $FRONTEND_PORT; do
        PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
        if [ -n "$PIDS" ]; then
            echo "$PIDS" | xargs kill -9 2>/dev/null || true
            echo -e "${GREEN}[✓]${NC} Cleaned port $PORT"
        fi
    done
    sleep 1
}

check_node() {
    if ! command -v node &>/dev/null; then
        echo -e "${RED}[✗]${NC} Node.js not found! Please install Node.js 18+"
        exit 1
    fi
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}[✗]${NC} Node.js 18+ required (found v$(node -v))"
        exit 1
    fi
    echo -e "${GREEN}[✓]${NC} Node.js $(node -v)"
}

check_postgres() {
    if ! command -v psql &>/dev/null; then
        echo -e "${YELLOW}[!]${NC} psql not found, checking if PostgreSQL is accessible..."
    fi

    # Try to create database if it doesn't exist
    if command -v createdb &>/dev/null; then
        createdb ai_smart_contract_auditor 2>/dev/null || true
    elif command -v psql &>/dev/null; then
        psql -U postgres -c "CREATE DATABASE ai_smart_contract_auditor;" 2>/dev/null || true
    fi
    echo -e "${GREEN}[✓]${NC} PostgreSQL check complete"
}

install_deps() {
    echo -e "${YELLOW}[~]${NC} Installing backend dependencies..."
    cd "$PROJECT_DIR/backend"
    npm install --silent 2>&1 | tail -1
    echo -e "${GREEN}[✓]${NC} Backend dependencies installed"

    echo -e "${YELLOW}[~]${NC} Installing frontend dependencies..."
    cd "$PROJECT_DIR/frontend"
    npm install --silent 2>&1 | tail -1
    echo -e "${GREEN}[✓]${NC} Frontend dependencies installed"

    cd "$PROJECT_DIR"
}

run_migrations() {
    echo -e "${YELLOW}[~]${NC} Running database migrations..."
    cd "$PROJECT_DIR/backend"
    npx prisma generate --schema=prisma/schema.prisma 2>&1 | tail -1
    npx prisma db push --schema=prisma/schema.prisma --accept-data-loss 2>&1 | tail -1
    echo -e "${GREEN}[✓]${NC} Database schema synced"
    cd "$PROJECT_DIR"
}

seed_database() {
    echo -e "${YELLOW}[~]${NC} Seeding database..."
    cd "$PROJECT_DIR/backend"
    npx ts-node --files prisma/seed.ts
    echo -e "${GREEN}[✓]${NC} Database seeded"
    cd "$PROJECT_DIR"
}

start_backend() {
    echo -e "${YELLOW}[~]${NC} Starting backend on port $BACKEND_PORT..."
    cd "$PROJECT_DIR/backend"
    npx nodemon --exec "npx ts-node --files src/index.ts" --watch src --ext ts &
    BACKEND_PID=$!
    cd "$PROJECT_DIR"
    echo -e "${GREEN}[✓]${NC} Backend started (PID: $BACKEND_PID)"
}

start_frontend() {
    echo -e "${YELLOW}[~]${NC} Starting frontend on port $FRONTEND_PORT..."
    cd "$PROJECT_DIR/frontend"
    npx vite --port $FRONTEND_PORT &
    FRONTEND_PID=$!
    cd "$PROJECT_DIR"
    echo -e "${GREEN}[✓]${NC} Frontend started (PID: $FRONTEND_PID)"
}

wait_for_backend() {
    echo -e "${YELLOW}[~]${NC} Waiting for backend to be ready..."
    for i in $(seq 1 30); do
        if curl -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
            echo -e "${GREEN}[✓]${NC} Backend is ready!"
            return 0
        fi
        sleep 1
    done
    echo -e "${YELLOW}[!]${NC} Backend may still be starting..."
}

print_ready() {
    echo ""
    echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║                    Application Ready!                        ║${NC}"
    echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${CYAN}Frontend:${NC}  http://localhost:$FRONTEND_PORT"
    echo -e "  ${CYAN}Backend:${NC}   http://localhost:$BACKEND_PORT"
    echo -e "  ${CYAN}Health:${NC}    http://localhost:$BACKEND_PORT/api/health"
    echo ""
    echo -e "  ${MAGENTA}Login Credentials:${NC}"
    echo -e "    Email:    ${BOLD}admin@auditor.com${NC}"
    echo -e "    Password: ${BOLD}password${NC}"
    echo ""
    echo -e "  ${YELLOW}Hot reload enabled - code changes auto-refresh${NC}"
    echo -e "  ${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""
}

cleanup() {
    echo ""
    echo -e "${YELLOW}[~]${NC} Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    clean_ports
    echo -e "${GREEN}[✓]${NC} All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main execution
print_banner
load_env
clean_ports
check_node
check_postgres
install_deps
run_migrations
seed_database
start_backend
start_frontend
wait_for_backend
print_ready

# Keep alive
wait
