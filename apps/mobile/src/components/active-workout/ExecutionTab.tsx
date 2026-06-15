import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native'
import type { ActiveExercise } from '@helux/workouts'
import { colors, fontFamilies, radii } from '@/constants/theme'
import ExerciseDemo from './ExerciseDemo'
import MuscleMapSVG from './MuscleMapSVG'
import Icon from '@/components/shared/Icon'

interface Props {
  exercise: ActiveExercise
  activeVariantId?: string
}

export default function ExecutionTab({ exercise, activeVariantId }: Props) {
  // Resolve the active variant (or the recommended one)
  const activeVariant =
    exercise.variants.find((v) => v.id === activeVariantId) ??
    exercise.variants.find((v) => v.rec) ??
    exercise.variants[0]

  const motion = activeVariant?.motion ?? 'press-flat'
  const implement = activeVariant?.implement ?? 'barbell'
  const equip = activeVariant?.equip ?? ''
  const level = activeVariant?.level ?? ''

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Demo player */}
      <ExerciseDemo
        motion={motion}
        implement={implement}
        tempo={exercise.tempo}
      />

      <View style={styles.separator} />

      {/* Execution header + chips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Execução</Text>
        <View style={styles.chipRow}>
          {exercise.muscle ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{exercise.muscle}</Text>
            </View>
          ) : null}
          {equip ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{equip}</Text>
            </View>
          ) : null}
          {level ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{level}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Numbered cues */}
      <View style={styles.cuesList}>
        {exercise.cues.map((cue, i) => (
          <View key={i} style={styles.cueRow}>
            <Text style={styles.cueNumber}>{i + 1}</Text>
            <Text style={styles.cueText}>{cue}</Text>
          </View>
        ))}
      </View>

      <View style={styles.separator} />

      {/* Muscle map */}
      <MuscleMapSVG muscles={exercise.muscles} />

      {/* Genetic note */}
      {exercise.gene ? (
        <View style={styles.geneRow}>
          <Icon name="dna" size={14} stroke={colors.accent} />
          <Text style={styles.geneText}>{exercise.gene}</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 1,
    backgroundColor: colors.hairline,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fontFamilies.uiSemiBold,
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: colors.surface2,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipText: {
    fontSize: 13,
    color: colors.textDim,
    fontFamily: fontFamilies.ui,
  },
  cuesList: {
    gap: 10,
  },
  cueRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  cueNumber: {
    fontSize: 14,
    fontFamily: fontFamilies.mono,
    color: colors.accent,
    width: 20,
    textAlign: 'right',
  },
  cueText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamilies.ui,
    color: colors.text,
    lineHeight: 20,
  },
  geneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  geneText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
    lineHeight: 18,
  },
})
