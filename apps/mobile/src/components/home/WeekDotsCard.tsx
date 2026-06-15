import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radii, fontFamilies } from '@/constants/theme'

interface WeekDotsCardProps {
  done: number
  target: number
}

export function WeekDotsCard({ done, target }: WeekDotsCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Semana</Text>
      <View style={styles.numRow}>
        <Text style={styles.numDone}>{done}</Text>
        <Text style={styles.numOf}> / {target}</Text>
      </View>
      <View style={styles.dots}>
        {Array.from({ length: target }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < done ? styles.dotOn : styles.dotOff]}
          />
        ))}
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
  },
  label: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
  },
  numRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  numDone: {
    fontSize: 28,
    fontFamily: fontFamilies.mono,
    color: colors.text,
    lineHeight: 34,
  },
  numOf: {
    fontSize: 16,
    fontFamily: fontFamilies.mono,
    color: colors.textFaint,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOn: {
    backgroundColor: colors.accent,
  },
  dotOff: {
    backgroundColor: colors.surface3,
  },
})
