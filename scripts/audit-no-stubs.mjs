#!/usr/bin/env node
/**
 * Fail if logistic surrogate / legacy stubs are still in the mobile inference path.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mobileModel = join(root, 'mobile', 'assets', 'model')
const mobileSrc = join(root, 'mobile', 'src')
const forbiddenFiles = [
  join(mobileModel, 'catboost_mobile.json'),
  join(root, 'frontend', 'public', 'model', 'catboost_mobile.json'),
]

const requiredFiles = [
  join(mobileModel, 'catboost_pointwise.cbm'),
  join(mobileModel, 'catboost_model.json'),
]

const forbiddenPatterns = [
  /logistic_surrogate/i,
  /catboost_mobile\.json/,
  /surrogate\.coef/,
  /predictHeuristic/,
  /bitnet_weights/i,
]

let ok = true
function fail(msg) {
  console.error('✖', msg)
  ok = false
}
function pass(msg) {
  console.log('✓', msg)
}

console.log('=== Audit: no hidden model stubs ===\n')

for (const p of forbiddenFiles) {
  if (existsSync(p)) fail(`Legacy stub file exists: ${p}`)
}
if (ok) pass('No catboost_mobile.json surrogate bundle')

for (const p of requiredFiles) {
  if (!existsSync(p)) fail(`Missing: ${p}`)
}
if (existsSync(join(mobileModel, 'catboost_pointwise.cbm'))) {
  const mb = readFileSync(join(mobileModel, 'catboost_pointwise.cbm')).length / 1e6
  if (mb < 1) fail(`CBM too small (${mb} MB) — likely corrupt`)
  else pass(`catboost_pointwise.cbm present (${mb.toFixed(2)} MB)`)
}

const meta = JSON.parse(readFileSync(join(mobileModel, 'catboost_model.json'), 'utf8'))
if (meta.inference !== 'catboost_cbm_native') fail(`Wrong inference type: ${meta.inference}`)
else pass(`Metadata inference=${meta.inference}`)

const inferenceTs = readFileSync(join(mobileSrc, 'services', 'modelInference.ts'), 'utf8')
if (!inferenceTs.includes('predictCatboost')) fail('modelInference.ts does not call predictCatboost')
else pass('modelInference.ts uses native predictCatboost')

if (!inferenceTs.includes('catboost_pointwise.cbm')) fail('modelInference.ts does not load .cbm')
else pass('modelInference.ts loads .cbm asset')

if (inferenceTs.includes('surrogate')) fail('modelInference.ts still mentions surrogate')
else pass('No surrogate in modelInference.ts')

if (!existsSync(join(root, 'mobile', 'modules', 'sdm-catboost', 'android', 'src', 'main', 'java', 'ru', 'mai', 'sdm', 'catboost', 'SdmCatboostModule.kt'))) {
  fail('Native module SdmCatboostModule.kt missing')
} else {
  const kt = readFileSync(
    join(root, 'mobile', 'modules', 'sdm-catboost', 'android', 'src', 'main', 'java', 'ru', 'mai', 'sdm', 'catboost', 'SdmCatboostModule.kt'),
    'utf8',
  )
  if (!kt.includes('CatBoostModel.loadModel')) fail('Kotlin module does not load CatBoostModel')
  else pass('Native Kotlin uses CatBoostModel.loadModel')
  if (!kt.includes('ai.catboost')) fail('Kotlin module missing ai.catboost import')
  else pass('Kotlin uses ai.catboost.CatBoostModel')
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) walk(p, acc)
    else if (/\.(ts|tsx)$/.test(name.name)) acc.push(p)
  }
  return acc
}

for (const file of walk(mobileSrc)) {
  const text = readFileSync(file, 'utf8')
  for (const re of forbiddenPatterns) {
    if (re.test(text) && !file.includes('pointwiseFeatures')) {
      fail(`Forbidden pattern ${re} in ${file.replace(root, '')}`)
    }
  }
}

const store = readFileSync(join(mobileSrc, 'store', 'userInputStore.ts'), 'utf8')
if (!store.includes('predictAsync')) fail('userInputStore does not use predictAsync')
else pass('userInputStore uses predictAsync (native path)')

console.log(ok ? '\n=== AUDIT PASSED ===' : '\n=== AUDIT FAILED ===')
process.exit(ok ? 0 : 1)
