#!/bin/bash

# KAHA Restaurant - Automated Swagger/Postman API Tests
# This script runs the complete API test suite against production URLs
# Similar to Jest API integration tests, but for Swagger/Postman specs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get base directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
POSTMAN_DIR="$PROJECT_ROOT/postman"
REPORTS_DIR="$PROJECT_ROOT/test-reports"

# Create reports directory
mkdir -p "$REPORTS_DIR"

# Configuration
COLLECTION="$PROJECT_ROOT/Kaha_Main_V3_Tests.postman_collection.json"
ENVIRONMENT="$POSTMAN_DIR/environment.json"
REPORT_JSON="$REPORTS_DIR/kaha-v3-test-report-$(date +%Y%m%d-%H%M%S).json"
REPORT_HTML="$REPORTS_DIR/kaha-v3-test-report-$(date +%Y%m%d-%H%M%S).html"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  KAHA Restaurant - Swagger/API Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if collection exists
if [ ! -f "$COLLECTION" ]; then
    echo -e "${RED}ERROR: Collection not found at $COLLECTION${NC}"
    exit 1
fi

# Check if environment exists
if [ ! -f "$ENVIRONMENT" ]; then
    echo -e "${RED}ERROR: Environment not found at $ENVIRONMENT${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Test Configuration:${NC}"
echo -e "  Collection: $(basename $COLLECTION)"
echo -e "  Environment: $(basename $ENVIRONMENT)"
echo -e "  Reports: $REPORTS_DIR"
echo ""

# Run tests with Newman
echo -e "${YELLOW}🚀 Running API Tests...${NC}"
echo ""

npx newman run "$COLLECTION" \
    --environment "$ENVIRONMENT" \
    --reporters cli,json,html \
    --reporter-json-export "$REPORT_JSON" \
    --reporter-html-export "$REPORT_HTML" \
    --suppress-exit-code \
    --bail \
    --verbose

# Capture exit code
EXIT_CODE=$?

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Execution Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Parse results from JSON report
if [ -f "$REPORT_JSON" ]; then
    STATS=$(cat "$REPORT_JSON" | grep -o '"stats":{[^}]*}' | head -1)
    PASSED=$(cat "$REPORT_JSON" | grep -o '"assertions":{[^}]*' | grep -o '"passed":[0-9]*' | grep -o '[0-9]*' | head -1)
    FAILED=$(cat "$REPORT_JSON" | grep -o '"assertions":{[^}]*' | grep -o '"failed":[0-9]*' | grep -o '[0-9]*' | head -1)
    
    if [ "$EXIT_CODE" -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
    else
        echo -e "${RED}❌ Some tests failed${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}📊 Test Results Summary:${NC}"
    echo -e "  Assertions Passed: ${GREEN}${PASSED:-0}${NC}"
    echo -e "  Assertions Failed: ${RED}${FAILED:-0}${NC}"
    echo ""
    echo -e "${YELLOW}📄 Reports Generated:${NC}"
    echo -e "  JSON Report: $REPORT_JSON"
    echo -e "  HTML Report: $REPORT_HTML"
    echo ""
fi

# Display next steps
echo -e "${BLUE}📝 Next Steps:${NC}"
echo -e "  1. View JSON Report: cat $REPORT_JSON"
echo -e "  2. Open HTML Report in Browser"
echo -e "  3. For CI/CD integration, see: test:swagger:ci script"
echo ""

exit $EXIT_CODE
