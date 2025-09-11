# 🌐 CORS Настройка для Flutter и Web приложений

## ✅ Проблемы решены

### 1. **CORS заголовки настроены правильно**
- ✅ `Access-Control-Allow-Origin` - динамически устанавливается на основе Origin
- ✅ `Access-Control-Allow-Credentials: true` - для работы с cookies и авторизацией
- ✅ `Access-Control-Allow-Methods` - все необходимые HTTP методы
- ✅ `Access-Control-Allow-Headers` - все необходимые заголовки
- ✅ `Access-Control-Expose-Headers` - заголовки доступные клиенту

### 2. **Поддержка разных окружений**
- ✅ **Development**: Разрешены все localhost и 127.0.0.1
- ✅ **Production**: Только разрешенные домены
- ✅ **Mobile apps**: Запросы без Origin разрешены

### 3. **Поддерживаемые Origins**
```javascript
const allowedOrigins = [
  'http://localhost:3000',      // Основной сервер
  'http://localhost:3001',      // React/Vue dev server
  'http://localhost:5173',      // Vite dev server
  'http://localhost:8080',      // Альтернативный порт
  'http://127.0.0.1:3000',      // IPv4 localhost
  'http://127.0.0.1:3001',      // IPv4 localhost
  'http://127.0.0.1:5173',      // IPv4 localhost
  'http://127.0.0.1:8080',      // IPv4 localhost
  'https://stalwart-mooncake-ddf369.netlify.app', // Netlify
  'https://photoappserver-production.up.railway.app', // Railway
];
```

## 🚀 Как использовать

### 1. **Запуск сервера**
```bash
cd /path/to/server
npm run start:dev
```

### 2. **Тестирование CORS**
```bash
# Запустить тест CORS
./test-cors.sh

# Тестировать конкретный URL
./test-cors.sh https://your-production-url.com
```

### 3. **Health Check**
```bash
curl http://localhost:3000/api/health
```

## 📱 Поддержка Flutter

### 1. **Dio Configuration**
```dart
final dio = Dio();
dio.options.baseUrl = 'http://localhost:3000/api';
dio.options.headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
```

### 2. **CORS Headers для Flutter**
- ✅ `Content-Type: application/json`
- ✅ `Authorization: Bearer <token>`
- ✅ `Accept: application/json`
- ✅ `X-API-Key` (если нужен)
- ✅ `X-Client-Version` (если нужен)

## 🔧 Настройка для продакшна

### 1. **Добавить ваш домен**
Отредактируйте `src/main.ts`:
```javascript
const allowedOrigins = [
  // ... существующие origins
  'https://your-flutter-app.com',     // Ваш Flutter web app
  'https://your-react-app.com',       // Ваш React app
  'https://your-vue-app.com',         // Ваш Vue app
];
```

### 2. **Environment Variables**
```bash
# .env
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🧪 Тестирование

### 1. **Автоматическое тестирование**
```bash
./test-cors.sh
```

### 2. **Ручное тестирование**
```bash
# Preflight запрос
curl -X OPTIONS \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  http://localhost:3000/api/auth/login

# Основной запрос
curl -X POST \
  -H "Origin: http://localhost:3001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"email":"test@test.com","password":"test"}' \
  http://localhost:3000/api/auth/login
```

## 📊 Результаты тестирования

### ✅ **Все тесты пройдены**
- ✅ Preflight запросы (OPTIONS) работают
- ✅ Основные запросы (GET, POST, PUT, DELETE) работают
- ✅ CORS заголовки присутствуют во всех ответах
- ✅ Origin правильно устанавливается
- ✅ Credentials поддерживаются
- ✅ Все необходимые методы разрешены
- ✅ Все необходимые заголовки разрешены

### 🔍 **Проверенные Origins**
- ✅ `http://localhost:3001` - React/Vue dev server
- ✅ `http://localhost:5173` - Vite dev server
- ✅ `http://127.0.0.1:3001` - IPv4 localhost
- ✅ `https://stalwart-mooncake-ddf369.netlify.app` - Netlify

### 🔍 **Проверенные Endpoints**
- ✅ `/api/health` - Health check
- ✅ `/api/auth/login` - Authentication
- ✅ `/api/folders` - Folders (protected)
- ✅ `/api/files` - Files (protected)
- ✅ `/api/sizes` - Sizes (protected)

## 🚨 Troubleshooting

### 1. **CORS ошибка в браузере**
- Проверьте, что Origin добавлен в `allowedOrigins`
- Убедитесь, что сервер запущен
- Проверьте логи сервера

### 2. **401 Unauthorized**
- Это нормально для protected endpoints без валидного токена
- CORS работает правильно, проблема в авторизации

### 3. **Flutter CORS ошибки**
- Убедитесь, что используете правильный baseUrl
- Проверьте, что добавляете правильные заголовки
- Для Flutter web используйте `--web-renderer html`

## 📝 Логи

Сервер логирует все CORS запросы:
```
[CORS] GET /api/health from http://localhost:3001
[CORS] POST /api/auth/login from http://localhost:3001
[CORS] OPTIONS /api/folders from http://localhost:3001
```

## 🎯 Следующие шаги

1. ✅ CORS настроен и протестирован
2. ✅ Сервер готов для Flutter приложения
3. ✅ Поддержка всех необходимых origins
4. ✅ Автоматическое тестирование готово
5. 🔄 Добавить ваш production домен
6. 🔄 Настроить SSL для production
7. 🔄 Добавить rate limiting
8. 🔄 Настроить мониторинг

---

**Статус**: ✅ **ГОТОВО** - CORS полностью настроен и протестирован!
