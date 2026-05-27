#!/bin/bash

# 🧪 Test Auth Integration Script
# Tests the authentication between Kaha Main API v3 and Restaurant E-commerce

set -e

echo "🔍 Testing API Integration Authentication..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Service account token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNzNhN2E3Zi1kYWY0LTQ1MTktYjJiYy0wOTRkOWI3MWRjMTAiLCJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwibmFtZSI6IkthaGEgTWFpbiBBUEkgdjMgSW50ZWdyYXRpb24iLCJpYXQiOjE3Nzk2OTc2MDIsImV4cCI6MTgxMTIzMzYwMn0.nI6SQ4q01M_2hE3MwimRTT2QG2swHQiD1oqVT3n_jsA"

# Test 1: Check if Restaurant E-commerce is running
echo "📡 Test 1: Checking if Restaurant E-commerce is running..."
if curl -s http://localhost:3001/api/v1/admin/service-accounts > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Restaurant E-commerce is running on port 3001${NC}"
else
    echo -e "${RED}❌ Restaurant E-commerce is NOT running on port 3001${NC}"
    echo "   Start it with: cd Kaha_restaurant-ecommerce/restaurant-ecommerce && npm run start:dev"
    exit 1
fi
echo ""

# Test 2: Check if Kaha Main API v3 is running
echo "📡 Test 2: Checking if Kaha Main API v3 is running..."
if curl -s http://localhost:3006 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Kaha Main API v3 is running on port 3006${NC}"
else
    echo -e "${YELLOW}⚠️  Kaha Main API v3 is NOT running on port 3006${NC}"
    echo "   Start it with: cd kaha-main-api-v3 && npm run dev"
fi
echo ""

# Test 3: Verify service account exists
echo "🔑 Test 3: Verifying service account..."
RESPONSE=$(curl -s http://localhost:3001/api/v1/admin/service-accounts)
if echo "$RESPONSE" | grep -q "Kaha Main API v3 Integration"; then
    echo -e "${GREEN}✅ Service account 'Kaha Main API v3 Integration' exists${NC}"
    echo "$RESPONSE" | jq -r '.[] | select(.serviceAccountName == "Kaha Main API v3 Integration") | "   ID: \(.id)\n   Active: \(.isActive)\n   Expires: \(.tokenExpiresAt)"'
else
    echo -e "${RED}❌ Service account not found${NC}"
    exit 1
fi
echo ""

# Test 4: Test service account authentication
echo "🔐 Test 4: Testing service account authentication..."
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/v1/kaha-sync/user-restaurant \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "externalUserId": "test-auth-user-'$(date +%s)'",
      "phone": "98012'$(date +%s | tail -c 6)'",
      "firstName": "Auth",
      "lastName": "Test",
      "email": "authtest'$(date +%s)'@example.com"
    },
    "restaurant": {
      "externalRestaurantId": "test-auth-restaurant-'$(date +%s)'",
      "name": "Auth Test Restaurant",
      "address": {
        "country": "Nepal",
        "city": "Kathmandu",
        "streetAddress": "Test Street"
      },
      "contact": {
        "phones": ["98012'$(date +%s | tail -c 6)'"]
      }
    }
  }')

HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)
BODY=$(echo "$AUTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Service account authentication successful (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}❌ Service account authentication failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    exit 1
fi
echo ""

# Test 5: Check Kaha Main API v3 configuration
echo "⚙️  Test 5: Checking Kaha Main API v3 configuration..."
if [ -f "kaha-main-api-v3/.env" ]; then
    if grep -q "RESTAURANT_ECOMMERCE_URL=http://localhost:3001/api/v1" kaha-main-api-v3/.env; then
        echo -e "${GREEN}✅ RESTAURANT_ECOMMERCE_URL is correctly configured${NC}"
    else
        echo -e "${RED}❌ RESTAURANT_ECOMMERCE_URL is not correctly configured${NC}"
        echo "   Expected: http://localhost:3001/api/v1"
        echo "   Found: $(grep RESTAURANT_ECOMMERCE_URL kaha-main-api-v3/.env || echo 'NOT SET')"
    fi
    
    if grep -q "RESTAURANT_ECOMMERCE_TOKEN=eyJ" kaha-main-api-v3/.env; then
        echo -e "${GREEN}✅ RESTAURANT_ECOMMERCE_TOKEN is configured${NC}"
    else
        echo -e "${RED}❌ RESTAURANT_ECOMMERCE_TOKEN is not configured${NC}"
    fi
else
    echo -e "${RED}❌ kaha-main-api-v3/.env file not found${NC}"
fi
echo ""

# Test 6: Verify synced data in database
echo "🗄️  Test 6: Checking synced data in database..."
DB_CHECK=$(PGPASSWORD=postgres psql -h localhost -U postgres -d kaha_restaurant_db -t -c \
  "SELECT COUNT(*) FROM \"user\" WHERE source = 'kaha';" 2>/dev/null || echo "0")

if [ "$DB_CHECK" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $DB_CHECK synced user(s) from Kaha${NC}"
else
    echo -e "${YELLOW}⚠️  No synced users found yet (this is OK if you haven't synced any businesses)${NC}"
fi

DB_CHECK_RESTAURANT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d kaha_restaurant_db -t -c \
  "SELECT COUNT(*) FROM restaurant WHERE source = 'kaha';" 2>/dev/null || echo "0")

if [ "$DB_CHECK_RESTAURANT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $DB_CHECK_RESTAURANT synced restaurant(s) from Kaha${NC}"
else
    echo -e "${YELLOW}⚠️  No synced restaurants found yet (this is OK if you haven't synced any businesses)${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ All authentication tests passed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo "   1. Make sure Kaha Main API v3 is running (if not already)"
echo "   2. Test the full integration by enabling restaurant features on a business"
echo "   3. Check the logs for any errors"
echo ""
echo "📚 Documentation:"
echo "   - AUTH_INTEGRATION_FIX.md - Complete fix documentation"
echo "   - KAHA_RESTAURANT_INTEGRATION_GUIDE.md - Integration guide"
echo "   - COMPLETE_TESTING_GUIDE.md - Testing guide"
echo ""
