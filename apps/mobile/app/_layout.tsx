import { useEffect } from 'react'
import { Stack, Redirect, type Href } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk'
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { colors } from '@/constants/theme'
import { useAuth } from '@/hooks/useAuth'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_600SemiBold,
  })
  const { session, loading: authLoading } = useAuth()

  useEffect(() => {
    if (fontsLoaded && !authLoading) SplashScreen.hideAsync()
  }, [fontsLoaded, authLoading])

  if (!fontsLoaded || authLoading) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="treino-ativo" options={{ presentation: 'modal' }} />
      </Stack>
      {!session && <Redirect href={'/login' as Href} />}
    </GestureHandlerRootView>
  )
}
