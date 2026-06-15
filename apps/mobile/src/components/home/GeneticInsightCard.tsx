import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, radii, fontFamilies } from '@/constants/theme'
import type { GeneticDriver } from '@/data/mock'
import Icon from '@/components/shared/Icon'
import Label from '@/components/shared/Label'

interface GeneticInsightCardProps {
  driver: GeneticDriver
  onPress: () => void
}

export function GeneticInsightCard({ driver, onPress }: GeneticInsightCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Icon name="dna" size={20} stroke={colors.accent} />
      </View>
      <View style={styles.content}>
        <Label>Insight do seu DNA</Label>
        <Text style={styles.title}>{driver.title}</Text>
        <Text style={styles.text}>{driver.text}</Text>
      </View>
      <Icon name="chevron" size={18} stroke={colors.textFaint} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
    marginTop: 2,
  },
  text: {
    fontSize: 13,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
    lineHeight: 18,
  },
})
