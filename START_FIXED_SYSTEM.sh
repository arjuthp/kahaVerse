#!/bin/bash

# 🚀 Start Restaurant E-Commerce System with Fixed Authentication
# This script starts both backend and frontend with production authentication enabled

set -e

echo "=========================================="
echo "🚀 KAHA Restaurant E-Commerce Startup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directories
BACKEND_DIR="/home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce"
FRONTEND_DIR="/home/kali/Documents/KAHA_Verse/kaha_Restarant_Eecommerce_Frontend"

# Step 1: Verify configuration
echo -e "${BLUE}📋 Step 1: Verifying Configuration${NC}"
echo ""

# Check backend .env
echo -e "${YELLOW}Checking backend configuration...${NC}"
if grep -q "USE_MOCK_AUTH=false" "$BACKEND_DIR/.env"; then
    echo -e "${GREEN}✅ Backend: Mock auth disabled (Production mode)${NC}"
else
    echo -e "${RED}❌ Backend: Mock auth still enabled!${NC}"
    echo "   Please set USE_MOCK_AUTH=false in $BACKEND_DIR/.env"
    exit 1
fi

if grep -q "KAH_API_V3_BASE_URL=https://api.kaha.com.np/main/api/v3" "$BACKEND_DIR/.env"; then
    echo -e "${GREEN}✅ Backend: Kaha Main V3 URL configured correctly${NC}"
else
    echo -e "${RED}❌ Backend: Kaha Main V3 URL incorrect!${NC}"
    echo "   Should be: KAH_API_V3_BASE_URL=https://api.kaha.com.np/main/api/v3"
    exit 1
fi

# Check frontend .env
echo -e "${YELLOW}Checking frontend configuration...${NC}"
if grep -q "VITE_KAHA_MAIN_V3_URL=https://api.kaha.com.np/main/api/v3" "$FRONTEND_DIR/.env"; then
    echo -e "${GREEN}✅ Frontend: Kaha Main V3 URL configured correctly${NC}"
else
    echo -e "${RED}❌ Frontend: Kaha Main V3 URL not configured!${NC}"
    echo "   Please add VITE_KAHA_MAIN_V3_URL=https://api.kaha.com.np/main/api/v3 to $FRONTEND_DIR/.env"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All configuration checks passed!${NC}"
echo ""

# Step 2: Check if PostgreSQL is running
echo -e "${BLUE}📋 Step 2: Checking PostgreSQL${NC}"
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL is not running. Attempting to start...${NC}"
    sudo systemctl start postgresql
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PostgreSQL started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
        exit 1
    fi
fi
echo ""

# Step 3: Test Kaha Main V3 connectivity
echo -e "${BLUE}📋 Step 3: Testing Kaha Main V3 Connectivity${NC}"
echo -e "${YELLOW}Testing connection to https://api.kaha.com.np/main/api/v3...${NC}"

if curl -s --max-time 5 https://api.kaha.com.np/main/api/v3/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Kaha Main V3 API is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Could not reach Kaha Main V3 health endpoint${NC}"
    echo "   This might be normal if the health endpoint doesn't exist"
    echo "   Continuing anyway..."
fi
echo ""

# Step 4: Start Backend
echo -e "${BLUE}📋 Step 4: Starting Backend (Port 3001)${NC}"
echo -e "${YELLOW}Starting NestJS backend...${NC}"
cd "$BACKEND_DIR"

# Check if backend is already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Port 3001 is already in use${NC}"
    echo "   Killing existing process..."
    kill -9 $(lsof -t -i:3001) 2>/dev/null || true
    sleep 2
fi

# Start backend in background
echo "   Starting backend..."
sh -c "npm run migration:run && npm run dev" > /tmp/kaha-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "   Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:3001/api/v1/health > /dev/null 2>&1 || \
       curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend started successfully (PID: $BACKEND_PID)${NC}"
        echo "   Logs: tail -f /tmp/kaha-backend.log"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start within 30 seconds${NC}"
        echo "   Check logs: cat /tmp/kaha-backend.log"
        exit 1
    fi
    sleep 1
done

# Check for production mode in logs
sleep 2
if grep -q "Production Mode" /tmp/kaha-backend.log; then
    echo -e "${GREEN}✅ Backend running in Production Mode (external auth)${NC}"
else
    echo -e "${YELLOW}⚠️  Could not confirm production mode in logs${NC}"
fi
echo ""

# Step 5: Start Frontend
echo -e "${BLUE}📋 Step 5: Starting Frontend (Port 5173)${NC}"
echo -e "${YELLOW}Starting Vite dev server...${NC}"
cd "$FRONTEND_DIR"

# Check if frontend is already running on 5173 or 5174
for port in 5173 5174; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        echo "   Killing existing process..."
        kill -9 $(lsof -t -i:$port) 2>/dev/null || true
        sleep 1
    fi
done

# Start frontend in background
echo "   Starting frontend..."
npm run dev > /tmp/kaha-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "   Waiting for frontend to start..."
FRONTEND_PORT=""
for i in {1..30}; do
    # Check both 5173 and 5174
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        FRONTEND_PORT="5173"
        echo -e "${GREEN}✅ Frontend started successfully on port 5173 (PID: $FRONTEND_PID)${NC}"
        echo "   Logs: tail -f /tmp/kaha-frontend.log"
        break
    elif curl -s http://localhost:5174 > /dev/null 2>&1; then
        FRONTEND_PORT="5174"
        echo -e "${GREEN}✅ Frontend started successfully on port 5174 (PID: $FRONTEND_PID)${NC}"
        echo "   Logs: tail -f /tmp/kaha-frontend.log"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend failed to start within 30 seconds${NC}"
        echo "   Check logs: cat /tmp/kaha-frontend.log"
        exit 1
    fi
    sleep 1
done
echo ""

# Step 6: Summary
echo "=========================================="
echo -e "${GREEN}✅ System Started Successfully!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
if [ -n "$FRONTEND_PORT" ]; then
    echo "   Frontend:     http://localhost:$FRONTEND_PORT"
else
    echo "   Frontend:     http://localhost:5173 (or 5174)"
fi
echo "   Backend API:  http://localhost:3001/api/v1"
echo "   API Docs:     http://localhost:3001/api/v1/docs"
echo ""
echo -e "${BLUE}🔑 Test Credentials (Kaha Main V3):${NC}"
echo "   Admin:"
echo "     Email:    admin@kahastays.com"
echo "     Password: password123"
echo ""
echo "   Owner:"
echo "     Email:    owner@kahastays.com"
echo "     Password: password123"
echo ""
echo -e "${BLUE}📊 Process IDs:${NC}"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo "   Backend:  tail -f /tmp/kaha-backend.log"
echo "   Frontend: tail -f /tmp/kaha-frontend.log"
echo ""
echo -e "${BLUE}🛑 To Stop:${NC}"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   Or: pkill -f 'nest start' && pkill -f 'vite'"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "   - Authentication now uses Kaha Main V3 (production)"
echo "   - Mock auth is disabled"
echo "   - Use real credentials from Kaha Main V3"
echo ""
echo -e "${GREEN}🎉 Ready to test! Open http://localhost:${FRONTEND_PORT:-5173}${NC}"
echo ""
