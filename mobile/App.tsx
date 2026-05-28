import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { initApiConfig } from './src/config/api'
import type { RootStackParamList } from './src/navigation/types'
import { HomeScreen } from './src/screens/HomeScreen'
import { ProductScreen } from './src/screens/ProductScreen'
import { colors } from './src/config/theme'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void (async () => {
      await initApiConfig()
      setReady(true)
    })()
  }, [])

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Product" component={ProductScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
