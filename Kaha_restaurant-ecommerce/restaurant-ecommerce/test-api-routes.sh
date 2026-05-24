#!/bin/bash

# Test script to verify API routes
echo "Testing API routes..."

# Start the server in the background
npm run start:prod &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test category routes
echo "Testing GET /api/categories/business/test..."
curl -s http://localhost:3001/api/categories/business/test | head -20

echo -e "\n\nTesting GET /api/menu/test..."
curl -s http://localhost:3001/api/menu/test | head -20

# Kill the server
kill $SERVER_PID

echo -e "\n\nDone!"
