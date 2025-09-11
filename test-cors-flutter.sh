#!/bin/bash

# CORS Test Script for Flutter Web App
echo "🧪 Testing CORS configuration for Flutter Web App"
echo "=================================================="

# Server URL (change this to your production URL)
SERVER_URL="https://photoappserver-production.up.railway.app"
LOCAL_SERVER_URL="http://localhost:3000"

# Test function
test_cors() {
    local url=$1
    local origin=$2
    local description=$3
    
    echo ""
    echo "🔍 Testing: $description"
    echo "   URL: $url"
    echo "   Origin: $origin"
    
    # Test preflight request
    echo "   📡 Preflight request (OPTIONS)..."
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X OPTIONS \
        -H "Origin: $origin" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type,Authorization" \
        "$url/api/health")
    
    if [ "$response" = "200" ] || [ "$response" = "204" ]; then
        echo "   ✅ Preflight: OK ($response)"
    else
        echo "   ❌ Preflight: FAILED ($response)"
    fi
    
    # Test actual request
    echo "   📡 Actual request (GET)..."
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Origin: $origin" \
        -H "Content-Type: application/json" \
        "$url/api/health")
    
    if [ "$response" = "200" ]; then
        echo "   ✅ Request: OK ($response)"
    else
        echo "   ❌ Request: FAILED ($response)"
    fi
    
    # Get CORS headers
    echo "   📋 CORS Headers:"
    curl -s -I \
        -H "Origin: $origin" \
        "$url/api/health" | grep -i "access-control" || echo "   No CORS headers found"
}

# Test different Flutter web origins
echo "Testing Flutter Web Origins..."
test_cors "$LOCAL_SERVER_URL" "http://localhost:8080" "Local Flutter Web (8080)"
test_cors "$LOCAL_SERVER_URL" "http://localhost:8081" "Local Flutter Web (8081)"
test_cors "$LOCAL_SERVER_URL" "http://127.0.0.1:8080" "Local Flutter Web (127.0.0.1:8080)"
test_cors "$LOCAL_SERVER_URL" "http://127.0.0.1:8081" "Local Flutter Web (127.0.0.1:8081)"

echo ""
echo "Testing Production Server..."
test_cors "$SERVER_URL" "http://localhost:8080" "Production - Flutter Web (8080)"
test_cors "$SERVER_URL" "http://localhost:8081" "Production - Flutter Web (8081)"
test_cors "$SERVER_URL" "http://127.0.0.1:8080" "Production - Flutter Web (127.0.0.1:8080)"
test_cors "$SERVER_URL" "http://127.0.0.1:8081" "Production - Flutter Web (127.0.0.1:8081)"

echo ""
echo "🎯 Summary:"
echo "If all tests show ✅, your CORS is properly configured!"
echo "If any test shows ❌, check your server CORS configuration."
echo ""
echo "💡 To test with your actual Flutter app:"
echo "1. Run: flutter run -d web-server --web-port=8080"
echo "2. Open: http://localhost:8080"
echo "3. Check browser console for CORS errors"
