#!/usr/bin/env node
/**
 * Debug APK с вшитым JS (без Metro).
 *   node scripts/build-apk.mjs
 * → dist/sdm-bank-debug.apk
 */

import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const isWin = process.platform === 'win32'
const venvPy = join(
  root,
  '.venv',
  isWin ? 'Scripts' : 'bin',
  isWin ? 'python.exe' : 'python',
)
const pythonCmd = existsSync(venvPy) ? venvPy : 'python'
const mobile = join(root, 'mobile')
const android = join(mobile, 'android')
const appGradle = join(android, 'app', 'build.gradle')
const dist = join(root, 'dist')

const SDK_ROOT =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk')

const JDK_CANDIDATES = [
  'C:\\Program Files\\Microsoft\\jdk-17.0.19.10-hotspot',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.13.11-hotspot',
  'C:\\Program Files\\Android\\Android Studio\\jbr',
]

function log(msg) {
  console.log(`\n▶ ${msg}`)
}

function fail(msg) {
  console.error(`\n✖ ${msg}`)
  process.exit(1)
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd ?? root,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, ...opts.env },
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function findJavaHome() {
  if (process.env.JAVA_HOME && existsSync(join(process.env.JAVA_HOME, 'bin', 'java.exe'))) {
    return process.env.JAVA_HOME
  }
  for (const p of JDK_CANDIDATES) {
    if (existsSync(join(p, 'bin', 'java.exe'))) return p
  }
  return null
}

function findAapt() {
  const bt = join(SDK_ROOT, 'build-tools')
  if (!existsSync(bt)) return null
  const dirs = spawnSync(isWin ? 'cmd' : 'ls', isWin ? ['/c', 'dir /b /o-n', bt] : [bt], {
    encoding: 'utf8',
    shell: isWin,
  })
  const versions = (dirs.stdout || '').split(/\r?\n/).filter(Boolean)
  for (const v of versions) {
    const aapt = join(bt, v.trim(), isWin ? 'aapt.exe' : 'aapt')
    if (existsSync(aapt)) return aapt
  }
  return null
}

function ensureBundleEmbeddedInApk() {
  const aapt = findAapt()
  const apk = join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
  if (!aapt) {
    log('aapt не найден — пропуск проверки bundle')
    return
  }
  const r = spawnSync(aapt, ['list', apk], { encoding: 'utf8', shell: isWin })
  if (!r.stdout?.includes('assets/index.android.bundle')) {
    fail(
      'В APK нет assets/index.android.bundle — будет "Unable to load script".\n' +
        'Проверьте debuggableVariants = [] в mobile/android/app/build.gradle',
    )
  }
  log('Проверка OK: assets/index.android.bundle в APK')
}

function ensureDebuggableVariantsEmpty() {
  if (!existsSync(appGradle)) return
  const src = readFileSync(appGradle, 'utf8')
  if (src.includes('debuggableVariants = []')) return
  const patched = src.replace(
    /react\s*\{/,
    'react {\n    debuggableVariants = []',
  )
  if (patched === src) {
    fail('Добавьте debuggableVariants = [] в mobile/android/app/build.gradle (react { ... })')
  }
  writeFileSync(appGradle, patched, 'utf8')
  log('Добавлено debuggableVariants = [] в app/build.gradle')
}

function main() {
  const javaHome = findJavaHome()
  if (!javaHome) fail('Нужен JDK 17. winget install Microsoft.OpenJDK.17')
  if (!existsSync(SDK_ROOT)) fail(`SDK не найден: ${SDK_ROOT}`)
  if (!existsSync(join(android, 'gradlew.bat'))) {
    fail('Нет mobile/android → cd mobile && npx expo prebuild --platform android')
  }

  const env = {
    JAVA_HOME: javaHome,
    ANDROID_HOME: SDK_ROOT,
    ANDROID_SDK_ROOT: SDK_ROOT,
    NODE_ENV: 'production',
    EXPO_PUBLIC_USE_MOCK: 'false',
    EXPO_PUBLIC_USE_LOCAL_MODEL: 'true',
  }

  ensureDebuggableVariantsEmpty()

  writeFileSync(
    join(android, 'local.properties'),
    `sdk.dir=${SDK_ROOT.replace(/\\/g, '\\\\')}\n`,
    'utf8',
  )

  log(`JAVA_HOME=${javaHome}`)
  log('Экспорт модели…')
  run(pythonCmd, [join(root, 'backend', 'scripts', 'pipeline', 'export_model.py')], { env })

  log('Сборка APK (JS bundle вшивается в debug)…')
  run(isWin ? 'gradlew.bat' : './gradlew', ['--stop'], { cwd: android, env })
  run(
    isWin ? 'gradlew.bat' : './gradlew',
    [
      ':app:createBundleDebugJsAndAssets',
      'assembleDebug',
      '--no-daemon',
      '-PreactNativeArchitectures=arm64-v8a',
    ],
    { cwd: android, env },
  )

  ensureBundleEmbeddedInApk()

  const apkSrc = join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
  mkdirSync(dist, { recursive: true })
  const apkDst = join(dist, 'sdm-bank-debug.apk')
  copyFileSync(apkSrc, apkDst)

  log(`Готово: ${apkDst}`)
  log('Установка: adb install -r dist\\sdm-bank-debug.apk')
}

main()
