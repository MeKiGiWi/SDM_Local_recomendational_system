export interface UserFeatures {
  age: number
  balance: number
  monthlyIncome: number
  accountType: number
  currency: number
  clicks: Record<string, number>
  seniorityMonths?: number
  isNewCustomer?: number
  sex?: number
  segmentVip?: number
  segmentStudent?: number
}

let modelWeights: Record<string, { data: number[][]; gamma?: number; shape: number[] }> | null = null
let productNames: string[] = []
let initialized = false

export async function initBitNet(): Promise<boolean> {
  if (initialized) return true
  try {
    const [wResp, fResp] = await Promise.all([
      fetch('/model/bitnet_weights.json'),
      fetch('/model/feature_order.json'),
    ])
    if (wResp.ok && fResp.ok) {
      modelWeights = await wResp.json()
      const featureOrder = await fResp.json()
      productNames = featureOrder.product_names || []
      initialized = true
      return true
    }
  } catch (e) {
    console.warn('[BitNet] No weights found, using heuristic')
  }
  initialized = true
  return false
}

export function getProductIndex(productId: string): number {
  return productNames.indexOf(productId)
}

export function getProductId(modelIndex: number): string | null {
  return productNames[modelIndex] ?? null
}

function rmsNorm(x: Float32Array, gamma: Float32Array): Float32Array {
  let sq = 0
  for (let i = 0; i < x.length; i++) sq += x[i] * x[i]
  const rms = Math.sqrt(sq / x.length + 1e-6)
  const out = new Float32Array(x.length)
  for (let i = 0; i < x.length; i++) out[i] = x[i] / rms * gamma[i]
  return out
}

function actQuant8(x: Float32Array): Float32Array {
  let maxAbs = 0
  for (let i = 0; i < x.length; i++) maxAbs = Math.max(maxAbs, Math.abs(x[i]))
  const scale = Math.max(maxAbs, 1e-8) / 127
  const out = new Float32Array(x.length)
  for (let i = 0; i < x.length; i++) {
    const q = Math.round(x[i] / scale)
    out[i] = Math.max(-127, Math.min(127, q)) * scale
  }
  return out
}

function bitLinear(x: Float32Array, wData: number[][], gamma: number, bias: number[]): Float32Array {
  const outDim = wData.length
  const inDim = x.length
  const out = new Float32Array(outDim)
  for (let i = 0; i < outDim; i++) {
    let sum = bias[i] || 0
    const row = wData[i]
    for (let j = 0; j < inDim; j++) {
      sum += row[j] * gamma * x[j]
    }
    out[i] = sum
  }
  return out
}

function silu(x: Float32Array): Float32Array {
  const out = new Float32Array(x.length)
  for (let i = 0; i < x.length; i++) out[i] = x[i] * (1 / (1 + Math.exp(-x[i])))
  return out
}

function getWeights(pattern: string): { w: number[][]; g: number; b: number[] } | null {
  if (!modelWeights) return null
  const wk = Object.keys(modelWeights).find(k => k.includes(pattern))
  if (!wk) return null
  const w = modelWeights[wk]
  const bk = Object.keys(modelWeights).find(k => k.includes(pattern.replace('weight', 'bias')))
  const bias = bk ? modelWeights[bk].data as unknown as number[] : new Array(w.shape[0]).fill(0)
  return { w: w.data as number[][], g: w.gamma ?? 1, b: bias }
}

export function extractFeatures(f: UserFeatures): Float32Array {
  const feats = new Float32Array(32)
  feats[0] = (f.age - 35) / 15
  feats[1] = (f.balance - 50000) / 30000
  feats[2] = (f.monthlyIncome - 60000) / 40000
  feats[3] = f.accountType / 3
  feats[4] = f.currency / 3
  feats[5] = (f.seniorityMonths ?? 0) / 120
  feats[6] = f.isNewCustomer ?? 0
  feats[7] = f.segmentVip ?? 0
  feats[8] = f.segmentStudent ?? 0
  for (const [id, count] of Object.entries(f.clicks)) {
    const idx = productNames.indexOf(id)
    if (idx >= 0) {
      feats[9 + (idx % 23)] = Math.min(count / 100, 1)
    }
  }
  return feats
}

export function predict(feats: Float32Array): Float32Array {
  if (!modelWeights) return predictHeuristic(feats)

  try {
    let x = feats

    const emb = getWeights('embed.weight')
    if (emb) {
      const out = new Float32Array(emb.w.length)
      for (let i = 0; i < emb.w.length; i++) {
        let s = 0
        for (let j = 0; j < feats.length; j++) s += emb.w[i][j] * feats[j]
        out[i] = s
      }
      x = out
    }

    const blockKeys = Object.keys(modelWeights).filter(k => k.includes('blocks') && k.includes('weight'))
    for (const bk of blockKeys) {
      const prefix = bk.replace(/\.weight$/, '')
      const norm = modelWeights[prefix + '.norm.w']
      const bl = getWeights(prefix + '.weight')
      if (!bl || !norm) continue

      const nGamma = new Float32Array(norm.data as unknown as number[])
      let xn = rmsNorm(x, nGamma)
      xn = actQuant8(xn)
      let xl = bitLinear(xn, bl.w, bl.g, bl.b)
      xl = silu(xl)
      if (xl.length === x.length) {
        const prevX = new Float32Array(x)
        for (let i = 0; i < Math.min(xl.length, prevX.length); i++) {
          x[i] = xl[i] + prevX[i]
        }
      }
    }

    const fnKey = Object.keys(modelWeights || {}).find(k => k.includes('norm') && k.includes('.w'))
    if (fnKey) {
      x = rmsNorm(x, new Float32Array(modelWeights[fnKey].data as unknown as number[]))
    }

    const hd = getWeights('head.weight')
    if (hd) x = bitLinear(x, hd.w, hd.g, hd.b)

    return x.slice(0, 36) as Float32Array
  } catch (e) {
    console.warn('[BitNet] Inference error, using heuristic:', e)
    return predictHeuristic(feats)
  }
}

export function predictHeuristic(feats: Float32Array): Float32Array {
  const scores = new Float32Array(36)
  const seed = feats.reduce((a, b) => a * 31 + Math.round(b * 1000), 0)
  const rng = ((s: number) => () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647 })(Math.abs(seed))
  const ageFactor = (feats[0] + 1) / 2
  const balFactor = (feats[1] + 3) / 6
  for (let i = 0; i < 36; i++) {
    scores[i] = 0.12 + 0.04 * Math.sin(i * 0.5) + 0.25 * ageFactor + 0.25 * balFactor + (rng() - 0.5) * 0.15
  }
  return scores
}

export function personalize(scores: Float32Array, clicks: Record<string, number>): Float32Array {
  const adj = new Float32Array(scores)
  for (const [id, count] of Object.entries(clicks)) {
    const idx = getProductIndex(id)
    if (idx >= 0 && idx < adj.length) {
      adj[idx] += 0.05 * Math.min(count, 20)
    }
  }
  return adj
}

export function getTopK(scores: Float32Array, k = 3): number[] {
  return Array.from(scores)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map(x => x.i)
}
