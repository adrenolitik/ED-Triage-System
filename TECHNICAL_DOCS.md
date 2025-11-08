# Техническая документация - Анестезиологический Триаж

## Архитектура приложения

### Общая структура
```
Frontend (Vanilla JS + TailwindCSS)
    ↓ HTTP/REST
Backend API (Hono Framework)
    ↓ SQL
Database (Cloudflare D1 / SQLite)
```

---

## 🗄️ Структура базы данных

### Таблица: `patients`
Хранит основную информацию о пациентах.

```sql
CREATE TABLE patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id TEXT UNIQUE NOT NULL,        -- Уникальный ID пациента
  age INTEGER,                            -- Возраст
  gender TEXT,                            -- 'male', 'female'
  arrival_mode TEXT,                      -- 'walking', 'ambulance', 'icu'
  admission_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  chief_complaint TEXT,                   -- Основная жалоба
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Таблица: `triage_assessments`
Хранит результаты триажных оценок.

```sql
CREATE TABLE triage_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,           -- FK → patients.id
  
  -- Витальные показатели
  respiratory_rate INTEGER,              -- ЧДД (breaths/min)
  spo2 INTEGER,                          -- SpO₂ (%)
  oxygen_supplementation BOOLEAN,        -- Подача O₂
  oxygen_flow INTEGER,                   -- Поток O₂ (L/min)
  heart_rate INTEGER,                    -- ЧСС (bpm)
  systolic_bp INTEGER,                   -- АД систолическое
  diastolic_bp INTEGER,                  -- АД диастолическое
  temperature REAL,                      -- Температура (°C)
  consciousness_level TEXT,              -- 'alert', 'voice', 'pain', 'unresponsive'
  gcs_score INTEGER,                     -- Glasgow Coma Scale (3-15)
  
  -- Клинические признаки
  chest_pain BOOLEAN,
  dyspnea BOOLEAN,
  trauma BOOLEAN,
  bleeding BOOLEAN,
  seizures BOOLEAN,
  altered_mental_status BOOLEAN,
  
  -- Рассчитанные баллы
  news_score INTEGER,                    -- 0-20
  mews_score INTEGER,                    -- 0-14
  qsofa_score INTEGER,                   -- 0-3
  
  -- Результат триажа
  triage_level TEXT,                     -- 'resuscitation', 'emergency', 'urgent', 'semi-urgent', 'non-urgent'
  triage_color TEXT,                     -- 'red', 'orange', 'yellow', 'green', 'blue'
  priority_score INTEGER,                -- 0-100
  
  -- Рекомендации (JSON)
  immediate_actions TEXT,                -- JSON array
  monitoring_plan TEXT,                  -- JSON array
  investigations_needed TEXT,            -- JSON array
  escalation_required BOOLEAN,
  
  -- Метаданные
  assessed_by TEXT,
  assessment_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

### Таблица: `triage_logs`
Аудит-лог всех действий.

```sql
CREATE TABLE triage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  assessment_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  user_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (assessment_id) REFERENCES triage_assessments(id) ON DELETE SET NULL
);
```

---

## 🔬 Медицинские шкалы - Алгоритмы расчёта

### NEWS (National Early Warning Score)

**Диапазон**: 0-20  
**Компоненты**:

| Параметр | 3 балла | 2 балла | 1 балл | 0 баллов | 1 балл | 2 балла | 3 балла |
|----------|---------|---------|--------|----------|--------|---------|---------|
| ЧДД      | ≤8      | -       | 9-11   | 12-20    | -      | 21-24   | ≥25     |
| SpO₂     | ≤91     | 92-93   | 94-95  | ≥96      | -      | -       | -       |
| O₂       | Да: +2  | -       | -      | Нет: 0   | -      | -       | -       |
| ЧСС      | ≤40     | -       | 41-50  | 51-90    | 91-110 | 111-130 | ≥131    |
| АД сист. | ≤90     | 91-100  | 101-110| 111-219  | -      | -       | ≥220    |
| Температура | ≤35.0 | -    | 35.1-36.0 | 36.1-38.0 | 38.1-39.0 | ≥39.1 | -    |
| Сознание | - | - | - | Alert (A) | - | - | V/P/U: +3 |

**Интерпретация**:
- 0-4: Низкий риск
- 5-6: Средний риск → срочная помощь
- ≥7: Высокий риск → экстренная помощь

### MEWS (Modified Early Warning Score)

**Диапазон**: 0-14  
**Компоненты**:

