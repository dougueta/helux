import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, fontFamilies } from '@/constants/theme'

interface SectionHeadProps {
  title: string
  action?: string
  onAction?: () => void
}

export default function SectionHead({ title, action, onAction }: SectionHeadProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action != null && (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontFamily: fontFamilies.uiSemiBold,
    color: colors.text,
  },
  action: {
    fontSize: 14,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
  },
})
