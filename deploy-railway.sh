#!/bin/bash

# Скрипт для деплоя на Railway
echo "🚀 Деплой на Railway..."

# Проверяем, что Railway CLI установлен
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI не установлен. Установите его:"
    echo "npm install -g @railway/cli"
    echo "railway login"
    exit 1
fi

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ package.json не найден. Запустите скрипт из корня проекта."
    exit 1
fi

echo "📦 Сборка проекта..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки проекта"
    exit 1
fi

echo "✅ Проект собран успешно"

echo "🚀 Деплой на Railway..."
railway up

if [ $? -eq 0 ]; then
    echo "✅ Деплой завершен успешно!"
    echo "🌐 Проверьте ваш сервер:"
    echo "curl https://photoappserver-production.up.railway.app/api/health"
else
    echo "❌ Ошибка деплоя"
    exit 1
fi
