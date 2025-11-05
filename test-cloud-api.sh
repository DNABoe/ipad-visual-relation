#!/bin/bash

# Test script for RelEye Cloud API
# Usage: ./test-cloud-api.sh [API_URL]

API_URL="${1:-https://releye.boestad.com/api}"

echo "Testing RelEye Cloud API at: $API_URL"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "GET $API_URL/health"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/health")
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_CODE")

if [ "$http_code" = "200" ]; then
  echo "✓ Health check passed"
  echo "Response: $body"
else
  echo "✗ Health check failed (HTTP $http_code)"
  echo "Response: $body"
fi
echo ""

# Test 2: First Time Setup Check
echo "Test 2: First Time Setup Check"
echo "GET $API_URL/auth/first-time"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/auth/first-time")
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_CODE")

if [ "$http_code" = "200" ]; then
  echo "✓ First time check passed"
  echo "Response: $body"
else
  echo "✗ First time check failed (HTTP $http_code)"
  echo "Response: $body"
fi
echo ""

# Test 3: Get All Users (should be empty or return users)
echo "Test 3: Get All Users"
echo "GET $API_URL/users"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/users")
http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_CODE")

if [ "$http_code" = "200" ]; then
  echo "✓ Get users passed"
  echo "Response: $body"
else
  echo "✗ Get users failed (HTTP $http_code)"
  echo "Response: $body"
fi
echo ""

# Test 4: CORS Check
echo "Test 4: CORS Check"
echo "OPTIONS $API_URL/health"
cors_headers=$(curl -s -I -X OPTIONS \
  -H "Origin: https://releye.boestad.com" \
  -H "Access-Control-Request-Method: GET" \
  "$API_URL/health" | grep -i "access-control")

if [ -n "$cors_headers" ]; then
  echo "✓ CORS headers present"
  echo "$cors_headers"
else
  echo "✗ CORS headers missing"
fi
echo ""

echo "=========================================="
echo "Test complete!"
echo ""
echo "If all tests passed, your API is ready."
echo "If any tests failed, check:"
echo "  1. API server is running (pm2 status)"
echo "  2. Nginx configuration is correct"
echo "  3. Database connection is working"
echo "  4. SSL certificate is valid"
