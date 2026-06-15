import React from 'react'
import { ScrollView, View, Text, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fontFamilies } from '@/constants/theme'
import { MOCK_GENETICS } from '@/data/mock'
import { DnaHero } from '@/components/dna/DnaHero'
import { GeneticTraitRow } from '@/components/dna/GeneticTraitRow'
import { DriverGrid } from '@/components/dna/DriverGrid'
import Label from '@/components/shared/Label'
import SectionHead from '@/components/shared/SectionHead'

export default function DnaScreen() {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 8 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Label>Perfil Helux</Label>
        <Text style={styles.h1}>Seu DNA</Text>
      </View>

      <View style={styles.section}>
        <DnaHero score={MOCK_GENETICS.score} summary={MOCK_GENETICS.summary} />
      </View>

      <View style={styles.sectionHead}>
        <SectionHead title="Marcadores genéticos" />
      </View>
      <View style={styles.section}>
        {MOCK_GENETICS.traits.map((trait) => (
          <GeneticTraitRow key={trait.key} trait={trait} />
        ))}
      </View>

      <View style={styles.sectionHead}>
        <SectionHead title="Como molda seu treino" />
      </View>
      <View style={styles.section}>
        <DriverGrid drivers={MOCK_GENETICS.drivers} />
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 4,
  },
  h1: {
    fontSize: 32,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
    marginTop: 4,
  },
  sectionHead: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  section: {
    paddingHorizontal: 20,
  },
  spacer: {
    height: 80,
  },
})
