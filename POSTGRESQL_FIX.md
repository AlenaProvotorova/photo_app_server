# 🗄️ ИСПРАВЛЕНИЕ: Ошибка подключения к PostgreSQL на Railway

## ❌ Проблема
```
[Nest] ERROR [TypeOrmModule] Unable to connect to the database. Retrying (1)...
Error: connect ETIMEDOUT fd12:aef4:d5b5:0:1000:27:2d7d:1e9c:5432
```

## 🔍 Причина
Ошибка `ETIMEDOUT` указывает на проблемы с сетевым подключением к PostgreSQL базе данных на Railway.

## ✅ РЕШЕНИЕ

### 1. Проверьте PostgreSQL сервис в Railway Dashboard

#### Шаг 1: Добавьте PostgreSQL сервис
1. Откройте ваш проект в Railway Dashboard
2. Нажмите **"+ New"** → **"Database"** → **"PostgreSQL"**
3. Дождитесь полного запуска сервиса (статус "Deployed")

#### Шаг 2: Проверьте переменные окружения
1. Перейдите в **"Variables"** в вашем проекте
2. Убедитесь, что автоматически создана переменная `DATABASE_URL`
3. Она должна выглядеть примерно так:
   ```
   postgresql://postgres:password@host:port/database
   ```

### 2. Обновите конфигурацию приложения

#### ✅ Что уже исправлено в коде:
- **app.module.ts** - добавлены настройки timeout и retry для Railway
- **main.ts** - улучшен health check endpoint
- **railway.json** - увеличен timeout для health check

### 3. Перезапустите деплой

#### Вариант 1: Через Railway Dashboard
1. Нажмите **"Redeploy"** в вашем проекте
2. Дождитесь завершения деплоя

#### Вариант 2: Через Git
```bash
git add .
git commit -m "fix: improve PostgreSQL connection settings for Railway"
git push
```

### 4. Проверьте результат

#### Проверка health check:
```bash
curl https://your-app.up.railway.app/api/health
```

Должен вернуться:
```json
{
  "status": "OK",
  "timestamp": "2025-10-21T18:32:42.000Z",
  "environment": "production",
  "port": 3000,
  "uptime": 123.456,
  "memory": {...},
  "database": "configured",
  "version": "1.0.0"
}
```

## 🔧 Дополнительные настройки

### Если проблема остается:

#### 1. Проверьте логи PostgreSQL
1. В Railway Dashboard откройте PostgreSQL сервис
2. Перейдите в **"Logs"**
3. Ищите ошибки подключения

#### 2. Увеличьте ресурсы
1. В Railway Dashboard откройте PostgreSQL сервис
2. Увеличьте RAM/CPU если доступно
3. Перезапустите сервис

#### 3. Проверьте сетевые настройки
1. Убедитесь, что PostgreSQL и приложение в одном проекте
2. Проверьте, что нет блокировки портов

### 4. Альтернативное решение (временное)

Если PostgreSQL все еще не работает, можно временно отключить синхронизацию схемы:

```typescript
// В app.module.ts временно установите:
synchronize: false,
```

## 📊 Мониторинг

### Проверка статуса:
1. **Railway Dashboard** → ваш проект → **"Deployments"**
2. **PostgreSQL сервис** → **"Logs"**
3. **Health check**: `https://your-app.up.railway.app/api/health`

### Типичные ошибки и решения:

| Ошибка | Решение |
|--------|---------|
| `ETIMEDOUT` | PostgreSQL сервис не запущен |
| `ECONNREFUSED` | Неправильный DATABASE_URL |
| `SSL error` | Проблемы с SSL сертификатами |
| `Authentication failed` | Неправильные учетные данные |

## 🚀 Быстрая проверка

### 1. Убедитесь, что PostgreSQL запущен:
- В Railway Dashboard статус должен быть "Deployed"

### 2. Проверьте DATABASE_URL:
- Должна быть автоматически создана Railway
- Формат: `postgresql://user:pass@host:port/db`

### 3. Перезапустите деплой:
- Нажмите "Redeploy" в Railway Dashboard

### 4. Проверьте health check:
- `https://your-app.up.railway.app/api/health`

---

## ⚡ БЫСТРОЕ РЕШЕНИЕ (3 минуты):

1. **Добавьте PostgreSQL сервис** в Railway Dashboard
2. **Дождитесь запуска** (статус "Deployed")
3. **Перезапустите деплой** приложения
4. **Проверьте**: `https://your-app.up.railway.app/api/health`

**Время исправления: 3-5 минут** ⏱️
