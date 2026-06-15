import React from 'react'
import { ScrollView, View, Text, StyleSheet, Platform } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fontFamilies } from '@/constants/theme'
import { MOCK_USER, MOCK_WORKOUTS, MOCK_GENETICS } from '@/data/mock'
import { HeroCard } from '@/components/home/HeroCard'
import { RecoveryCard } from '@/components/home/RecoveryCard'
import { WeekDotsCard } from '@/components/home/WeekDotsCard'
import { GeneticInsightCard } from '@/components/home/GeneticInsightCard'
import HelixMark from '@/components/shared/HelixMark'
import Icon from '@/components/shared/Icon'

function getFormattedDate(): string {
  const now = new Date()
  const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' })
  const day = now.getDate()
  const month = now.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const capitalWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${capitalWeekday} · ${day} ${month}`
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets()
  const todayWorkout = MOCK_WORKOUTS.find((w) => w.today)!
  const driver = MOCK_GENETICS.drivers[0]

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 8 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.brand}>
          <HelixMark size={22} />
          <Text style={styles.brandName}>helux</Text>
        </View>
        <View style={styles.streak}>
          <Icon name="flame" size={15} stroke={colors.accent} fill={colors.accentSoft} />
          <Text style={styles.streakNum}>{MOCK_USER.streak}</Text>
          <Text style={styles.streakUnit}>sem</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dateSub}>{getFormattedDate()}</Text>
        <Text style={styles.greeting}>
          {'Bom treino,\n'}
          <Text style={styles.greetingName}>{MOCK_USER.firstName}</Text>
        </Text>
      </View>

      {/* Hero Card */}
      <View style={styles.heroContainer}>
        <HeroCard
          workout={todayWorkout}
          onStart={() => router.push('/treino-ativo')}
        />
      </View>

      {/* Grid: Recovery + Week Dots */}
      <View style={styles.grid}>
        <RecoveryCard value={MOCK_USER.recovery} />
        <WeekDotsCard done={MOCK_USER.week.done} target={MOCK_USER.week.target} />
      </View>

      {/* Genetic Insight */}
      <View style={styles.insightContainer}>
        <GeneticInsightCard
          driver={driver}
          onPress={() => router.push('/(tabs)/dna')}
        />
      </View>

      {/* Bottom spacer for tab bar */}
      <View style={styles.bottomSpacer} />
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
  topbar: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 18,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  streakNum: {
    fontSize: 13,
    fontFamily: fontFamilies.mono,
    color: colors.text,
  },
  streakUnit: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  dateSub: {
    fontSize: 13,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 32,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
    lineHeight: 40,
  },
  greetingName: {
    color: colors.accent,
  },
  heroContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  insightContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  bottomSpacer: {
    height: 80,
  },
})
