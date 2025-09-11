#!/bin/bash

# Скрипт для тестирования CORS на сервере
# Использование: ./test-cors.sh [base_url]

BASE_URL=${1:-"http://localhost:3000"}
echo "🧪 Тестирование CORS для $BASE_URL"
echo "=================================="

# Функция для тестирования CORS
test_cors() {
    local endpoint=$1
    local method=$2
    local origin=$3
    local headers=$4
    local data=$5
    
    echo ""
    echo "🔍 Тестирование: $method $endpoint"
    echo "Origin: $origin"
    
    # Preflight запрос
    echo "📤 Preflight запрос..."
    curl -s -X OPTIONS \
        -H "Origin: $origin" \
        -H "Access-Control-Request-Method: $method" \
        -H "Access-Control-Request-Headers: $headers" \
        -v "$BASE_URL$endpoint" 2>&1 | grep -E "(Access-Control|HTTP/1.1)"
    
    echo ""
    echo "📤 Основной запрос..."
    if [ -n "$data" ]; then
        curl -s -X $method \
            -H "Origin: $origin" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer test-token" \
            -d "$data" \
            "$BASE_URL$endpoint"
    else
        curl -s -X $method \
            -H "Origin: $origin" \
            -H "Authorization: Bearer test-token" \
            "$BASE_URL$endpoint"
    fi
    
    echo ""
    echo "----------------------------------"
}

# Тестируем разные origins
ORIGINS=(
    "http://localhost:3001"
    "http://localhost:5173"
    "http://127.0.0.1:3001"
    "https://stalwart-mooncake-ddf369.netlify.app"
)

# Тестируем разные endpoints
ENDPOINTS=(
    "/api/health"
    "/api/auth/login"
    "/api/folders"
    "/api/files"
    "/api/sizes"
)

echo "🚀 Начинаем тестирование CORS..."
echo ""

# Тестируем health endpoint
for origin in "${ORIGINS[@]}"; do
    test_cors "/api/health" "GET" "$origin" "Content-Type,Authorization"
done

# Тестируем auth endpoint
for origin in "${ORIGINS[@]}"; do
    test_cors "/api/auth/login" "POST" "$origin" "Content-Type,Authorization" '{"email":"test@test.com","password":"test"}'
done

# Тестируем protected endpoints
for origin in "${ORIGINS[@]}"; do
    test_cors "/api/folders" "GET" "$origin" "Content-Type,Authorization"
done

echo ""
echo "✅ Тестирование завершено!"
echo ""
echo "📋 Результаты:"
echo "- CORS заголовки должны присутствовать во всех ответах"
echo "- Access-Control-Allow-Origin должен соответствовать Origin"
echo "- Access-Control-Allow-Credentials должен быть true"
echo "- Access-Control-Allow-Methods должен содержать нужные методы"
echo "- Access-Control-Allow-Headers должен содержать нужные заголовки"
