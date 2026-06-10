# SDM Bank Edge Recommendation System

![Hackathon Winner](https://img.shields.io/badge/Hackathon-Winner-success)
![Inference Local](https://img.shields.io/badge/Inference-Local%20%2F%20Edge-blue)
![ML CatBoost](https://img.shields.io/badge/ML-CatBoost-orange)
![Frontend React + TypeScript](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61dafb)
![Mobile React Native / Expo](https://img.shields.io/badge/Mobile-React%20Native%20%2F%20Expo-4630eb)

Проект-победитель хакатона «Операционный импульс» от СДМ-Банка.

Система персонализированных рекомендаций банковских продуктов с локальным inference. Проект показывает, как рекомендации могут рассчитываться на стороне клиента с помощью моделей CatBoost без отправки чувствительных пользовательских данных на удаленный inference-сервер.

## Ключевые особенности

- Проект-победитель хакатона СДМ-Банка.
- Локальный / edge inference: рекомендации рассчитываются на устройстве или в браузере.
- Pointwise-модель рекомендаций банковских продуктов на базе CatBoost.
- Синтетические demo-профили клиентов, построенные на Santander-like банковских данных.
- Web-приложение для визуализации рекомендаций.
- Android-приложение для on-device inference и замера производительности.
- Pipeline для обучения, экспорта и верификации model artifacts.

## Проблема

Банкам необходимо рекомендовать релевантные продукты, при этом снижая privacy-риски. Классический серверный recommendation service требует передачи пользовательских атрибутов в backend. В этом проекте исследуется edge-подход, при котором model artifacts доставляются на клиент, а рекомендации рассчитываются локально.

## Решение

Система состоит из трех основных частей:

1. ML pipeline
   - предобработка данных;
   - восстановление пропусков в доходах с помощью `CatBoostRegressor`;
   - генерация поведенческих proxy-признаков;
   - обучение `CatBoostClassifier` для рекомендаций в pointwise-постановке;
   - экспорт модели для web и mobile inference.

2. Web-приложение
   - интерфейс на React + TypeScript;
   - локальная загрузка model artifacts;
   - CatBoost inference в браузере;
   - ранжирование и визуализация банковских продуктов.

3. Mobile-приложение
   - приложение на React Native / Expo;
   - native Android inference через CatBoost `.cbm`;
   - экран бенчмарков для измерения локальной задержки inference.

## Архитектура

```text
Профиль пользователя
  -> feature builder
  -> CatBoost model artifact
  -> local inference
  -> ранжированный список банковских продуктов
  -> web / mobile UI
```

Backend в проекте используется в основном для обучения, экспорта и верификации. Основной demo-сценарий не требует backend inference для рекомендаций.

## Machine Learning

- В качестве базового датасета для прототипа используются Santander banking data.
- `CatBoostRegressor` применяется для заполнения пропусков в доходах.
- Дополнительно генерируются поведенческие proxy-признаки для обогащения представления клиента.
- `CatBoostClassifier` обучается в pointwise-постановке ранжирования.
- Кандидатные банковские продукты оцениваются независимо, после чего сортируются по предсказанной релевантности.

Репозиторий ориентирован на качество hackathon prototype, проверку feasibility локального inference и parity между экспортированными artifacts и клиентским runtime. Он не претендует на production-grade модельную валидацию или полный набор benchmark-метрик.

## Edge Inference

- Web inference использует статические artifacts из [frontend/public/model](/Users/daniil/code/mai/sdm_hack/frontend/public/model).
- Mobile inference использует native `.cbm` artifact из [mobile/assets/model](/Users/daniil/code/mai/sdm_hack/mobile/assets/model).
- Пользовательские данные остаются на клиенте в основном recommendation flow.
- Для основного demo-сценария backend recommendation request не требуется.

## Структура репозитория

```text
frontend/    React + TypeScript web demo с локальным inference
mobile/      React Native / Expo Android app с native CatBoost inference
backend/     Скрипты подготовки данных, обучения, экспорта и верификации
scripts/     Cross-platform скрипты проверки и benchmark-утилиты
```

## Технологии

- Python
- pandas
- NumPy
- scikit-learn
- CatBoost
- FastAPI
- React
- TypeScript
- React Native / Expo
- Docker

## Запуск

### Web

```bash
cd frontend
npm install
npm run dev
```

Для основного local demo flow запуск backend не требуется.

### Build

```bash
cd frontend
npm run build
```

### Проверка model artifacts

```bash
node scripts/verify-model.mjs
node scripts/audit-no-stubs.mjs
```

### Model parity check

```bash
cd frontend
npm run model:parity
```

### Mobile

```bash
cd mobile
npm install
npm run android
```

Для native Android build и on-device inference необходимы Android Studio и Android SDK.

### Пример frontend-конфигурации

См. [frontend/.env.example](/Users/daniil/code/mai/sdm_hack/frontend/.env.example). Переменная backend URL необязательна для основного demo-сценария, так как рекомендации рассчитываются локально.

## Ключевые файлы

- [frontend/src/model/loadModel.ts](/Users/daniil/code/mai/sdm_hack/frontend/src/model/loadModel.ts)
- [frontend/src/model/catboostJsonPredict.ts](/Users/daniil/code/mai/sdm_hack/frontend/src/model/catboostJsonPredict.ts)
- [frontend/src/model/buildPointwiseRows.ts](/Users/daniil/code/mai/sdm_hack/frontend/src/model/buildPointwiseRows.ts)
- [frontend/src/model/recommend.ts](/Users/daniil/code/mai/sdm_hack/frontend/src/model/recommend.ts)
- [mobile/src/services/modelInference.ts](/Users/daniil/code/mai/sdm_hack/mobile/src/services/modelInference.ts)
- [mobile/modules/sdm-catboost/](/Users/daniil/code/mai/sdm_hack/mobile/modules/sdm-catboost)
- [backend/scripts/pipeline/export_catboost_mobile.py](/Users/daniil/code/mai/sdm_hack/backend/scripts/pipeline/export_catboost_mobile.py)
- [scripts/verify-model.mjs](/Users/daniil/code/mai/sdm_hack/scripts/verify-model.mjs)
- [scripts/audit-no-stubs.mjs](/Users/daniil/code/mai/sdm_hack/scripts/audit-no-stubs.mjs)

## Верификация

Текущая верификация в репозитории предназначена для подтверждения наличия artifacts и консистентности inference-path:

- присутствуют web model artifacts;
- присутствуют mobile model artifacts;
- в bundle включен native `.cbm`;
- legacy surrogate bundle не используется в mobile inference path;
- parity tooling позволяет сравнивать reference scores с runtime predictions.

Подтвержденными следует считать только те проверки, которые действительно были выполнены в текущем окружении.

## Ограничения

- Это hackathon prototype, а не production-ready банковская система.
- Репозиторий демонстрирует feasibility локального inference, а не полный production cycle model governance.
- Для проверки mobile runtime требуется Android-окружение и native toolchain.
- Для реального банковского внедрения потребуются дополнительные меры в области security, compliance, monitoring и model validation.

## Privacy Note

Проект демонстрирует privacy-preserving архитектуру: пользовательские атрибуты преобразуются в признаки и оцениваются локально. Основной recommendation path не требует отправки персональных данных в backend inference endpoint.

## Результат на хакатоне

Проект занял первое место на хакатоне «Операционный импульс» от СДМ-Банка.

## Disclaimer

Проект предназначен как hackathon prototype и техническая демонстрация. Он не предназначен для production-использования в банковской среде без дополнительной проработки security, compliance, monitoring и model validation.
