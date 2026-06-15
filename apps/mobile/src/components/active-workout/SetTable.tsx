import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, fontFamilies } from '@/constants/theme'
import type { SetState } from '@helux/workouts'
import SetRow from './SetRow'
import Icon from '@/components/shared/Icon'

interface Props {
  exerciseId: string
  sets: SetState[]
  onLogSet: (exId: string, setIdx: number, w: number, r: number) => void
  onCompleteSet: (exId: string, setIdx: number) => void
  onAddSet: (exId: string) => void
}

export default function SetTable({ exerciseId, sets, onLogSet, onCompleteSet, onAddSet }: Props) {
  return (
    <View style={styles.container}>
      {/* Column headers */}
      <View style={styles.header}>
        <Text style={[styles.headerCell, styles.headerNo]}>Série</Text>
        <Text style={[styles.headerCell, styles.headerPrev]}>Anterior</Text>
        <Text style={[styles.headerCell, styles.headerKg]}>Kg</Text>
        <Text style={[styles.headerCell, styles.headerReps]}>Reps</Text>
        <View style={styles.headerCheck} />
      </View>

      {/* Set rows */}
      {sets.map((s, idx) => (
        <SetRow
          key={idx}
          setNum={idx + 1}
          state={s}
          onUpdateW={(w) => onLogSet(exerciseId, idx, w, s.r)}
          onUpdateR={(r) => onLogSet(exerciseId, idx, s.w, r)}
          onComplete={() => onCompleteSet(exerciseId, idx)}
        />
      ))}

      {/* Add set button */}
      <TouchableOpacity style={styles.addBtn} onPress={() => onAddSet(exerciseId)} activeOpacity={0.7}>
        <Icon name="plus" size={14} stroke={colors.textDim} />
        <Text style={styles.addBtnText}>Adicionar série</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 8,
  },
  headerCell: {
    fontSize: 12,
    color: colors.textFaint,
    fontFamily: fontFamilies.ui,
  },
  headerNo: {
    width: 18,
    textAlign: 'center',
  },
  headerPrev: {
    width: 72,
    flexShrink: 1,
  },
  headerKg: {
    flex: 1,
    textAlign: 'center',
  },
  headerReps: {
    flex: 1,
    textAlign: 'center',
  },
  headerCheck: {
    width: 36,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addBtnText: {
    fontSize: 14,
    color: colors.textDim,
    fontFamily: fontFamilies.ui,
  },
})
