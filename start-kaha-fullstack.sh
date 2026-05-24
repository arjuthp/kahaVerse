#!/bin/bash

# KAHA Restaurant E-Commerce Full Stack Startup Script
# This script starts the database, backend, and frontend services

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
BACKEND_DIR="/home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce"
FRONTEND_DIR="/home/kali/Documents/KAHA_Verse/kaha_Restarant_Eecommerce_Frontend/kaha_Restarant_Eecommerce_Frontend"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   KAHA Restaurant E-Commerce - Full Stack Startup         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $service_name is ready!${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo -e "${RED}✗ $service_name failed to start within expected time${NC}"
    return 1
}

# Step 1: Check and start PostgreSQL
echo -e "${BLUE}[1/5] Checking PostgreSQL Database...${NC}"
cd "$BACKEND_DIR"

if check_port 5432; then
    echo -e "${GREEN}✓ PostgreSQL is already running on port 5432${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL not detected. Starting with Docker Compose...${NC}"
    
    # Check if docker-compose is available
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker not found. Please install Docker first.${NC}"
        echo -e "${YELLOW}  Alternatively, start PostgreSQL manually with:${NC}"
        echo -e "${YELLOW}  - Host: localhost${NC}"
        echo -e "${YELLOW}  - Port: 5432${NC}"
        echo -e "${YELLOW}  - Database: kaha_restaurant_db${NC}"
        echo -e "${YELLOW}  - User: postgres${NC}"
        echo -e "${YELLOW}  - Password: postgres${NC}"
        exit 1
    fi
    
    # Start only the postgres service (try both docker-compose and docker compose)
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d postgres
    else
        docker compose up -d postgres
    fi
    
    # Wait for PostgreSQL to be ready
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to initialize...${NC}"
    sleep 5
    
    # Check if PostgreSQL is responding
    for i in {1..10}; do
        if PGPASSWORD=postgres psql -h localhost -U postgres -d kaha_restaurant_db -c "SELECT 1" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ PostgreSQL is ready!${NC}"
            break
        fi
        if [ $i -eq 10 ]; then
            echo -e "${RED}✗ PostgreSQL failed to start${NC}"
            exit 1
        fi
        sleep 2
    done
fi

echo ""

# Step 2: Install Backend Dependencies
echo -e "${BLUE}[2/5] Checking Backend Dependencies...${NC}"
cd "$BACKEND_DIR"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ Installing backend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

echo ""

# Step 3: Seed Database
echo -e "${BLUE}[3/5] Seeding Database...${NC}"
cd "$BACKEND_DIR"

echo -e "${YELLOW}⚠ Running database seed script...${NC}"
npm run seed

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database seeded successfully!${NC}"
    echo -e "${GREEN}  - Categories: Food, Drinks, Desserts (with subcategories)${NC}"
    echo -e "${GREEN}  - Menu Items: Burgers, Pizza, Pasta, Coffee, Juices, Desserts${NC}"
    echo -e "${GREEN}  - Addon Groups: Sauces, Extras, Size, Pizza Toppings${NC}"
    echo -e "${GREEN}  - Business ID: biz-mock-001${NC}"
else
    echo -e "${YELLOW}⚠ Seed script completed with warnings (data may already exist)${NC}"
fi

echo ""

# Step 4: Start Backend Server
echo -e "${BLUE}[4/5] Starting Backend Server...${NC}"
cd "$BACKEND_DIR"

if check_port 3001; then
    echo -e "${YELLOW}⚠ Backend already running on port 3001${NC}"
    echo -e "${YELLOW}  If you want to restart it, stop the existing process first${NC}"
else
    echo -e "${YELLOW}⚠ Starting NestJS backend on port 3001...${NC}"
    echo -e "${YELLOW}  Backend will run in the background${NC}"
    echo -e "${YELLOW}  Logs: $BACKEND_DIR/backend.log${NC}"
    
    # Start backend in background
    nohup npm run dev > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    # Wait for backend to be ready
    sleep 5
    if wait_for_service "http://localhost:3001" "Backend API"; then
        echo -e "${GREEN}✓ Backend started successfully (PID: $BACKEND_PID)${NC}"
        echo -e "${GREEN}  - API: http://localhost:3001${NC}"
        echo -e "${GREEN}  - Swagger Docs: http://localhost:3001/api${NC}"
    else
        echo -e "${RED}✗ Backend failed to start. Check backend.log for details${NC}"
        exit 1
    fi
fi

echo ""

# Step 5: Start Frontend
echo -e "${BLUE}[5/5] Starting Frontend...${NC}"
cd "$FRONTEND_DIR"

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ Installing frontend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

if check_port 5173; then
    echo -e "${YELLOW}⚠ Frontend already running on port 5173${NC}"
else
    echo -e "${YELLOW}⚠ Starting React frontend on port 5173...${NC}"
    echo -e "${YELLOW}  Frontend will run in the background${NC}"
    echo -e "${YELLOW}  Logs: $FRONTEND_DIR/frontend.log${NC}"
    
    # Start frontend in background
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    # Wait for frontend to be ready
    sleep 5
    if wait_for_service "http://localhost:5173" "Frontend"; then
        echo -e "${GREEN}✓ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
        echo -e "${GREEN}  - URL: http://localhost:5173${NC}"
    else
        echo -e "${RED}✗ Frontend failed to start. Check frontend.log for details${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 All Services Started Successfully! 🎉      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
echo -e "   ${GREEN}Frontend:${NC}      http://localhost:5173"
echo -e "   ${GREEN}Backend API:${NC}   http://localhost:3001"
echo -e "   ${GREEN}Swagger Docs:${NC}  http://localhost:3001/api"
echo -e "   ${GREEN}Database:${NC}      localhost:5432 (kaha_restaurant_db)"
echo ""
echo -e "${BLUE}🔑 Test Credentials:${NC}"
echo -e "   ${GREEN}Business ID:${NC}   biz-mock-001"
echo -e "   ${GREEN}Mock Auth:${NC}     Enabled (USE_MOCK_AUTH=true)"
echo ""
echo -e "${BLUE}📊 Seeded Data:${NC}"
echo -e "   ${GREEN}✓${NC} Categories: Food, Drinks, Desserts"
echo -e "   ${GREEN}✓${NC} Subcategories: Burgers, Pizza, Pasta, Coffee, Fresh Juices"
echo -e "   ${GREEN}✓${NC} Menu Items: 13 items with variants"
echo -e "   ${GREEN}✓${NC} Addon Groups: Sauces, Extras, Size, Pizza Toppings"
echo -e "   ${GREEN}✓${NC} Addons: 19 addon items"
echo ""
echo -e "${BLUE}🛠️  Management Commands:${NC}"
echo -e "   ${YELLOW}Stop Backend:${NC}   kill \$(cat $BACKEND_DIR/backend.pid)"
echo -e "   ${YELLOW}Stop Frontend:${NC}  kill \$(cat $FRONTEND_DIR/frontend.pid)"
echo -e "   ${YELLOW}View Backend Logs:${NC}  tail -f $BACKEND_DIR/backend.log"
echo -e "   ${YELLOW}View Frontend Logs:${NC} tail -f $FRONTEND_DIR/frontend.log"
echo -e "   ${YELLOW}Stop Database:${NC}  cd $BACKEND_DIR && docker-compose down"
echo ""
echo -e "${GREEN}✨ Happy coding! ✨${NC}"
