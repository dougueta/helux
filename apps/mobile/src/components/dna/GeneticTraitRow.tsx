import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radii, fontFamilies } from '@/constants/theme'
import Icon from '@/components/shared/Icon'
import Chip from '@/components/shared/Chip'
import type { GeneticTrait } from '@/data/mock'

interface GeneticTraitRowProps {
  trait: GeneticTrait
}

export function GeneticTraitRow({ trait }: GeneticTraitRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{trait.label}</Text>
        <Text style={[styles.value, trait.warn && styles.valueWarn]}>{trait.value}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            trait.warn ? styles.fillWarn : styles.fillAccent,
            { width: `${trait.level * 100}%` },
          ]}
        />
      </View>
      <View style={styles.footer}>
        <View style={styles.geneRow}>
          <Icon name="dna" size={13} stroke={colors.textFaint} />
          <Text style={styles.gene}>{trait.gene}</Text>
        </View>
        {!!trait.tag && (
          <Chip accent={false}>{trait.tag}</Chip>
        )}
      </View>
      <Text style={styles.note}>{trait.note}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface1,
    borderRadius: radii.sm,
    padding: 16,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: fontFamilies.uiSemiBold,
    color: colors.text,
  },
  value: {
    fontSize: 14,
    fontFamily: fontFamilies.uiSemiBold,
    color: colors.text,
  },
  valueWarn: {
    color: colors.warn,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  fillAccent: {
    backgroundColor: colors.accent,
  },
  fillWarn: {
    backgroundColor: colors.warn,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  geneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gene: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
  },
  note: {
    fontSize: 13,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
    marginTop: 6,
  },
})
