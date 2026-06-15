import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radii, fontFamilies } from '@/constants/theme'
import Ring from '@/components/shared/Ring'

interface RecoveryCardProps {
  value: number
}

export function RecoveryCard({ value }: RecoveryCardProps) {
  return (
    <View style={styles.card}>
      <Ring size={62} sw={6} value={value}>
        <Text style={styles.ringValue}>{value}</Text>
      </Ring>
      <View style={styles.textBlock}>
        <Text style={styles.label}>Recuperação</Text>
        <Text style={styles.status}>Pronto p/ treinar</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ringValue: {
    fontFamily: fontFamilies.mono,
    fontSize: 14,
    color: colors.text,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
  },
  status: {
    fontSize: 14,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
    marginTop: 2,
  },
})
