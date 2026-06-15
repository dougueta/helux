import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { colors, fontFamilies } from '@/constants/theme'
import Icon from '@/components/shared/Icon'

export interface RestState {
  active: boolean
  left: number
  total: number
}

interface Props {
  rest: RestState
  onExtend: () => void
  onSkip: () => void
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const x = s % 60
  return m + ':' + String(x).padStart(2, '0')
}

export default function RestTimerBanner({ rest, onExtend, onSkip }: Props) {
  const animWidth = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!rest.active || rest.total === 0) return
    const progress = 1 - rest.left / rest.total
    animWidth.setValue(progress)
  }, [rest.left, rest.total, rest.active, animWidth])

  if (!rest.active) return null

  const progress = rest.total > 0 ? 1 - rest.left / rest.total : 0

  return (
    <View style={styles.container}>
      {/* Progress bar background */}
      <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />

      {/* Content */}
      <View style={styles.inner}>
        <Icon name="timer" size={18} stroke={colors.accent} />
        <Text style={styles.timeText}>
          Descansando · <Text style={styles.timeMono}>{fmt(rest.left)}</Text>
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onExtend} style={styles.actionBtn} activeOpacity={0.7}>
            <Text style={styles.actionText}>+15s</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSkip} style={styles.actionBtn} activeOpacity={0.7}>
            <Text style={styles.actionText}>Pular</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    backgroundColor: colors.surface2,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.accentSoft,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  timeText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontFamily: fontFamilies.ui,
  },
  timeMono: {
    fontFamily: fontFamilies.mono,
    fontSize: 15,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 14,
    color: colors.textDim,
    fontFamily: fontFamilies.ui,
  },
})