| Параметр | 3 балла | 2 балла | 1 балл | 0 баллов | 1 балл | 2 балла | 3 балла |
|----------|---------|---------|--------|----------|--------|---------|---------|
| ЧДД      | -       | <9      | -      | 9-14     | 15-20  | 21-29   | ≥30     |
| ЧСС      | -       | <40     | 40-50  | 51-100   | 101-110| 111-129 | ≥130    |
| АД сист. | -       | <70     | 70-80  | 81-100   | 101-199| -       | ≥200    |
| Температура | - | <35     | -      | 35-38.4  | -      | ≥38.5   | -       |
| Сознание | U       | P       | V      | A        | -      | -       | -       |

**Интерпретация**:
- 0-2: Низкий риск
- 3-4: Средний риск
- ≥5: Высокий риск

### qSOFA (Quick SOFA)

**Диапазон**: 0-3  
**Критерии** (по 1 баллу за каждый):
1. ЧДД ≥ 22/мин
2. Изменённое сознание (не Alert)
3. АД систолическое ≤ 100 мм рт.ст.

**Интерпретация**:
- 0-1: Низкий риск сепсиса
- ≥2: Высокий риск сепсиса → рассмотреть ОРИТ

---

## 🎯 Логика определения триаж-категории

### Алгоритм принятия решения

```typescript
function determineTriageLevel(scores, vitals, features):
  // 1. Критические критерии (КРАСНАЯ)
  if (
    qSOFA ≥ 2 OR
    NEWS ≥ 7 OR
    сознание == 'unresponsive' OR
    SpO₂ < 85 OR
    АД систолическое < 70 OR
    судороги == true
  ):
    return {
      level: 'resuscitation',
      color: 'red',
      priority: 90+
    }
  
  // 2. Экстренные критерии (ОРАНЖЕВАЯ)
  else if (
    NEWS ≥ 5 OR
    MEWS ≥ 5 OR
    боль_в_груди OR
    кровотечение OR
    SpO₂ < 90 OR
    АД систолическое < 90
  ):
    return {
      level: 'emergency',
      color: 'orange',
      priority: 70+
    }
  
  // 3. Срочные критерии (ЖЁЛТАЯ)
  else if (
    NEWS ≥ 3 OR
    MEWS ≥ 3 OR
    одышка OR
    травма OR
    температура > 38.5 OR
    температура < 36.0
  ):
    return {
      level: 'urgent',
      color: 'yellow',
      priority: 50+
    }
  
  // 4. Полусрочные (ЗЕЛЁНАЯ)
  else if (NEWS > 0 OR MEWS > 0):
    return {
      level: 'semi-urgent',
      color: 'green',
      priority: 30+
    }
  
  // 5. Несрочные (СИНЯЯ)
  else:
    return {
      level: 'non-urgent',
      color: 'blue',
      priority: 10+
    }
```

### Расчёт Priority Score
```typescript
priorityScore = min(100, NEWS * 4 + MEWS * 3 + qSOFA * 10)
```

---

## 🌐 API Endpoints

### POST /api/triage/assess
Создать новую триажную оценку.

**Request Body**:
```json
{
  "patient": {
    "patientId": "string (required)",
    "age": "number",
    "gender": "male|female",
    "arrivalMode": "walking|ambulance|icu",
    "chiefComplaint": "string"
  },
  "vitals": {
    "respiratoryRate": "number (required)",
    "spo2": "number (required)",
    "oxygenSupplementation": "boolean",
    "oxygenFlow": "number",
    "heartRate": "number (required)",
    "systolicBP": "number (required)",
    "diastolicBP": "number",
    "temperature": "number (required)",
    "consciousnessLevel": "alert|voice|pain|unresponsive (required)",
    "gcsScore": "number (3-15)"
  },
  "features": {
    "chestPain": "boolean",
    "dyspnea": "boolean",
    "trauma": "boolean",
    "bleeding": "boolean",
    "seizures": "boolean",
    "alteredMentalStatus": "boolean"
  },
  "assessedBy": "string"
}
```

**Response**:
```json
{
  "success": true,
  "patientId": "P001",
  "assessmentId": 1,
  "scores": {
    "news": 10,
    "mews": 4,
    "qsofa": 2
  },
  "triage": {
    "level": "resuscitation",
    "color": "red",
    "priorityScore": 90,
    "immediateActions": ["..."],
    "monitoringPlan": ["..."],
    "investigationsNeeded": ["..."],
    "escalationRequired": true
  }
}
```

### GET /api/triage/patients
Получить список всех пациентов с последними оценками.

**Query Parameters**:
- `limit` (default: 50) - количество записей
- `offset` (default: 0) - смещение для пагинации

**Response**:
```json
{
  "success": true,
  "patients": [
    {
      "id": 1,
      "patient_id": "P001",
      "age": 65,
      "gender": "male",
      "triage_level": "resuscitation",
      "triage_color": "red",
      "priority_score": 90,
      "news_score": 10,
      "mews_score": 4,
      "qsofa_score": 2,
      "admission_time": "2025-11-08T11:08:37.000Z",
      ...
    }
  ]
}
```

