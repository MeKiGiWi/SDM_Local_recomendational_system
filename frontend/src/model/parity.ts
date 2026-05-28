import expectedScores from './__fixtures__/expected_scores.json'
import fixtureProfiles from './__fixtures__/profiles.json'
import { buildPointwiseRows } from './buildPointwiseRows'
import { predictRows } from './catboostJsonPredict'
import { resetLoadedModelForTests } from './loadModel'
import type { LoadedModel } from './loadModel'
import { profileToUserFeatures, type ProfileForModel } from './profileToModel'
import modelMeta from '../../public/model/catboost_model.json'
import runtimeModel from '../../public/model/catboost_web_runtime.json'
import catFeatureHashes from '../../public/model/catboost_cat_features_hashes.json'

interface ExpectedFixture {
  profileId: string
  scores: Record<string, number>
  top5: string[]
}

const model: LoadedModel = {
  meta: modelMeta,
  runtime: runtimeModel,
  catFeatureHashes,
}

function top5FromScores(scores: Record<string, number>): string[] {
  return Object.entries(scores)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([productId]) => productId)
}

async function main(): Promise<void> {
  resetLoadedModelForTests()
  let failures = 0

  for (const rawProfile of fixtureProfiles as Array<Record<string, unknown>>) {
    const profile = {
      ...rawProfile,
      monthlyIncome: rawProfile.monthlyIncomeRub,
      scoringIncome: rawProfile.scoringIncome,
      accountType: 'current',
      currency: 'RUB',
    } as ProfileForModel
    const expected = (expectedScores as ExpectedFixture[]).find((item) => item.profileId === profile.id)
    if (!expected) throw new Error(`Missing expected fixture for ${profile.id}`)

    const rows = buildPointwiseRows(profileToUserFeatures(profile), model.meta)
    const rawScores = predictRows(model, rows)
    const probabilities = Object.fromEntries(
      model.meta.products.map((productId, index) => [productId, 1 / (1 + Math.exp(-rawScores[index]))]),
    )
    const actualTop5 = top5FromScores(probabilities)
    const overlap = actualTop5.filter((productId) => expected.top5.includes(productId)).length
    const maxDelta = Math.max(
      ...model.meta.products.map((productId) => Math.abs(probabilities[productId] - expected.scores[productId])),
    )

    console.log(`${profile.id}: overlap=${overlap}/5 maxDelta=${maxDelta.toFixed(6)}`)
    if (overlap < 4 || maxDelta > 0.02) {
      failures += 1
      console.error(`  expected top5=${expected.top5.join(', ')}`)
      console.error(`  actual   top5=${actualTop5.join(', ')}`)
    }
  }

  if (failures > 0) {
    throw new Error(`Parity failed for ${failures} profile(s)`)
  }
}

void main()
