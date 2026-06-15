import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radii, fontFamilies } from '@/constants/theme'
import type { RecoveryData } from '@helux/types'

interface RecoveryCardProps {
  data: RecoveryData | null
}

export function RecoveryCard({ data }: RecoveryCardProps) {
  if (!data) {
    return (
      <View style={styles.card}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Sincronize para{'\n'}ver recuperação</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.metricBlock}>
        <Text style={styles.metricValue}>{data.hrv ?? '—'}</Text>
        <Text style={styles.metricUnit}>ms</Text>
      </View>
      <View style={styles.textBlock}>
        <View style={styles.row}>
          <Text style={styles.label}>HRV</Text>
          <Text style={styles.value}>{data.hrv !== undefined ? `${data.hrv} ms` : '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>FC repouso</Text>
          <Text style={styles.value}>{data.restingHR !== undefined ? `${data.restingHR} bpm` : '—'}</Text>
        </View>
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
    minHeight: 80,
  },
  metricBlock: {
    alignItems: 'center',
    width: 44,
  },
  metricValue: {
    fontFamily: fontFamilies.mono,
    fontSize: 20,
    color: colors.accent,
    lineHeight: 24,
  },
  metricUnit: {
    fontFamily: fontFamilies.ui,
    fontSize: 10,
    color: colors.textFaint,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
  },
  value: {
    fontSize: 13,
    fontFamily: fontFamilies.mono,
    color: colors.text,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
    textAlign: 'center',
    lineHeight: 18,
  },
})
