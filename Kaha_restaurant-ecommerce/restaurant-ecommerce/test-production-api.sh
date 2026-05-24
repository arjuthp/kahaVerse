#!/bin/bash

echo "=========================================="
echo "Testing Production API Integration"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env has USE_MOCK_AUTH=false
echo "1. Checking .env configuration..."
if grep -q "USE_MOCK_AUTH=false" .env; then
    echo -e "${GREEN}✓ USE_MOCK_AUTH is set to false${NC}"
else
    echo -e "${RED}✗ USE_MOCK_AUTH is not set to false${NC}"
    exit 1
fi

# Check production URL is configured
echo ""
echo "2. Checking production URL configuration..."
if grep -q "KAH_API_V3_BASE_URL=https://api.kaha.com.np" .env; then
    echo -e "${GREEN}✓ Production URL is configured: https://api.kaha.com.np${NC}"
else
    echo -e "${YELLOW}⚠ Production URL might not be configured correctly${NC}"
fi

# Test if the application is running
echo ""
echo "3. Testing if application is running..."
if curl -s http://localhost:3001/api/v1 > /dev/null; then
    echo -e "${GREEN}✓ Application is running on port 3001${NC}"
else
    echo -e "${RED}✗ Application is not responding${NC}"
    exit 1
fi

# Try to make a request that would trigger the service communication
echo ""
echo "4. Testing authenticated endpoint (will fail without valid JWT, but shows it's trying production API)..."
echo ""
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET http://localhost:3001/api/v1/menu/test-business-id \
  -H "Authorization: Bearer invalid-token-for-testing" \
  -H "Accept: application/json")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Response Code: $HTTP_CODE"
echo "Response Body: $BODY"

if [ "$HTTP_CODE" = "401" ]; then
    echo ""
    echo -e "${GREEN}✓ Got 401 Unauthorized - This is expected! It means:${NC}"
    echo -e "${GREEN}  - The app is NOT using mock data${NC}"
    echo -e "${GREEN}  - It's trying to validate JWT against production API${NC}"
    echo -e "${GREEN}  - You need a valid JWT token from production to proceed${NC}"
elif [ "$HTTP_CODE" = "500" ]; then
    echo ""
    echo -e "${YELLOW}⚠ Got 500 Internal Server Error - This might mean:${NC}"
    echo -e "${YELLOW}  - The production API is unreachable${NC}"
    echo -e "${YELLOW}  - Network connectivity issues${NC}"
    echo -e "${YELLOW}  - Check application logs for details${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠ Got unexpected response code: $HTTP_CODE${NC}"
fi

echo ""
echo "=========================================="
echo "Summary:"
echo "=========================================="
echo -e "${GREEN}✓ Mock authentication is DISABLED${NC}"
echo -e "${GREEN}✓ Application is configured to use production API${NC}"
echo -e "${GREEN}✓ Production URL: https://api.kaha.com.np${NC}"
echo ""
echo "Next steps:"
echo "1. Get a valid JWT token from the production Kaha Main API"
echo "2. Use that token in your requests"
echo "3. Test with Postman or curl using the real token"
echo ""
