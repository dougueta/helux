import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import Svg, { Line, Circle, Rect } from 'react-native-svg'
import { colors, radii, fontFamilies } from '@/constants/theme'

interface Props {
  motion: string
  implement: string
  tempo?: string
}

// Stick figure rendered as SVG — static placeholder
// In production this would be a GIF/video player
function StickFigure({ motion }: { motion: string }) {
  const isSideView = motion === 'press-flat' || motion === 'press-incline' || motion === 'ext-lying'

  if (isSideView) {
    return (
      <Svg viewBox="0 0 220 250" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* bench */}
        <Rect x={36} y={176} width={150} height={12} rx={6} fill={colors.surface3} stroke={colors.hairline} />
        <Line x1={54} y1={188} x2={54} y2={214} stroke={colors.surface3} strokeWidth={5} strokeLinecap="round" />
        <Line x1={168} y1={188} x2={168} y2={214} stroke={colors.surface3} strokeWidth={5} strokeLinecap="round" />
        {/* body */}
        <Line x1={72} y1={156} x2={150} y2={160} stroke={colors.textDim} strokeWidth={7} strokeLinecap="round" />
        <Line x1={150} y1={160} x2={184} y2={160} stroke={colors.textDim} strokeWidth={7} strokeLinecap="round" />
        <Line x1={184} y1={160} x2={190} y2={186} stroke={colors.textDim} strokeWidth={7} strokeLinecap="round" />
        {/* head */}
        <Circle cx={58} cy={150} r={14} fill="none" stroke={colors.textDim} strokeWidth={7} />
        {/* arm (mid press pose) */}
        <Line x1={104} y1={156} x2={104} y2={118} stroke={colors.text} strokeWidth={7} strokeLinecap="round" />
        <Line x1={104} y1={118} x2={104} y2={90} stroke={colors.text} strokeWidth={7} strokeLinecap="round" />
        <Circle cx={104} cy={118} r={4.5} fill={colors.surface3} />
        {/* implement */}
        <Line x1={91} y1={90} x2={117} y2={90} stroke={colors.accent} strokeWidth={6} strokeLinecap="round" />
        <Circle cx={91} cy={90} r={3.8} fill={colors.accent} />
        <Circle cx={117} cy={90} r={3.8} fill={colors.accent} />
      </Svg>
    )
  }

  // Front view (default)
  return (
    <Svg viewBox="0 0 220 250" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {/* torso */}
      <Line x1={110} y1={80} x2={110} y2={150} stroke={colors.textDim} strokeWidth={7} strokeLinecap="round" />
      <Line x1={84} y1={150} x2={136} y2={150} stroke={colors.textDim} strokeWidth={7} strokeLinecap="round" />
      <Line x1={100} y1={150} x2={98} y2={236} stroke={colors.textDim} strokeWidth={7} strokeLinecap="round" />
      <Line x1={120} y1={150} x2={122} y2={236} stroke={colors.textDim} strokeWidth={7} strokeLinecap="round" />
      {/* head */}
      <Circle cx={110} cy={42} r={15} fill="none" stroke={colors.textDim} strokeWidth={7} />
      {/* shoulders */}
      <Line x1={84} y1={80} x2={136} y2={80} stroke={colors.textDim} strokeWidth={7} strokeLinecap="round" />
      {/* right arm */}
      <Line x1={136} y1={80} x2={168} y2={96} stroke={colors.text} strokeWidth={7} strokeLinecap="round" />
      <Line x1={168} y1={96} x2={176} y2={58} stroke={colors.text} strokeWidth={7} strokeLinecap="round" />
      <Circle cx={168} cy={96} r={4.5} fill={colors.surface3} />
      {/* left arm */}
      <Line x1={84} y1={80} x2={52} y2={96} stroke={colors.text} strokeWidth={7} strokeLinecap="round" />
      <Line x1={52} y1={96} x2={44} y2={58} stroke={colors.text} strokeWidth={7} strokeLinecap="round" />
      <Circle cx={52} cy={96} r={4.5} fill={colors.surface3} />
      {/* implement (barbell across hands) */}
      <Line x1={44} y1={58} x2={176} y2={58} stroke={colors.accent} strokeWidth={6} strokeLinecap="round" />
      <Circle cx={44} cy={58} r={4} fill={colors.accent} />
      <Circle cx={176} cy={58} r={4} fill={colors.accent} />
    </Svg>
  )
}

export default function ExerciseDemo({ motion, implement, tempo }: Props) {
  const recOpacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(recOpacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(recOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [recOpacity])

  return (
    <View style={styles.container}>
      {/* subtle grid background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[styles.gridLineH, { top: (i + 1) * 40 }]}
          />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[styles.gridLineV, { left: (i + 1) * 40 }]}
          />
        ))}
      </View>

      {/* stick figure */}
      <View style={styles.figureArea}>
        <StickFigure motion={motion} />
      </View>

      {/* REC pill — top left */}
      <Animated.View style={[styles.recPill, { opacity: recOpacity }]}>
        <View style={styles.recDot} />
        <Text style={styles.recText}>demonstração</Text>
      </Animated.View>

      {/* Tempo badge — top right */}
      {tempo && (
        <View style={styles.tempoPill}>
          <Text style={styles.tempoText}>{tempo}</Text>
          <Text style={styles.tempoLabel}> tempo</Text>
        </View>
      )}

      {/* Playback controls — bottom */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} activeOpacity={0.7}>
          <Text style={styles.controlBtnText}>Pausar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} activeOpacity={0.7}>
          <Text style={styles.controlBtnText}>Reproduzir</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  figureArea: {
    flex: 1,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.hairline,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.hairline,
  },
  recPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  recText: {
    fontSize: 11,
    color: colors.text,
    fontFamily: fontFamilies.ui,
  },
  tempoPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tempoText: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: fontFamilies.mono,
  },
  tempoLabel: {
    fontSize: 11,
    color: colors.textFaint,
    fontFamily: fontFamilies.ui,
  },
  controls: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  controlBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline2,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  controlBtnText: {
    fontSize: 12,
    color: colors.textDim,
    fontFamily: fontFamilies.ui,
  },
})
