function envFlag(name: string, defaultValue: boolean): boolean {
  const value = import.meta.env[name]
  if (value === undefined || value === '') return defaultValue
  return value === 'true'
}

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  TIMEOUT: 10000,
  USE_MOCK: envFlag('VITE_USE_MOCK', false),
  /** Web: true = CatBoost on backend API; false = ads mock/API only */
  USE_LOCAL_MODEL: envFlag('VITE_USE_LOCAL_MODEL', true),
  RETRY_COUNT: 3,
}

export const AUTH_CONFIG = {
  TOKEN_KEY: 'sdm_auth_token',
  REFRESH_TOKEN_KEY: 'sdm_refresh_token',
}
