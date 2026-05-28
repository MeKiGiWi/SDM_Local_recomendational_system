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

let Native: SdmCatboostNative | null | undefined

function getNative(): SdmCatboostNative | null {
  if (Native !== undefined) return Native
  try {
    Native = requireNativeModule<SdmCatboostNative>('SdmCatboost')
  } catch {
    Native = null
  }
  return Native
}

export async function loadCatboostModel(modelPath: string): Promise<void> {
  const native = getNative()
  if (!native) throw new Error('Native module SdmCatboost is not available')
  await native.loadModel(modelPath)
}

export async function predictCatboost(rows: CatboostRow[]): Promise<number[]> {
  const native = getNative()
  if (!native) throw new Error('Native module SdmCatboost is not available')
  return native.predict(rows)
}

export function isCatboostNativeAvailable(): boolean {
  return Boolean(getNative()?.loadModel)
}
