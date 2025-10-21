#!/bin/bash

# Скрипт для проверки конфигурации перед деплоем на Railway
echo "🔍 Проверка конфигурации для Railway деплоя..."

# Проверка переменных окружения
echo "📋 Проверка переменных окружения:"

required_vars=("NODE_ENV" "JWT_SECRET" "CLOUDINARY_CLOUD_NAME" "CLOUDINARY_API_KEY" "CLOUDINARY_API_SECRET")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var не установлена"
    else
        echo "✅ $var установлена"
    fi
done

# Проверка DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL не установлена (Railway установит автоматически)"
else
    echo "✅ DATABASE_URL установлена"
fi

echo ""
echo "🔧 Проверка сборки..."

# Проверка TypeScript компиляции
if npm run build; then
    echo "✅ Сборка успешна"
else
    echo "❌ Ошибка сборки"
    exit 1
fi

echo ""
echo "🌐 Проверка health check..."

# Запуск приложения в фоне для тестирования
npm run start:prod &
APP_PID=$!

# Ждем запуска приложения
sleep 10

# Проверка health check
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Health check работает"
else
    echo "❌ Health check не работает"
fi

# Остановка приложения
kill $APP_PID 2>/dev/null

echo ""
echo "📊 Рекомендации для Railway:"
echo "1. Убедитесь, что все переменные окружения установлены в Railway Dashboard"
echo "2. Добавьте PostgreSQL сервис если его нет"
echo "3. Проверьте логи деплоя в Railway Dashboard"
echo "4. Используйте обновленный railway.json с увеличенным timeout"

echo ""
echo "🚀 Готово к деплою!"
