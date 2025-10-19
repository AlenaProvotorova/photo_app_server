# Руководство по интеграции массовой загрузки файлов на фронтенде

## Обзор изменений

Бэкенд был оптимизирован для поддержки массовой загрузки до 200 файлов одновременно. Добавлен новый эндпоинт `/files/batch` для пакетной загрузки файлов.

## Новые эндпоинты

### 1. Массовая загрузка файлов
- **URL**: `POST /files/batch`
- **Параметры**: 
  - `files`: массив файлов (до 200 файлов)
  - `folderId`: ID папки (query parameter)
- **Ограничения**:
  - Максимум 200 файлов за один запрос
  - Максимум 5MB на файл
  - Общий размер запроса не должен превышать 1GB

### 2. Одиночная загрузка (существующий)
- **URL**: `POST /files`
- **Параметры**: 
  - `file`: один файл
  - `folderId`: ID папки (query parameter)

## Рекомендации для фронтенда

### 1. Разделение на пакеты

Для загрузки более 200 файлов рекомендуется разделить их на пакеты:

```javascript
const MAX_FILES_PER_BATCH = 200;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function splitFilesIntoBatches(files) {
  const batches = [];
  for (let i = 0; i < files.length; i += MAX_FILES_PER_BATCH) {
    batches.push(files.slice(i, i + MAX_FILES_PER_BATCH));
  }
  return batches;
}
```

### 2. Валидация файлов

```javascript
function validateFiles(files) {
  const errors = [];
  
  if (files.length > 1000) {
    errors.push('Максимум 1000 файлов за раз');
  }
  
  files.forEach((file, index) => {
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`Файл ${file.name} превышает лимит 5MB`);
    }
    
    if (file.size === 0) {
      errors.push(`Файл ${file.name} пустой`);
    }
  });
  
  return errors;
}
```

### 3. Сжатие изображений (рекомендуется)

```javascript
// Установка: npm install compressorjs
import Compressor from 'compressorjs';

function compressImage(file, quality = 0.8) {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: quality,
      maxWidth: 1920,
      maxHeight: 1080,
      success: resolve,
      error: reject,
    });
  });
}

async function compressImages(files) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const compressedFiles = [];
  
  for (const file of files) {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (imageExtensions.includes(extension)) {
      try {
        const compressed = await compressImage(file);
        compressedFiles.push(compressed);
      } catch (error) {
        console.warn(`Не удалось сжать ${file.name}:`, error);
        compressedFiles.push(file);
      }
    } else {
      compressedFiles.push(file);
    }
  }
  
  return compressedFiles;
}
```

### 4. Загрузка с прогресс-баром

```javascript
class FileUploader {
  constructor(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
  }
  
  async uploadBatch(files, folderId, onProgress) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    return fetch(`${this.apiBaseUrl}/files/batch?folderId=${folderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: formData,
    });
  }
  
  async uploadMultipleFiles(files, folderId, onProgress) {
    const errors = validateFiles(files);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    // Сжимаем изображения
    const compressedFiles = await compressImages(files);
    
    // Разделяем на пакеты
    const batches = splitFilesIntoBatches(compressedFiles);
    const results = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const progress = {
        currentBatch: i + 1,
        totalBatches: batches.length,
        currentBatchFiles: batch.length,
        uploadedFiles: results.length,
        totalFiles: files.length
      };
      
      onProgress(progress);
      
      try {
        const response = await this.uploadBatch(batch, folderId, onProgress);
        const data = await response.json();
        
        if (data.success) {
          results.push(...data.files);
        } else {
          throw new Error(`Ошибка загрузки пакета ${i + 1}`);
        }
      } catch (error) {
        console.error(`Ошибка загрузки пакета ${i + 1}:`, error);
        throw error;
      }
    }
    
    return results;
  }
}
```

### 5. React компонент (пример)

```jsx
import React, { useState, useRef } from 'react';
import { FileUploader } from './FileUploader';

