# Инструкция по исправлению проблем с деплоем на Railway

## Проблема
При деплое на Railway возникает ошибка:
```
Attempt #X failed with service unavailable. Continuing to retry for XmXs
1/1 replicas never became healthy!
Healthcheck failed!
```

## Анализ текущей конфигурации

### ✅ Что уже настроено правильно:
1. **Health check endpoint** - `/api/health` настроен в `main.ts` (строки 121-131)
2. **Railway конфигурация** - `railway.json` содержит правильные настройки health check
3. **Порт и хост** - приложение слушает на `0.0.0.0:PORT` (строка 140)
4. **База данных** - TypeORM настроен для работы с Railway PostgreSQL
5. **CORS** - настроен для работы с Railway доменами

### 🔍 Возможные причины проблемы:

## 1. Переменные окружения

### Проверьте в Railway Dashboard:
1. Перейдите в ваш проект на Railway
2. Откройте вкладку "Variables"
3. Убедитесь, что установлены все необходимые переменные:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@host:port/database
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret_key
RAILWAY_STATIC_URL=https://your-app.up.railway.app
RAILWAY_PUBLIC_DOMAIN=your-app.up.railway.app
```

### ⚠️ Критически важно:
- `DATABASE_URL` должен быть автоматически предоставлен Railway PostgreSQL
- `JWT_SECRET` должен быть установлен (генерируйте случайную строку)
- `CLOUDINARY_*` переменные должны быть корректными

## 2. База данных

### Проверьте подключение к PostgreSQL:
1. В Railway Dashboard убедитесь, что PostgreSQL сервис запущен
2. Проверьте, что `DATABASE_URL` автоматически установлен Railway
3. Если база данных не подключена, добавьте PostgreSQL сервис в ваш проект

## 3. Health Check настройки

### Текущие настройки в `railway.json`:
```json
{
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "healthcheckInterval": 10,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Возможные улучшения:
1. **Увеличьте timeout** для медленных стартов:
```json
{
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 600,
    "healthcheckInterval": 15,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

## 4. Логи и диагностика

### Для диагностики выполните:
1. В Railway Dashboard откройте вкладку "Deployments"
2. Кликните на последний деплой
3. Откройте вкладку "Logs"
4. Ищите ошибки в логах:

### Типичные ошибки и решения:

#### "Cannot connect to database"
- Проверьте `DATABASE_URL`
- Убедитесь, что PostgreSQL сервис запущен
- Проверьте SSL настройки

#### "Cloudinary configuration error"
- Проверьте все `CLOUDINARY_*` переменные
- Убедитесь, что API ключи корректные

#### "JWT secret not found"
- Установите `JWT_SECRET` переменную

#### "Port already in use"
- Railway автоматически устанавливает `PORT`, не переопределяйте его

## 5. Пошаговое решение

### Шаг 1: Проверьте переменные окружения
```bash
# В Railway Dashboard Variables добавьте/проверьте:
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Шаг 2: Убедитесь в наличии PostgreSQL
1. В Railway Dashboard добавьте PostgreSQL сервис если его нет
2. Railway автоматически установит `DATABASE_URL`

### Шаг 3: Обновите railway.json (опционально)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 600,
    "healthcheckInterval": 15,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

### Шаг 4: Перезапустите деплой
1. В Railway Dashboard нажмите "Redeploy"
2. Или сделайте новый commit и push

### Шаг 5: Мониторинг
1. Следите за логами в реальном времени
2. Проверьте health check: `https://your-app.up.railway.app/api/health`

## 6. Дополнительные проверки

### Локальное тестирование:
```bash
# Установите переменные окружения локально
export NODE_ENV=production
export DATABASE_URL=your-database-url
export JWT_SECRET=your-secret
export CLOUDINARY_CLOUD_NAME=your-name
export CLOUDINARY_API_KEY=your-key
export CLOUDINARY_API_SECRET=your-secret

# Запустите приложение
npm run build
npm run start:prod

# Проверьте health check
curl http://localhost:3000/api/health
```

### Проверка сборки:
```bash
npm run build
# Убедитесь, что нет ошибок компиляции
```

## 7. Если проблема остается

### Альтернативные решения:

1. **Упростите health check** - временно отключите проверку БД:
```typescript
// В main.ts уже есть простой health check без БД
app.use('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});
```

2. **Увеличьте ресурсы** - в Railway Dashboard увеличьте RAM/CPU если доступно

3. **Проверьте зависимости** - убедитесь, что все npm пакеты совместимы

## 8. Контакты для поддержки

Если проблема не решается:
1. Проверьте [Railway Documentation](https://docs.railway.app/)
2. Обратитесь в [Railway Discord](https://discord.gg/railway)
3. Проверьте [Railway Status Page](https://status.railway.app/)

---

## Краткий чек-лист для быстрого исправления:

- [ ] Проверить все переменные окружения в Railway Dashboard
- [ ] Убедиться, что PostgreSQL сервис запущен
- [ ] Проверить логи деплоя на наличие ошибок
- [ ] Убедиться, что `JWT_SECRET` установлен
- [ ] Проверить Cloudinary настройки
- [ ] Перезапустить деплой
- [ ] Проверить health check endpoint: `/api/health`
