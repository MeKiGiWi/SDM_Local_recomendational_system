import { Platform } from 'react-native'
import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined

let baseUrl =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL) ||
  extra?.apiBaseUrl ||
  'http://10.0.2.2:8000/api'

export const API_CONFIG = {
  get BASE_URL() {
    return baseUrl
  },
  TIMEOUT: 10000,
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === 'true',
  USE_LOCAL_MODEL:
    process.env.EXPO_PUBLIC_USE_LOCAL_MODEL === 'true' ||
    (process.env.EXPO_PUBLIC_USE_LOCAL_MODEL !== 'false' && Platform.OS === 'android'),
}

export function setApiBaseUrl(url: string) {
  baseUrl = url
}

export async function initApiConfig(): Promise<void> {
  const { apiClient } = await import('../api/client')
  apiClient.setBaseUrl(API_CONFIG.BASE_URL)
}
