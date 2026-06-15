import React from 'react'
import Svg, { Path, Line } from 'react-native-svg'
import { colors } from '@/constants/theme'

interface HelixMarkProps {
  size?: number
  stroke?: string
}

const RUNGS = [0.16, 0.34, 0.5, 0.66, 0.84]

export default function HelixMark({ size = 28, stroke = colors.accent }: HelixMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M11 3 C 21 9, 21 23, 11 29"
        stroke={stroke}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Path
        d="M21 3 C 11 9, 11 23, 21 29"
        stroke={stroke}
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.55}
      />
      {RUNGS.map((t, i) => {
        const y = 3 + t * 26
        const amp = Math.sin(t * Math.PI) * 5
        return (
          <Line
            key={i}
            x1={16 - amp}
            y1={y}
            x2={16 + amp}
            y2={y}
            stroke={stroke}
            strokeWidth={1.6}
            strokeLinecap="round"
            opacity={0.5}
          />
        )
      })}
    </Svg>
  )
}
