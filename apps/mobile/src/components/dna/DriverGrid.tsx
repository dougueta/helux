import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radii, fontFamilies } from '@/constants/theme'
import Icon from '@/components/shared/Icon'

const DRIVER_ICONS: Record<string, string> = {
  load: 'dumbbell',
  freq: 'swap',
  rest: 'timer',
  mob: 'spark',
}

interface Driver {
  icon: string
  title: string
  text: string
}

interface DriverGridProps {
  drivers: Driver[]
}

export function DriverGrid({ drivers }: DriverGridProps) {
  return (
    <View style={styles.grid}>
      {drivers.map((driver, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon
              name={DRIVER_ICONS[driver.icon] ?? 'bolt'}
              size={18}
              stroke={colors.accent}
            />
          </View>
          <Text style={styles.title}>{driver.title}</Text>
          <Text style={styles.text}>{driver.text}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface1,
    borderRadius: radii.sm,
    padding: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: fontFamilies.uiSemiBold,
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
    lineHeight: 18,
  },
})
