#!/usr/bin/env node
/**
 * Phone bundle: native CatBoost .cbm (not surrogate).
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const modelDir = join(root, 'mobile', 'assets', 'model')

const cbm = join(modelDir, 'catboost_pointwise.cbm')
const metaPath = join(modelDir, 'catboost_model.json')
const webRuntime = join(modelDir, 'catboost_web_runtime.json')
const catHashes = join(modelDir, 'catboost_cat_features_hashes.json')

if (!existsSync(cbm)) {
  console.error('✖ Missing', cbm)
  process.exit(1)
}
if (!existsSync(metaPath)) {
  console.error('✖ Missing', metaPath)
  process.exit(1)
}
for (const p of [webRuntime, catHashes]) {
  if (!existsSync(p)) {
    console.error('✖ Missing JS runtime fallback:', p)
    process.exit(1)
  }
}

const meta = JSON.parse(readFileSync(metaPath, 'utf8'))
if (meta.inference !== 'catboost_cbm_native') {
  console.error('✖ Expected catboost_cbm_native, got', meta.inference)
  process.exit(1)
}

if (existsSync(join(modelDir, 'catboost_mobile.json'))) {
  console.error('✖ Legacy surrogate catboost_mobile.json still present')
  process.exit(1)
}

console.log('Phone bundle OK')
console.log('  cbm:', (readFileSync(cbm).length / 1e6).toFixed(2), 'MB')
console.log('  products:', meta.products.length)
console.log('  inference:', meta.inference)
console.log('  web_runtime:', (readFileSync(webRuntime).length / 1e6).toFixed(2), 'MB')
console.log('\n✓ CatBoost artifacts (native + JS runtime fallback for APK)')
