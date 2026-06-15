import React from 'react'
import { ScrollView, View, Text, StyleSheet, Platform } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fontFamilies } from '@/constants/theme'
import { MOCK_PROGRAM, MOCK_WORKOUTS } from '@/data/mock'
import { ProgramCard } from '@/components/workout-list/ProgramCard'
import { WorkoutRow } from '@/components/workout-list/WorkoutRow'
import Label from '@/components/shared/Label'
import SectionHead from '@/components/shared/SectionHead'

export default function TreinosScreen() {
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
        <Label>Seu programa</Label>
        <Text style={styles.h1}>Treinos</Text>
      </View>

      <View style={styles.section}>
        <ProgramCard program={MOCK_PROGRAM} />
      </View>

      <View style={styles.sectionHead}>
        <SectionHead title="Seu split" action="Editar" />
      </View>
      <View style={styles.section}>
        {MOCK_WORKOUTS.map((workout) => (
          <WorkoutRow
            key={workout.id}
            workout={workout}
            onStart={() => router.push('/treino-ativo')}
          />
        ))}
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
    paddingTop: 20,
    paddingBottom: 12,
  },
  section: {
    paddingHorizontal: 20,
  },
  spacer: {
    height: 80,
  },
})
