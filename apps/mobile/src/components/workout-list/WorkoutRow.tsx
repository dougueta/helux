import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, radii, fontFamilies } from '@/constants/theme'
import Icon from '@/components/shared/Icon'
import Chip from '@/components/shared/Chip'
import MatchBadge from '@/components/shared/MatchBadge'
import type { WorkoutListItem } from '@/data/mock'

interface WorkoutRowProps {
  workout: WorkoutListItem
  onStart: () => void
}

export function WorkoutRow({ workout, onStart }: WorkoutRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, workout.today && styles.rowToday]}
      onPress={onStart}
      activeOpacity={0.8}
    >
      <View style={[styles.sideBar, workout.today ? styles.sideBarAccent : styles.sideBarDefault]} />
      <View style={styles.main}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{workout.name}</Text>
          {workout.today && <Chip accent>Hoje</Chip>}
        </View>
        <Text style={styles.focus}>{workout.focus}</Text>
        <Text style={styles.meta}>
          {workout.exercises} exec · {workout.duration} min · {workout.last}
        </Text>
      </View>
      <View style={styles.right}>
        <MatchBadge value={workout.match} size="sm" />
        <TouchableOpacity style={styles.playBtn} onPress={onStart}>
          <Icon name="play" size={14} stroke={colors.accentInk} fill={colors.accentInk} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.sm,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: colors.surface1,
  },
  rowToday: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.accentLine,
  },
  sideBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  sideBarAccent: {
    backgroundColor: colors.accent,
  },
  sideBarDefault: {
    backgroundColor: colors.surface3,
  },
  main: {
    flex: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontFamily: fontFamilies.uiSemiBold,
    color: colors.text,
  },
  focus: {
    fontSize: 13,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
    marginBottom: 3,
  },
  meta: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
  },
  right: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
    paddingVertical: 12,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
