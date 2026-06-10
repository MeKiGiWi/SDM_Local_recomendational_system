# SDM Bank Edge Recommendation System

![Hackathon Winner](https://img.shields.io/badge/Hackathon-Winner-success)
![Inference Local](https://img.shields.io/badge/Inference-Local%20%2F%20Edge-blue)
![ML CatBoost](https://img.shields.io/badge/ML-CatBoost-orange)
![Frontend React + TypeScript](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61dafb)
![Mobile React Native / Expo](https://img.shields.io/badge/Mobile-React%20Native%20%2F%20Expo-4630eb)

Winner of the "Operational Impulse" Hackathon by SDM Bank.

A privacy-preserving recommendation system for banking products. The project demonstrates how personalized product recommendations can be generated locally on the client side using CatBoost models, without sending sensitive user data to a remote inference server.

## Highlights

- Hackathon-winning project for SDM Bank.
- Local / edge inference: recommendations are generated on-device or in-browser.
- CatBoost-based pointwise ranking model for banking products.
- Synthetic demo client profiles generated from Santander-like banking data.
- Web app for recommendation visualization.
- Android app for on-device inference benchmarks.
- Training, export, and verification pipeline for CatBoost model artifacts.

## Problem

Banks need to recommend relevant products while minimizing privacy risks. A classical server-side recommendation service requires sending user attributes to a backend. This project explores an edge inference approach where model artifacts are shipped to the client and recommendations are calculated locally.

## Solution

The system contains three main parts:

1. ML pipeline
   - data preprocessing;
   - missing income estimation with `CatBoostRegressor`;
   - behavioral proxy feature generation;
   - pointwise `CatBoostClassifier` training for product recommendation;
   - model export for web and mobile inference.

2. Web application
   - React + TypeScript interface;
   - local model loading from static artifacts;
   - in-browser CatBoost inference;
   - product ranking and visualization.

3. Mobile application
   - React Native / Expo app;
   - native Android CatBoost `.cbm` inference;
   - benchmark screen for measuring local inference latency.

## Architecture

```text
User profile
  -> feature builder
  -> CatBoost model artifact
  -> local inference
  -> ranked banking products
  -> web / mobile UI
```

The backend is used mainly for training, exporting, and verification. The main demo path does not require backend recommendation inference.

## Machine Learning

- Santander banking data is used as the base dataset for the prototype workflow.
- `CatBoostRegressor` is used to fill missing income values.
- Additional behavioral proxy features are generated to enrich the user representation.
- `CatBoostClassifier` is trained with a pointwise ranking formulation.
- Candidate banking products are scored independently and then sorted by predicted relevance.

This repository focuses on hackathon prototype quality, local inference feasibility, and parity verification between exported artifacts and client-side runtime behavior. It does not claim production-grade model validation or benchmark completeness.

## Edge Inference

- Web inference uses static artifacts from [frontend/public/model](/Users/daniil/code/mai/sdm_hack/frontend/public/model).
- Mobile inference uses the native `.cbm` artifact from [mobile/assets/model](/Users/daniil/code/mai/sdm_hack/mobile/assets/model).
- User data stays on the client during the main recommendation flow.
- No backend recommendation request is required for the primary demo path.

## Repository Structure

```text
frontend/    React + TypeScript web demo with local inference
mobile/      React Native / Expo Android app with native CatBoost inference
backend/     Data preparation, training, export, and verification scripts
scripts/     Cross-platform verification and benchmark helpers
```

## Tech Stack

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

## Getting Started

### Web

```bash
cd frontend
npm install
npm run dev
```

For the main local demo flow, backend startup is not required.

### Build

```bash
cd frontend
npm run build
```

### Verify model artifacts

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

Android Studio and the Android SDK are required for the native Android build and on-device inference flow.

### Frontend environment example

See [frontend/.env.example](/Users/daniil/code/mai/sdm_hack/frontend/.env.example). The backend URL is optional for the main demo because recommendations are generated locally.

## Key Files

- [frontend/src/model/loadModel.ts](/Users/daniil/code/mai/sdm_hack/frontend/src/model/loadModel.ts)
- [frontend/src/model/catboostJsonPredict.ts](/Users/daniil/code/mai/sdm_hack/frontend/src/model/catboostJsonPredict.ts)
- [frontend/src/model/buildPointwiseRows.ts](/Users/daniil/code/mai/sdm_hack/frontend/src/model/buildPointwiseRows.ts)
- [frontend/src/model/recommend.ts](/Users/daniil/code/mai/sdm_hack/frontend/src/model/recommend.ts)
- [mobile/src/services/modelInference.ts](/Users/daniil/code/mai/sdm_hack/mobile/src/services/modelInference.ts)
- [mobile/modules/sdm-catboost/](/Users/daniil/code/mai/sdm_hack/mobile/modules/sdm-catboost)
- [backend/scripts/pipeline/export_catboost_mobile.py](/Users/daniil/code/mai/sdm_hack/backend/scripts/pipeline/export_catboost_mobile.py)
- [scripts/verify-model.mjs](/Users/daniil/code/mai/sdm_hack/scripts/verify-model.mjs)
- [scripts/audit-no-stubs.mjs](/Users/daniil/code/mai/sdm_hack/scripts/audit-no-stubs.mjs)

## Verification

Current verification in this repository is designed to confirm artifact presence and inference-path consistency:

- web model artifacts exist;
- mobile model artifacts exist;
- native `.cbm` bundle is present;
- legacy surrogate bundle is not used in the mobile inference path;
- parity tooling is available to compare exported reference scores against runtime predictions.

Only checks actually executed in the current environment should be treated as confirmed.

## Privacy Note

The project demonstrates a privacy-preserving architecture: user attributes are transformed into features and scored locally. The main recommendation path does not require sending personal user data to a backend inference endpoint.

## Hackathon Result

This project won the "Operational Impulse" Hackathon by SDM Bank.

## Disclaimer

This is a hackathon prototype and research/demo project. It is not intended for production banking use without additional security, compliance, monitoring, and model validation.
