import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radii, fontFamilies } from '@/constants/theme'
import Ring from '@/components/shared/Ring'
import HelixMark from '@/components/shared/HelixMark'

interface DnaHeroProps {
  score: number
  summary: string
}

export function DnaHero({ score, summary }: DnaHeroProps) {
  return (
    <View style={styles.card}>
      <View style={styles.helixWrap}>
        <HelixMark size={120} stroke={colors.accentSoft} />
      </View>
      <Ring size={108} sw={9} value={score}>
        <Text style={styles.scoreText}>{score}</Text>
        <Text style={styles.scoreLabel}>índice</Text>
      </Ring>
      <Text style={styles.summary}>{summary}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radii.card,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  helixWrap: {
    position: 'absolute',
    top: '50%',
    right: 16,
    opacity: 0.3,
    transform: [{ translateY: -60 }],
  },
  scoreText: {
    fontSize: 34,
    fontFamily: fontFamilies.mono,
    color: colors.text,
    lineHeight: 38,
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
  },
  summary: {
    fontSize: 14,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
})
