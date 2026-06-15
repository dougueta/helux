import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radii } from '@/constants/theme'

interface ChipProps {
  children: React.ReactNode
  accent?: boolean
}

export default function Chip({ children, accent = false }: ChipProps) {
  return (
    <View style={[styles.base, accent ? styles.accent : styles.default]}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, accent ? styles.textAccent : styles.textDefault]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  default: {
    backgroundColor: colors.surface2,
    borderColor: colors.hairline,
  },
  accent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  text: {
    fontSize: 13,
  },
  textDefault: {
    color: colors.textDim,
  },
  textAccent: {
    color: colors.accentInk,
  },
})
