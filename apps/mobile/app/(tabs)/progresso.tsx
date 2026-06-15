import React from 'react'
import { ScrollView, View, Text, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radii, fontFamilies } from '@/constants/theme'
import { MOCK_PROGRESS } from '@/data/mock'
import { StatGrid } from '@/components/progress/StatGrid'
import { BarChart } from '@/components/progress/BarChart'
import { PersonalRecordRow } from '@/components/progress/PersonalRecordRow'
import { SessionHistoryRow } from '@/components/progress/SessionHistoryRow'
import Label from '@/components/shared/Label'
import SectionHead from '@/components/shared/SectionHead'
import Icon from '@/components/shared/Icon'

const last = MOCK_PROGRESS.volume[MOCK_PROGRESS.volume.length - 1].v
const prev = MOCK_PROGRESS.volume[MOCK_PROGRESS.volume.length - 2].v
const delta = (((last - prev) / prev) * 100).toFixed(0)

export default function ProgressoScreen() {
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
        <Label>Sua evolução</Label>
        <Text style={styles.h1}>Progresso</Text>
      </View>

      <View style={styles.section}>
        <StatGrid stats={MOCK_PROGRESS.stats} />
      </View>

      <View style={styles.section}>
        <View style={styles.volumeCard}>
          <Label>Volume semanal</Label>
          <View style={styles.volumeRow}>
            <Text style={styles.volumeNum}>{last}t</Text>
            <View style={styles.volumeDelta}>
              <Icon name="arrowUp" size={13} stroke={colors.accent} />
              <Text style={styles.deltaText}>{delta}%</Text>
            </View>
          </View>
          <BarChart data={MOCK_PROGRESS.volume} height={120} />
        </View>
      </View>

      <View style={styles.sectionHead}>
        <SectionHead title="Recordes pessoais" action="Ver tudo" />
      </View>
      <View style={styles.section}>
        {MOCK_PROGRESS.records.map((record, index) => (
          <PersonalRecordRow key={index} record={record} />
        ))}
      </View>

      <View style={styles.sectionHead}>
        <SectionHead title="Histórico" />
      </View>
      <View style={styles.section}>
        {MOCK_PROGRESS.history.map((session, index) => (
          <SessionHistoryRow
            key={index}
            session={session}
            isLast={index === MOCK_PROGRESS.history.length - 1}
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
  section: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sectionHead: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  volumeCard: {
    backgroundColor: colors.surface1,
    borderRadius: radii.card,
    padding: 16,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  volumeNum: {
    fontSize: 26,
    fontFamily: fontFamilies.mono,
    color: colors.text,
  },
  volumeDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  deltaText: {
    fontSize: 13,
    fontFamily: fontFamilies.mono,
    color: colors.accent,
  },
  spacer: {
    height: 80,
  },
})
