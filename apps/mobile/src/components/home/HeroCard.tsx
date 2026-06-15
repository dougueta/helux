import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, radii, fontFamilies } from '@/constants/theme'
import type { WorkoutListItem } from '@/data/mock'
import Icon from '@/components/shared/Icon'
import Label from '@/components/shared/Label'
import MatchBadge from '@/components/shared/MatchBadge'

interface HeroCardProps {
  workout: WorkoutListItem
  onStart: () => void
}

export function HeroCard({ workout, onStart }: HeroCardProps) {
  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={onStart}
      activeOpacity={0.85}
    >
      {/* Glow effect behind card */}
      <View style={styles.glow} />

      {/* Card container with simulated gradient (surface2 → surface1) */}
      <View style={styles.card}>
        {/* Gradient layer bottom */}
        <View style={styles.gradientBottom} />
        {/* Gradient layer top */}
        <View style={styles.gradientTop} />

        {/* Content on top of gradient */}
        <View style={styles.content}>
          {/* Top row: label + match badge */}
          <View style={styles.topRow}>
            <Label>Treino de hoje</Label>
            <MatchBadge value={workout.match} />
          </View>

          {/* Workout name */}
          <Text style={styles.name}>{workout.name}</Text>

          {/* Focus */}
          <Text style={styles.focus}>{workout.focus}</Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="dumbbell" size={16} stroke={colors.textDim} />
              <Text style={styles.metaText}>{workout.exercises} exercícios</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="clock" size={15} stroke={colors.textDim} />
              <Text style={styles.metaText}>~{workout.duration} min</Text>
            </View>
          </View>

          {/* CTA pill */}
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Iniciar treino</Text>
            <Icon name="play" size={17} stroke={colors.accentInk} fill={colors.accentInk} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    right: '10%',
    height: 80,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 40,
    shadowOpacity: 0.3,
    elevation: 0,
  },
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.hairline2,
    overflow: 'hidden',
  },
  gradientBottom: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface1,
  },
  gradientTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface2,
    opacity: 0.7,
  },
  content: {
    padding: 20,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
    marginTop: 2,
  },
  focus: {
    fontSize: 14,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 14,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 13,
    paddingHorizontal: 24,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    shadowOpacity: 0.4,
    elevation: 6,
    alignSelf: 'stretch',
  },
  ctaText: {
    fontSize: 15,
    fontFamily: fontFamilies.uiBold,
    color: colors.accentInk,
  },
})
