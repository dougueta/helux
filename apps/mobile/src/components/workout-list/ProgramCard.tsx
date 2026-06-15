import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radii, fontFamilies } from '@/constants/theme'
import MatchBadge from '@/components/shared/MatchBadge'

interface ProgramCardProps {
  program: {
    name: string
    phase: string
    week: number
    weeks: number
    split: string
    match: number
  }
}

export function ProgramCard({ program }: ProgramCardProps) {
  const pct = (program.week / program.weeks) * 100

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.name}>{program.name}</Text>
        <MatchBadge value={program.match} />
      </View>
      <Text style={styles.phase}>{program.phase}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          Semana{' '}
          <Text style={styles.metaMono}>{program.week}</Text>
          {' de '}
          <Text style={styles.metaMono}>{program.weeks}</Text>
        </Text>
        <Text style={styles.meta}>{program.split}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radii.card,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
  },
  phase: {
    fontSize: 13,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
    marginBottom: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: 13,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
  },
  metaMono: {
    fontFamily: fontFamilies.mono,
    color: colors.textDim,
  },
})