function MultiFileUpload({ folderId, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const fileInputRef = useRef(null);
  
  const uploader = new FileUploader(process.env.REACT_APP_API_URL, localStorage.getItem('token'));
  
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
  };
  
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setProgress({ currentBatch: 0, totalBatches: 0, uploadedFiles: 0, totalFiles: files.length });
    
    try {
      const results = await uploader.uploadMultipleFiles(files, folderId, setProgress);
      onUploadComplete(results);
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      alert(`Ошибка загрузки: ${error.message}`);
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };
  
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        disabled={uploading}
      />
      
      {files.length > 0 && (
        <div>
          <p>Выбрано файлов: {files.length}</p>
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </div>
      )}
      
      {progress && (
        <div>
          <p>Пакет {progress.currentBatch} из {progress.totalBatches}</p>
          <p>Загружено {progress.uploadedFiles} из {progress.totalFiles} файлов</p>
          <div style={{ width: '100%', backgroundColor: '#f0f0f0' }}>
            <div 
              style={{ 
                width: `${(progress.uploadedFiles / progress.totalFiles) * 100}%`, 
                height: '20px', 
                backgroundColor: '#4CAF50' 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

### 6. Flutter пример (Dart)

```dart
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;

class FileUploadService {
  final String apiBaseUrl;
  final String authToken;
  
  FileUploadService(this.apiBaseUrl, this.authToken);
  
  Future<List<Map<String, dynamic>>> uploadFiles(
    List<File> files, 
    String folderId,
    Function(UploadProgress) onProgress,
  ) async {
    const maxFilesPerBatch = 200;
    final batches = _splitIntoBatches(files, maxFilesPerBatch);
    final results = <Map<String, dynamic>>[];
    
    for (int i = 0; i < batches.length; i++) {
      final batch = batches[i];
      onProgress(UploadProgress(
        currentBatch: i + 1,
        totalBatches: batches.length,
        uploadedFiles: results.length,
        totalFiles: files.length,
      ));
      
      try {
        final batchResults = await _uploadBatch(batch, folderId);
        results.addAll(batchResults);
      } catch (e) {
        throw Exception('Ошибка загрузки пакета ${i + 1}: $e');
      }
    }
    
    return results;
  }
  
  Future<List<Map<String, dynamic>>> _uploadBatch(
    List<File> files, 
    String folderId,
  ) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$apiBaseUrl/files/batch?folderId=$folderId'),
    );
    
    request.headers['Authorization'] = 'Bearer $authToken';
    
    for (final file in files) {
      request.files.add(await http.MultipartFile.fromPath('files', file.path));
    }
    
    final response = await request.send();
    final responseBody = await response.stream.bytesToString();
    
    if (response.statusCode == 200) {
      final data = json.decode(responseBody);
      return List<Map<String, dynamic>>.from(data['files']);
    } else {
      throw Exception('Ошибка загрузки: ${response.statusCode}');
    }
  }
  
  List<List<File>> _splitIntoBatches(List<File> files, int batchSize) {
    final batches = <List<File>>[];
    for (int i = 0; i < files.length; i += batchSize) {
      batches.add(files.sublist(i, i + batchSize));
    }
    return batches;
  }
}

class UploadProgress {
  final int currentBatch;
  final int totalBatches;
  final int uploadedFiles;
  final int totalFiles;
  
  UploadProgress({
    required this.currentBatch,
    required this.totalBatches,
    required this.uploadedFiles,
    required this.totalFiles,
  });
}
```

## Обработка ошибок

### Типичные ошибки и их решения

1. **413 Payload Too Large**
   - Уменьшите размер пакета или сожмите файлы
   - Проверьте настройки сервера (nginx, apache)

2. **429 Too Many Requests**
   - Добавьте задержку между пакетами
   - Реализуйте retry логику

3. **Timeout ошибки**
   - Увеличьте timeout на клиенте
   - Уменьшите размер пакета

### Retry логика

```javascript
async function uploadWithRetry(uploader, files, folderId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploader.uploadMultipleFiles(files, folderId);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Экспоненциальная задержка
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Мониторинг и аналитика

### Рекомендуемые метрики

1. **Скорость загрузки** - файлов в секунду
2. **Процент успешных загрузок**
3. **Время обработки пакетов**
4. **Размер загружаемых файлов**

### Логирование

```javascript
function logUploadMetrics(results, startTime, endTime) {
  const duration = endTime - startTime;
  const filesPerSecond = results.length / (duration / 1000);
  
  console.log({
    uploadedFiles: results.length,
    duration: duration,
    filesPerSecond: filesPerSecond,
    averageFileSize: results.reduce((sum, file) => sum + file.size, 0) / results.length
  });
}
```

## Заключение

Эти изменения позволяют эффективно загружать до 200 файлов за один запрос с оптимизированной обработкой на сервере. Для больших объемов файлов рекомендуется использовать пакетную загрузку с прогресс-индикатором и обработкой ошибок.
