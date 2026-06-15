import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { colors, fontFamilies } from '@/constants/theme'
import HelixMark from '@/components/shared/HelixMark'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    try {
      await signIn()
    } catch (err) {
      console.error('[Login]', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <HelixMark size={40} />
        <Text style={styles.brandName}>helux</Text>
      </View>
      <Text style={styles.tagline}>Treinos personalizados pelo seu DNA</Text>
      <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.buttonText}>Continuar com Google</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 36,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
  },
  tagline: {
    fontSize: 15,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: fontFamilies.uiBold,
    color: colors.bg,
  },
})
