import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { colors, fontFamilies, radii } from '@/constants/theme'
import type { WorkoutSummary } from '@helux/workouts'
import Ring from '@/components/shared/Ring'
import Icon from '@/components/shared/Icon'

interface Props {
  summary: WorkoutSummary
  onDone: () => void
}

export default function WorkoutCompletionScreen({ summary, onDone }: Props) {
  const volumeT = (summary.totalVolumeKg / 1000).toFixed(1)

  return (
    <SafeAreaView style={styles.container}>
      {/* Ring */}
      <View style={styles.ringWrap}>
        <Ring value={100} size={120} sw={10}>
          <Text style={styles.ringLabel}>100%</Text>
        </Ring>
      </View>

      {/* Title */}
      <Text style={styles.title}>Treino concluído!</Text>

      {/* Metrics grid */}
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{summary.totalSets}</Text>
          <Text style={styles.metricKey}>séries</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{summary.durationMinutes}</Text>
          <Text style={styles.metricKey}>minutos</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{volumeT}t</Text>
          <Text style={styles.metricKey}>volume</Text>
        </View>
      </View>

      {/* Personal records */}
      {summary.newRecords.length > 0 && (
        <View style={styles.prsContainer}>
          <Text style={styles.prsTitle}>Novos recordes</Text>
          {summary.newRecords.map((pr, i) => (
            <View key={i} style={styles.prRow}>
              <Icon name="trophy" size={16} stroke={colors.accent} />
              <Text style={styles.prName}>{pr.exerciseName}</Text>
              <Text style={styles.prValue}>{pr.value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
        <Text style={styles.doneBtnText}>Voltar ao início</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  ringWrap: {
    marginBottom: 8,
  },
  ringLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 18,
    color: colors.accent,
  },
  title: {
    fontSize: 26,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
    textAlign: 'center',
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    backgroundColor: colors.surface1,
    borderRadius: radii.card,
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: '100%',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.hairline,
  },
  metricValue: {
    fontFamily: fontFamilies.mono,
    fontSize: 22,
    color: colors.text,
  },
  metricKey: {
    fontSize: 12,
    color: colors.textFaint,
    fontFamily: fontFamilies.ui,
  },
  prsContainer: {
    width: '100%',
    backgroundColor: colors.surface1,
    borderRadius: radii.card,
    padding: 16,
    gap: 10,
  },
  prsTitle: {
    fontSize: 13,
    color: colors.textFaint,
    fontFamily: fontFamilies.ui,
    marginBottom: 4,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontFamily: fontFamilies.ui,
  },
  prValue: {
    fontSize: 14,
    color: colors.accent,
    fontFamily: fontFamilies.mono,
  },
  doneBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: {
    fontSize: 16,
    fontFamily: fontFamilies.uiBold,
    color: colors.accentInk,
  },
})
