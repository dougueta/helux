import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '@/constants/theme'

interface Props {
  count: number
  currentIdx: number
  completedFlags: boolean[]
  onPress: (idx: number) => void
}

export default function ExerciseProgressSegments({ count, currentIdx, completedFlags, onPress }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => {
        const isDone = completedFlags[i]
        const isCurrent = i === currentIdx
        const bg = isDone ? colors.accent : isCurrent ? colors.accentSoft : colors.surface3

        return (
          <TouchableOpacity
            key={i}
            style={[styles.segment, { backgroundColor: bg }]}
            onPress={() => onPress(i)}
            activeOpacity={0.7}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 20,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
})
