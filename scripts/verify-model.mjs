#!/usr/bin/env node
/** Verify CatBoost .cbm + metadata for web and Expo. */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const web = join(root, 'frontend', 'public', 'model')
const mobile = join(root, 'mobile', 'assets', 'model')
const required = ['catboost_pointwise.cbm', 'catboost_model.json', 'feature_order.json']

let ok = true

function check(dir, label) {
  console.log(`\n${label}: ${dir}`)
  if (!existsSync(dir)) {
    console.log('  (missing dir)')
    ok = false
    return
  }
  for (const f of required) {
    const p = join(dir, f)
    if (!existsSync(p)) {
      console.log(`  ✖ ${f}`)
      ok = false
    } else {
      console.log(`  ✓ ${f} (${Math.round(statSync(p).size / 1024)} KB)`)
    }
  }
  const metaPath = join(dir, 'catboost_model.json')
  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'))
    if (meta.inference !== 'catboost_cbm_native') {
      console.log(`  ✖ inference=${meta.inference} (expected catboost_cbm_native)`)
      ok = false
    }
    if (!meta.products?.length) {
      console.log('  ✖ empty products in metadata')
      ok = false
    }
  }
}

check(web, 'Web (frontend/public/model)')
check(mobile, 'Expo bundle (mobile/assets/model)')

if (existsSync(join(web, 'catboost_mobile.json'))) {
  console.log('\n✖ Legacy catboost_mobile.json still present — re-run export')
  ok = false
}

process.exit(ok ? 0 : 1)
