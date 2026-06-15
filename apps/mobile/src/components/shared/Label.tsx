import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { colors, fontFamilies } from '@/constants/theme'

interface LabelProps {
  children: React.ReactNode
}

export default function Label({ children }: LabelProps) {
  return (
    <Text style={styles.label}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontFamily: fontFamilies.uiSemiBold,
    letterSpacing: 1.2,
    color: colors.textFaint,
    textTransform: 'uppercase',
  },
})
