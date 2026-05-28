import { requireNativeModule } from 'expo-modules-core'

export type CatboostRow = {
  numeric: number[]
  categorical: string[]
}

export type RankedProduct = {
  product: string
  score: number
}

interface SdmCatboostNative {
  loadModel(modelPath: string): Promise<void>
  predict(rows: CatboostRow[]): Promise<number[]>
}

const Native = requireNativeModule<SdmCatboostNative>('SdmCatboost')

export async function loadCatboostModel(modelPath: string): Promise<void> {
  await Native.loadModel(modelPath)
}

export async function predictCatboost(rows: CatboostRow[]): Promise<number[]> {
  return Native.predict(rows)
}

export function isCatboostNativeAvailable(): boolean {
  try {
    return Boolean(Native?.loadModel)
  } catch {
    return false
  }
}
