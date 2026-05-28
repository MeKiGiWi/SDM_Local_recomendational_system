package ru.mai.sdm.catboost

import ai.catboost.CatBoostModel
import ai.catboost.CatBoostPredictions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SdmCatboostModule : Module() {
  private var model: CatBoostModel? = null

  override fun definition() = ModuleDefinition {
    Name("SdmCatboost")

    AsyncFunction("loadModel") { modelPath: String ->
      model?.close()
      model = CatBoostModel.loadModel(modelPath)
    }

    AsyncFunction("predict") { rows: List<Map<String, Any?>> ->
      val m = model ?: throw IllegalStateException("CatBoost model not loaded")
      if (rows.isEmpty()) return@AsyncFunction emptyList<Double>()

      val firstNumeric = rows[0]["numeric"] as? List<*>
        ?: throw IllegalArgumentException("row.numeric required")
      val firstCat = rows[0]["categorical"] as? List<*>
        ?: throw IllegalArgumentException("row.categorical required")
      val numericCount = firstNumeric.size
      val catCount = firstCat.size
      val n = rows.size

      val floatFeatures = Array(n) { i ->
        val nums = rows[i]["numeric"] as? List<*>
          ?: throw IllegalArgumentException("row.numeric required")
        FloatArray(numericCount) { j ->
          (nums[j] as Number).toFloat()
        }
      }

      val catFeatures = Array(n) { i ->
        val cats = rows[i]["categorical"] as? List<*>
          ?: throw IllegalArgumentException("row.categorical required")
        Array(catCount) { j -> cats[j].toString() }
      }

      val preds: CatBoostPredictions = m.predict(floatFeatures, catFeatures)
      List(n) { i -> preds.get(i, 0) }
    }
  }
}
