# СДМ Банк — Персональные рекомендации (Edge ML)

Система рекомендаций банковских продуктов. 
**Модель обучается на сервере → сбрасывается на телефон → работает локально.**

## Архитектура потока данных

```
┌─────────────┐     train     ┌──────────────┐
│  Сервер     │──────────────→│ BitNet b1.58 │
│  (Python)   │               │  Recommender │
│             │               └──────┬───────┘
│ Santander   │                      │
│ Bank Churn  │               export │ .gguf / .onnx
│ Credit Card │                      │
│ UCI Market  │                      ▼
└─────────────┘     копия     ┌──────────────┐
                             │  frontend/    │
                             │  public/model │
                             └──────┬───────┘
                                    │
                         загрузка   │
                         по HTTP    │
                                    ▼
                             ┌──────────────┐
                             │  Телефон     │
                             │  (Android)   │
                             │              │
                             │  bitnet.cpp  │
                             │  локальный   │
                             │  инференс    │
                             │              │
                             │  + персона-  │
                             │  лизация по  │
                             │  кликам      │
                             └──────────────┘
```

## Структура проекта

```
SDM/
├── frontend/                      # React + TypeScript + Vite
│   ├── src/
│   │   ├── data/
│   │   │   ├── ad-products.json   # ⭐ Все продукты + реклама (один файл!)
│   │   │   └── productParser.ts   # Парсер JSON → React
│   │   ├── services/              # Клиентский ML-инференс
│   │   │   ├── modelInference.ts  # JS-предиктор (BitNet эвристика)
│   │   │   └── modelLoader.ts     # ONNX-runtime загрузчик
│   │   ├── components/            # UI компоненты
│   │   ├── pages/                 # Страницы
│   │   └── store/                 # Zustand
│   └── public/model/              # Модель для телефона (GGUF/ONNX)
│
├── backend/                       # ML-пайплайн (Python)
│   ├── src/
│   │   ├── models/
│   │   │   ├── bitnet.py          # BitNet b1.58 архитектура
│   │   │   ├── train.py           # Обучение на Santander
│   │   │   └── export/
│   │   │       ├── onnx_export.py # → ONNX
│   │   │       └── gguf_export.py # → GGUF (bitnet.cpp)
│   │   ├── pipeline/              # Данные: загрузка, синтетика, фичи
│   │   ├── evaluation/            # Precision@k, NDCG@k, CTR, Business Value
│   │   └── edge/                  # Edge runtime
│   │       ├── runtime/           # Эмулятор телефона + Kotlin-спецификация
│   │       └── personalization/   # Локальное дообучение на кликах
│   └── scripts/
│       ├── export_to_frontend.py  # Копирует модель в frontend/public/model/
│       └── export_to_android.py   # Копирует модель в backend/edge/android_assets/
│
├── docker-compose.yml             # Docker: frontend + backend + train
└── Readme.md
```

## Быстрый старт

### Фронтенд (без модели)

```bash
cd frontend
npm install
npm run dev -- --host
# → http://localhost:5173
```

Работает с JS-предиктором (клиентский инференс без сервера).

### Полный цикл (обучение + деплой)

```bash
# 1. Обучение модели (Docker)
docker compose --profile train up train

# 2. Или локально:
cd backend
pip install -r requirements.txt
python -m src.models.train --epochs 10 --device cpu
python -m src.models.export.onnx_export
python -m src.models.export.gguf_export
python scripts/export_to_frontend.py
python scripts/export_to_android.py

# 3. Запуск фронтенда с моделью
cd ../frontend
npm run dev -- --host
```

### Проверка модели

```bash
python -c "
from src.models.bitnet import BitNetRecommender
import torch
m = BitNetRecommender()
x = torch.randn(1, 32)
print(f'Output: {m(x).shape}')  # [1, 36]
print(m.export_info())
"
```

## Как управлять сайтом

**Один файл:** `frontend/src/data/ad-products.json`

| Поле | Действие |
|------|----------|
| `name` | Название в каталоге |
| `description` | Текст на странице продукта |
| `showOnHome: true` | Карточка-реклама на главной |
| `color` | Градиент карточки |
| `image` | Путь к картинке |

Поменял JSON → изменился весь сайт.

## BitNet b1.58

Модель использует архитектуру Microsoft BitNet:
- **Веса:** {-1, 0, +1} — 1.58 бита на параметр
- **Активации:** int8
- **Нормализация:** RMSNorm
- **MLP:** SwiGLU
- **Размер:** ~100 KB для рекомендательной модели

## Docker

```bash
docker compose up --build     # только фронтенд (по умолчанию)
docker compose --profile dev up --build # фронтенд + бэкенд
```

## Endpoint'ы (бэкенд)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/ads/ai-select` | AI-подбор рекламы |
| POST | `/analytics/event` | События кликов |
| GET | `/products` | Все продукты |
| GET | `/model/health` | Статус модели |
