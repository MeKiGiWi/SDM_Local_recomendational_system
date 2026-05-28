declare module '*.cbm' {
  const asset: number
  export default asset
}

declare module '*/catboost_model.json' {
  const value: {
    version: number
    inference: string
    model_file: string
    products: string[]
    numeric_features: string[]
    categorical_features: string[]
  }
  export default value
}
