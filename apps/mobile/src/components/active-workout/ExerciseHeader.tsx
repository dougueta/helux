import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, fontFamilies, radii } from '@/constants/theme'
import type { ActiveExercise } from '@helux/workouts'
import Chip from '@/components/shared/Chip'
import MatchBadge from '@/components/shared/MatchBadge'
import Icon from '@/components/shared/Icon'

interface Props {
  exercise: ActiveExercise
  onOpenSheet: () => void
}

export default function ExerciseHeader({ exercise, onOpenSheet }: Props) {
  return (
    <View style={styles.container}>
      {/* Muscle chip + match badge */}
      <View style={styles.row}>
        <Chip>{exercise.muscle}</Chip>
        <MatchBadge value={exercise.match} size="sm" />
      </View>

      {/* Exercise name */}
      <Text style={styles.name}>{exercise.name}</Text>

      {/* Scheme + rest */}
      <Text style={styles.scheme}>
        <Text style={styles.schemeMono}>{exercise.scheme}</Text>
        <Text>  ·  descanso </Text>
        <Text style={styles.schemeMono}>{exercise.rest}s</Text>
      </Text>

      {/* Genetic note */}
      {!!exercise.gene && (
        <View style={styles.geneRow}>
          <Icon name="dna" size={14} stroke={colors.accent} />
          <Text style={styles.geneText}>{exercise.gene}</Text>
        </View>
      )}

      {/* Ver execução button */}
      <TouchableOpacity style={styles.execBtn} onPress={onOpenSheet} activeOpacity={0.7}>
        <Icon name="play" size={14} stroke={colors.textDim} />
        <Text style={styles.execBtnText}>Ver execução</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
    lineHeight: 30,
  },
  scheme: {
    fontSize: 14,
    color: colors.textDim,
    fontFamily: fontFamilies.ui,
  },
  schemeMono: {
    fontFamily: fontFamilies.mono,
    color: colors.textDim,
  },
  geneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  geneText: {
    fontSize: 13,
    color: colors.textFaint,
    fontFamily: fontFamilies.ui,
    flexShrink: 1,
  },
  execBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.hairline2,
  },
  execBtnText: {
    fontSize: 14,
    color: colors.textDim,
    fontFamily: fontFamilies.ui,
  },
})
