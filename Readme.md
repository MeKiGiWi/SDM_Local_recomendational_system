# СДМ Банк — Персональные рекомендации (Edge ML)

Система рекомендаций банковских продуктов. 
**Модель обучается на сервере → сбрасывается на телефон → работает локально.**

## Архитектура потока данных

```
┌─────────────┐     train     ┌──────────────┐
│  Сервер     │──────────────→│ CatBoost     │
│  (Python)   │               │  pointwise   │
│             │               └──────┬───────┘
│ Santander   │                      │
│ Bank Churn  │               export │ catboost_pointwise.cbm
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
                             │  CatBoost    │
                             │  .cbm native │
                             │  (offline)   │
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
│   │   │   └── modelInference.ts  # Native CatBoost .cbm (Android)
│   │   ├── components/            # UI компоненты
│   │   ├── pages/                 # Страницы
│   │   └── store/                 # Zustand
│   └── public/model/              # catboost_pointwise.cbm (копия для web metadata)
│
├── backend/                       # ML-пайплайн (Python)
│   ├── models/export/             # catboost_pointwise_holdout.pkl
│   ├── src/
│   │   ├── models/                # catboost_pointwise.py
│   │   ├── pipeline/              # Данные: загрузка, фичи
│   │   ├── evaluation/            # Метрики
│   │   └── api/                   # FastAPI
│   └── scripts/
│       ├── train_catboost_pointwise.py
│       └── export_catboost_mobile.py
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

**Датасет:** `backend/datasets/raw/train_wide_with_lags.csv`  
**Подготовка данных (ноутбуки на main):** `datasets/00_clean_dataset.ipynb`, `01_generate_income_from_cleaned.ipynb` — если CSV уже готов, пропустите.

**Демо-профили (квантили 0.05 / 0.25 / 0.5 / 0.8 из train_long):**
```bash
python backend/scripts/build_train_long.py
python backend/scripts/profiles_from_train_long_quantiles.py --apply
```
Артефакт: `backend/datasets/processed/profile_quantiles.json`

**Colab (обучение):** [ноутбук pointwise](https://colab.research.google.com/drive/18Egarg7p1_BW2NujhQFGHbwUW6U1XI4y) → сохраните `.pkl` в `backend/models/export/catboost_pointwise_holdout.pkl`

```bash
pip install -r backend/requirements.txt
python backend/scripts/run_full_pipeline.py --sample-frac 0.25 --iterations 1200
# или по шагам:
python backend/scripts/train_catboost_pointwise.py
python backend/scripts/export_catboost_mobile.py
node scripts/verify-model.mjs
cd frontend && npm run build
```

Телефон (Expo): `phone.bat` — API на ПК + модель в `mobile/assets/model` + установка APK.
Браузер на телефоне: `serve-phone.bat`.

### Проверка модели

```bash
cd backend
python -c "
from src.models.catboost_pointwise import get_recommender, UserContext
r = get_recommender()
ctx = UserContext.from_api(age=30, balance=250000, monthly_income=85000)
print(r.rank_products(ctx, top_k=5))
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

## CatBoost pointwise

- **Сервер:** `catboost_pointwise_holdout.pkl` — полный инференс
- **Телефон (Android):** `catboost_pointwise.cbm` (~3.5 MB) — **тот же CatBoost**, нативный applier (`ai.catboost:catboost-prediction`), офлайн в APK. Без logistic surrogate.
- **Браузер:** рекомендации через API → серверный `.pkl` (тот же CatBoost).

## Телефон (Expo + сервер на ПК)

ПК и телефон в **одной Wi‑Fi**. Модель в приложении (локальный инференс), API — с ноутбука.

| Команда | Что делает |
|---------|------------|
| `build-apk.bat` | Собрать APK → `dist/sdm-bank-debug.apk` (~2–5 мин после первой сборки) |
| `phone.bat` | API `:8000` + export модели + `expo run:android` (USB) или Expo Go (QR) |
| `phone.bat --expo-go` | Только Expo Go, без сборки APK |
| `serve-phone.bat` | Браузер на телефоне (`:5173` + API) |

```bat
phone.bat
```

Перед первой сборкой: Android Studio / JDK 17, USB-отладка. Быстрый тест без APK: `phone.bat --expo-go` + приложение **Expo Go** из Play Store.

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
