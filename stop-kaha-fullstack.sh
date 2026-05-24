#!/bin/bash

# KAHA Restaurant E-Commerce Full Stack Stop Script
# This script stops all running services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
BACKEND_DIR="/home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce"
FRONTEND_DIR="/home/kali/Documents/KAHA_Verse/kaha_Restarant_Eecommerce_Frontend"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   KAHA Restaurant E-Commerce - Stopping Services          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Stop Backend
echo -e "${YELLOW}[1/3] Stopping Backend Server...${NC}"
if [ -f "$BACKEND_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$BACKEND_DIR/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        rm "$BACKEND_DIR/backend.pid"
        echo -e "${GREEN}✓ Backend stopped (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠ Backend process not running${NC}"
        rm "$BACKEND_DIR/backend.pid"
    fi
else
    echo -e "${YELLOW}⚠ No backend PID file found${NC}"
fi

# Stop Frontend
echo -e "${YELLOW}[2/3] Stopping Frontend...${NC}"
if [ -f "$FRONTEND_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_DIR/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        rm "$FRONTEND_DIR/frontend.pid"
        echo -e "${GREEN}✓ Frontend stopped (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend process not running${NC}"
        rm "$FRONTEND_DIR/frontend.pid"
    fi
else
    echo -e "${YELLOW}⚠ No frontend PID file found${NC}"
fi

# Stop Database (optional)
echo -e "${YELLOW}[3/3] Stopping Database...${NC}"
echo -e "${BLUE}Do you want to stop the PostgreSQL database? (y/N)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    cd "$BACKEND_DIR"
    if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
        docker-compose down
        echo -e "${GREEN}✓ Database stopped${NC}"
    else
        echo -e "${YELLOW}⚠ Docker Compose not found. Please stop PostgreSQL manually${NC}"
    fi
else
    echo -e "${BLUE}ℹ Database left running${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ Services Stopped Successfully               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
