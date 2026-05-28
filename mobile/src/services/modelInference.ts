import { Asset } from 'expo-asset'
import { Platform } from 'react-native'
import {
  isCatboostNativeAvailable,
  loadCatboostModel,
  predictCatboost,
} from 'sdm-catboost'
import modelMeta from '../../assets/model/catboost_model.json'
import cbmModule from '../../assets/model/catboost_pointwise.cbm'
import featureOrder from '../../assets/model/feature_order.json'
import {
  buildPointwiseRows,
  type ModelMeta,
  type Segment,
  type UserFeatures,
} from './pointwiseFeatures'

export type { Segment, UserFeatures }

const meta = modelMeta as ModelMeta
const productNames: string[] =
  meta.products ?? (featureOrder as { product_names?: string[] }).product_names ?? []

let initialized = false
let initError: string | null = null

export function isModelLoaded(): boolean {
  return initialized
}

export const isBitNetLoaded = isModelLoaded

export function getModelInitError(): string | null {
  return initError
}

export async function initModel(): Promise<boolean> {
  if (initialized) return true
  if (Platform.OS !== 'android') {
    initError = 'CatBoost native inference is Android-only (use API on iOS/web).'
    return false
  }
  if (!isCatboostNativeAvailable()) {
    initError = 'Native module SdmCatboost missing — run: npx expo prebuild --platform android'
    return false
  }

  try {
    const asset = Asset.fromModule(cbmModule)
    await asset.downloadAsync()
    const uri = asset.localUri ?? asset.uri
    if (!uri) throw new Error('CBM asset URI missing')
    await loadCatboostModel(uri)
    initialized = true
    initError = null
    console.info('[CatBoost] Loaded native CBM', productNames.length, 'products')
    return true
  } catch (e) {
    initError = e instanceof Error ? e.message : String(e)
    console.error('[CatBoost] init failed:', initError)
    return false
  }
}

export const initBitNet = initModel

export function getProductIndex(productId: string): number {
  return productNames.indexOf(productId)
}

export function getProductId(modelIndex: number): string | null {
  return productNames[modelIndex] ?? null
}

export function predict(f: UserFeatures): Float32Array {
  if (!initialized) {
    throw new Error(initError ?? 'CatBoost model not loaded')
  }
  throw new Error('Use predictAsync() for native CatBoost inference')
}

export async function predictAsync(f: UserFeatures): Promise<Float32Array> {
  if (!initialized) {
    const ok = await initModel()
    if (!ok) throw new Error(initError ?? 'CatBoost model not loaded')
  }

  const rows = buildPointwiseRows(f, meta)
  const probs = await predictCatboost(rows)
  const scores = new Float32Array(productNames.length)
  for (let i = 0; i < productNames.length; i++) {
    const idx = meta.products.indexOf(productNames[i])
    scores[i] = idx >= 0 ? probs[idx] : 0
  }
  return scores
}

/** Sync wrapper for legacy callers — runs native path via cached scores not supported; use predictAsync. */
export function predictSync(f: UserFeatures): Float32Array {
  void f
  throw new Error('predictSync removed — use predictAsync with native CatBoost')
}

export function personalize(scores: Float32Array, clicks: Record<string, number>): Float32Array {
  const adj = new Float32Array(scores)
  for (const [id, count] of Object.entries(clicks)) {
    const idx = getProductIndex(id)
    if (idx >= 0 && idx < adj.length) adj[idx] += 0.05 * Math.min(count, 20)
  }
  return adj
}

export function getTopKUniqueProductIds(scores: Float32Array, k = 5): string[] {
  const sorted = Array.from(scores)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s)
  const seen = new Set<string>()
  const ids: string[] = []
  for (const { i } of sorted) {
    const id = getProductId(i)
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
    if (ids.length >= k) break
  }
  return ids
}
