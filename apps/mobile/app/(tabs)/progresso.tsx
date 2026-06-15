import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors } from '@/constants/theme'

export default function ProgressoScreen() {
  return <View style={styles.container} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
})
