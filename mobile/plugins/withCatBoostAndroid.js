const { withAppBuildGradle } = require('@expo/config-plugins')

/** Ensure CatBoost JNI is packaged (arm64 for debug APK). */
function withCatBoostAndroid(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents
    if (!contents.includes('catboost-prediction')) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation("ai.catboost:catboost-prediction:1.2.8")`,
      )
    }
    cfg.modResults.contents = contents
    return cfg
  })
}

module.exports = withCatBoostAndroid
