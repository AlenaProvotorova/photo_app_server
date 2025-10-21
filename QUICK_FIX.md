# 🚀 БЫСТРОЕ ИСПРАВЛЕНИЕ Railway Деплоя

## ❌ Проблема
```
Attempt #X failed with service unavailable. Continuing to retry for XmXs
1/1 replicas never became healthy!
Healthcheck failed!
```

## ✅ РЕШЕНИЕ (5 минут)

### 1. Проверьте переменные окружения в Railway Dashboard
Перейдите в ваш проект → Variables и убедитесь, что установлены:

```bash
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key  
CLOUDINARY_API_SECRET=your-api-secret
```

**⚠️ КРИТИЧНО:** `JWT_SECRET` должен быть установлен! Без него приложение не запустится.

### 2. Убедитесь, что PostgreSQL подключен
- В Railway Dashboard добавьте PostgreSQL сервис если его нет
- Railway автоматически установит `DATABASE_URL`

### 3. Перезапустите деплой
- Нажмите "Redeploy" в Railway Dashboard
- Или сделайте новый commit: `git commit --allow-empty -m "redeploy" && git push`

### 4. Проверьте логи
- Откройте последний деплой → Logs
- Ищите ошибки типа "JWT_SECRET not found" или "Database connection failed"

## 🔧 Что уже исправлено в коде:

✅ **railway.json** - увеличен timeout до 600 секунд  
✅ **main.ts** - health check endpoint работает корректно  
✅ **Сборка** - TypeScript компилируется без ошибок  
✅ **CORS** - настроен для Railway доменов  

## 📊 Проверка после деплоя:

1. Откройте: `https://your-app.up.railway.app/api/health`
2. Должен вернуться JSON с `"status": "OK"`
3. Если не работает - проверьте логи в Railway Dashboard

## 🆘 Если не помогает:

1. **Проверьте все переменные** - особенно `JWT_SECRET`
2. **Убедитесь в PostgreSQL** - сервис должен быть запущен
3. **Увеличьте ресурсы** - в Railway Dashboard если доступно
4. **Проверьте логи** - там будет точная ошибка

---

**Время исправления: 5-10 минут** ⏱️
