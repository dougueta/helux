import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, fontFamilies } from '@/constants/theme'

interface DataPoint {
  w: string
  v: number
}

interface BarChartProps {
  data: DataPoint[]
  height: number
}

export function BarChart({ data, height }: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => d.v))

  return (
    <View style={[styles.container, { height: height + 20 }]}>
      <View style={[styles.barsRow, { height }]}>
        {data.map((point, index) => {
          const isLast = index === data.length - 1
          const barHeight = (point.v / maxVal) * height

          return (
            <View key={index} style={styles.barWrapper}>
              <View style={[styles.barTrack, { height }]}>
                <View
                  style={[
                    styles.bar,
                    { height: barHeight },
                    isLast ? styles.barAccent : styles.barDefault,
                  ]}
                />
              </View>
              <Text style={styles.weekLabel}>{point.w}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barDefault: {
    backgroundColor: colors.surface3,
  },
  barAccent: {
    backgroundColor: colors.accent,
    shadowColor: colors.accentGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 1,
    elevation: 4,
  },
  weekLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    color: colors.textFaint,
    marginTop: 4,
  },
})