### GET /api/triage/patient/:patientId
Получить детальную информацию о пациенте.

**Response**:
```json
{
  "success": true,
  "patient": {...},
  "assessments": [...],
  "logs": [...]
}
```

### GET /api/triage/stats
Получить статистику.

**Response**:
```json
{
  "success": true,
  "stats": {
    "total_patients": 3,
    "red_patients": 2,
    "orange_patients": 0,
    "yellow_patients": 0,
    "green_patients": 1,
    "blue_patients": 0,
    "avg_news": 6.0,
    "avg_mews": 3.0,
    "avg_priority": 70.0
  }
}
```

---

## 🛠️ Разработка

### Локальный запуск

```bash
# 1. Установка зависимостей
npm install

# 2. Применение миграций БД
npm run db:migrate:local

# 3. Сборка проекта
npm run build

# 4. Запуск через PM2
pm2 start ecosystem.config.cjs

# 5. Проверка
curl http://localhost:3000
```

### Структура проекта

```
webapp/
├── src/
│   ├── index.tsx              # Основное приложение Hono
│   ├── lib/
│   │   └── scoring.ts         # Алгоритмы медицинских шкал
│   └── routes/
│       └── triage.ts          # API endpoints
├── public/
│   └── static/
│       └── app.js             # Frontend приложение
├── migrations/
│   └── 0001_initial_schema.sql # Схема БД
├── dist/                       # Скомпилированные файлы
├── ecosystem.config.cjs        # PM2 конфигурация
├── wrangler.jsonc             # Cloudflare конфигурация
└── package.json
```

### Тестирование

```bash
# Создание тестовой оценки
curl -X POST http://localhost:3000/api/triage/assess \
  -H "Content-Type: application/json" \
  -d '{"patient": {...}, "vitals": {...}, "features": {...}}'

# Получение списка пациентов
curl http://localhost:3000/api/triage/patients

# Получение статистики
curl http://localhost:3000/api/triage/stats
```

---

## 🚀 Деплой на Cloudflare Pages

```bash
# 1. Создать production БД
npx wrangler d1 create webapp-production

# 2. Применить миграции
npm run db:migrate:prod

# 3. Создать проект
npx wrangler pages project create webapp --production-branch main

# 4. Деплой
npm run deploy:prod
```

---

## 📝 Добавление новых медицинских шкал

### Пример: Добавление шкалы APACHE II

1. **Обновить типы** (`src/lib/scoring.ts`):
```typescript
export interface TriageScores {
  news: number;
  mews: number;
  qsofa: number;
  apache2: number; // новая шкала
}
```

2. **Реализовать функцию расчета**:
```typescript
export function calculateAPACHE2(vitals: VitalSigns, age: number): number {
  let score = 0;
  // ... логика расчета
  return score;
}
```

3. **Обновить схему БД** (создать новую миграцию):
```sql
ALTER TABLE triage_assessments ADD COLUMN apache2_score INTEGER;
```

4. **Обновить API** (`src/routes/triage.ts`):
```typescript
const apache2Score = calculateAPACHE2(vitalSigns, patient.age);
// добавить в INSERT
```

5. **Обновить frontend** (`public/static/app.js`):
```javascript
// добавить отображение новой шкалы
```

---

## 🔒 Безопасность

### Текущие меры
- CORS настроен только для `/api/*`
- Валидация всех входных данных
- Логирование всех действий
- Отсутствие прямого доступа к БД из frontend

### Рекомендации для production
- [ ] Добавить аутентификацию (JWT/OAuth)
- [ ] Добавить RBAC (Role-Based Access Control)
- [ ] Шифрование чувствительных данных
- [ ] Rate limiting для API
- [ ] HTTPS обязательно
- [ ] Регулярные бэкапы БД

---

## 📊 Мониторинг и логирование

### PM2 логи
```bash
pm2 logs triage-app --nostream     # Просмотр логов
pm2 monit                          # Мониторинг в реальном времени
```

### Cloudflare Analytics
После деплоя доступны метрики:
- Количество запросов
- Время ответа
- Ошибки
- Географическое распределение

---

## 🐛 Troubleshooting

### Проблема: БД не инициализирована
```bash
npm run db:reset
npm run db:migrate:local
```

### Проблема: Порт 3000 занят
```bash
fuser -k 3000/tcp
# или
pm2 delete all
```

### Проблема: Ошибки TypeScript
```bash
npm run build
# проверить консоль на ошибки компиляции
```

---

**Версия**: 1.0.0  
**Дата обновления**: 2025-11-08
