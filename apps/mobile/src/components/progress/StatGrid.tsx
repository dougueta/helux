import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, fontFamilies } from '@/constants/theme'

interface Stat {
  label: string
  value: string
  sub: string
}

interface StatGridProps {
  stats: Stat[]
}

export function StatGrid({ stats }: StatGridProps) {
  return (
    <View style={styles.grid}>
      {stats.map((stat, index) => {
        const isRight = index % 2 === 0
        const isBottom = index < stats.length - 2
        return (
          <View
            key={index}
            style={[
              styles.cell,
              isRight && styles.cellBorderRight,
              isBottom && styles.cellBorderBottom,
            ]}
          >
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
            <Text style={styles.sub}>{stat.sub}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
    padding: 16,
  },
  cellBorderRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.hairline,
  },
  cellBorderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  value: {
    fontSize: 28,
    fontFamily: fontFamilies.mono,
    color: colors.text,
  },
  label: {
    fontSize: 13,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
    marginTop: 2,
  },
  sub: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
    marginTop: 1,
  },
})
