import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { colors, fontFamilies, radii } from '@/constants/theme'

interface MatchBadgeProps {
  value: number
  size?: 'md' | 'sm'
}

export default function MatchBadge({ value, size = 'md' }: MatchBadgeProps) {
  const isSm = size === 'sm'

  return (
    <View style={[styles.badge, isSm ? styles.badgeSm : styles.badgeMd]}>
      <Svg width={5} height={5} style={styles.dot}>
        <Circle cx={2.5} cy={2.5} r={2.5} fill={colors.accent} />
      </Svg>
      <Text style={[styles.value, isSm ? styles.valueSm : styles.valueMd]}>
        {value}
      </Text>
      <Text style={[styles.label, isSm ? styles.labelSm : styles.labelMd]}>
        {' fit'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentLine,
    borderRadius: radii.pill,
  },
  badgeMd: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 4,
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  dot: {
    marginRight: 2,
  },
  value: {
    color: colors.accent,
    fontFamily: fontFamilies.mono,
  },
  valueMd: {
    fontSize: 13,
  },
  valueSm: {
    fontSize: 11,
  },
  label: {
    color: colors.accent,
    opacity: 0.7,
  },
  labelMd: {
    fontSize: 13,
  },
  labelSm: {
    fontSize: 11,
  },
})
