import React from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { colors } from '@/constants/theme'

interface RingProps {
  value: number
  size: number
  sw: number
  children?: React.ReactNode
}

export default function Ring({ value, size, sw, children }: RingProps) {
  const r = (size - sw) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - value / 100)
  const center = size / 2

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        style={styles.svg}
      >
        <Circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={sw}
        />
        <Circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={colors.accent}
          strokeWidth={sw}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      {children != null && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
