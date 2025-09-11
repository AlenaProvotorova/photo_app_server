# 🚂 Настройка Railway для NestJS приложения

## 🚨 Проблема
Railway возвращает 502 ошибку - приложение не отвечает. Это происходит из-за неправильной конфигурации.

## ✅ Решение

### 1. **Созданы файлы конфигурации Railway**

#### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### `Procfile`
```
web: npm run start:prod
```

### 2. **Обновлен main.ts для Railway**

#### Изменения в main.ts:
- ✅ Добавлена поддержка `0.0.0.0` host для Railway
- ✅ Добавлены Railway environment variables в CORS
- ✅ Улучшено логирование для отладки

```typescript
const port = process.env.PORT ?? 3000;
const host = process.env.RAILWAY_STATIC_URL ? '0.0.0.0' : 'localhost';

// Railway URLs в CORS
const allowedOrigins = [
  // ... существующие origins
  process.env.RAILWAY_STATIC_URL,
  process.env.RAILWAY_PUBLIC_DOMAIN,
].filter(Boolean);
```

### 3. **Переменные окружения для Railway**

#### Обязательные переменные:
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@host:port/database
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret_key
```

#### Railway автоматические переменные:
- `RAILWAY_STATIC_URL` - URL вашего приложения
- `RAILWAY_PUBLIC_DOMAIN` - Домен вашего приложения

## 🚀 Инструкции по деплою

### 1. **Установка Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

### 2. **Настройка переменных окружения**
В Railway Dashboard:
1. Перейдите в ваш проект
2. Выберите сервис
3. Перейдите в Variables
4. Добавьте все переменные из `railway.env.example`

### 3. **Деплой**
```bash
# Автоматический деплой
./deploy-railway.sh

# Или вручную
npm run build
railway up
```

### 4. **Проверка деплоя**
```bash
# Проверка health check
curl https://photoappserver-production.up.railway.app/api/health

# Проверка CORS
curl -X OPTIONS \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  https://photoappserver-production.up.railway.app/api/health
```

## 🔧 Troubleshooting

### 1. **502 Bad Gateway**
- ✅ Проверьте, что `startCommand` правильный: `npm run start:prod`
- ✅ Убедитесь, что порт настроен: `PORT=3000`
- ✅ Проверьте логи в Railway Dashboard

### 2. **CORS ошибки**
- ✅ Убедитесь, что Railway URL добавлен в `allowedOrigins`
- ✅ Проверьте переменные `RAILWAY_STATIC_URL` и `RAILWAY_PUBLIC_DOMAIN`

### 3. **База данных не подключается**
- ✅ Проверьте `DATABASE_URL` в переменных окружения
- ✅ Убедитесь, что PostgreSQL сервис запущен

### 4. **Cloudinary ошибки**
- ✅ Проверьте все Cloudinary переменные
- ✅ Убедитесь, что API ключи правильные

## 📊 Мониторинг

### 1. **Логи Railway**
```bash
railway logs
```

### 2. **Health Check**
```bash
curl https://photoappserver-production.up.railway.app/api/health
```

### 3. **CORS тест**
```bash
./test-cors.sh https://photoappserver-production.up.railway.app
```

## 🎯 Следующие шаги

1. ✅ Конфигурация Railway создана
2. ✅ main.ts обновлен для Railway
3. ✅ Скрипты деплоя готовы
4. 🔄 Настроить переменные окружения в Railway
5. 🔄 Задеплоить приложение
6. 🔄 Протестировать CORS на production

## 📝 Файлы для Railway

- ✅ `railway.json` - Конфигурация Railway
- ✅ `Procfile` - Команда запуска
- ✅ `railway.env.example` - Пример переменных окружения
- ✅ `deploy-railway.sh` - Скрипт деплоя
- ✅ `RAILWAY_SETUP.md` - Документация

---

**Статус**: ✅ **ГОТОВО** - Конфигурация Railway создана, готово к деплою!

