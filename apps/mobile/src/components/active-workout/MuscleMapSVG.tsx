import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { MuscleMap } from '@helux/workouts'
import { colors, radii, fontFamilies } from '@/constants/theme'

const MM_LABEL: Record<string, string> = {
  peito: 'Peitoral',
  ombro: 'Deltoide',
  triceps: 'Tríceps',
  biceps: 'Bíceps',
  core: 'Core',
  dorsal: 'Dorsais',
  quadriceps: 'Quadríceps',
  gluteos: 'Glúteos',
  isquiotibiais: 'Isquiotibiais',
  panturrilha: 'Panturrilha',
  trapezio: 'Trapézio',
  antebraco: 'Antebraço',
}

interface Props {
  muscles: MuscleMap
}

interface ChipProps {
  label: string
  variant: 'primary' | 'secondary'
}

function MuscleChip({ label, variant }: ChipProps) {
  return (
    <View style={[styles.chip, variant === 'primary' ? styles.chipPrimary : styles.chipSecondary]}>
      <Text style={[styles.chipText, variant === 'primary' ? styles.chipTextPrimary : styles.chipTextSecondary]}>
        {MM_LABEL[label] ?? label}
      </Text>
    </View>
  )
}

export default function MuscleMapSVG({ muscles }: Props) {
  const hasMuscles = muscles.primary.length > 0 || muscles.secondary.length > 0

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MÚSCULOS</Text>
      {hasMuscles ? (
        <View style={styles.chipRow}>
          {muscles.primary.map((m) => (
            <MuscleChip key={`p-${m}`} label={m} variant="primary" />
          ))}
          {muscles.secondary.map((m) => (
            <MuscleChip key={`s-${m}`} label={m} variant="secondary" />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>—</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    padding: 16,
  },
  title: {
    fontSize: 12,
    color: colors.textFaint,
    fontFamily: fontFamilies.ui,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipPrimary: {
    backgroundColor: colors.accent,
  },
  chipSecondary: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentLine,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fontFamilies.ui,
  },
  chipTextPrimary: {
    color: colors.accentInk,
  },
  chipTextSecondary: {
    color: colors.accent,
  },
  empty: {
    fontSize: 14,
    color: colors.textFaint,
    fontFamily: fontFamilies.ui,
  },
})
