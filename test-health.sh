#!/bin/bash

echo "🔍 Тестирование health check..."

# Тест 1: Локальный health check
echo "1. Тестируем локальный health check..."
curl -s http://localhost:3000/api/health | jq . || echo "❌ Локальный health check не работает"

echo ""
echo "2. Тестируем Railway health check (если доступен)..."
curl -s https://photoappserver-production.up.railway.app/api/health | jq . || echo "❌ Railway health check не работает"

echo ""
echo "3. Проверяем статус ответа..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check работает корректно"
else
    echo "❌ Health check возвращает ошибку: $HTTP_STATUS"
fi
