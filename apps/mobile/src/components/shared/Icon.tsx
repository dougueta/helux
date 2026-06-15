import React from 'react'
import Svg, { Path } from 'react-native-svg'

const ICONS: Record<string, string> = {
  home: 'M4 11.5 12 4l8 7.5M6 10v9h12v-9',
  dumbbell: 'M6.5 9v6M9.5 7.5v9M14.5 7.5v9M17.5 9v6M9.5 12h5M4.5 11v2M19.5 11v2',
  dna: 'M8 3c0 5 8 7 8 12s-8 6-8 9M16 3c0 5-8 7-8 12s8 6 8 9M8.5 7h7M7.5 12h9M8.5 17h7',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8',
  play: 'M7 4.5v15l13-7.5z',
  pause: 'M9 5v14M15 5v14',
  check: 'M5 12.5 10 17.5 19.5 7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  timer: 'M12 8v5l3 2M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9 3h6',
  swap: 'M7 7h11l-3-3M17 17H6l3 3',
  flame: 'M12 3c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 1-2-1-4-1-8z',
  chevron: 'M9 6l6 6-6 6',
  chevronUp: 'M6 14l6-6 6 6',
  bolt: 'M13 3 5 13h6l-1 8 8-10h-6z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  trophy: 'M7 5h10v3a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 14h6M10 17h4M9 20h6',
  clock: 'M12 8v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  arrowUp: 'M12 19V5M6 11l6-6 6 6',
  spark: 'M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5',
}

interface IconProps {
  name: string
  size?: number
  stroke?: string
  fill?: string
}

export default function Icon({ name, size = 22, stroke = 'currentColor', fill = 'none' }: IconProps) {
  const d = ICONS[name] ?? ''
  const isSolid = name === 'play'

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isSolid ? stroke : fill}
      stroke={isSolid ? 'none' : stroke}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={d} />
    </Svg>
  )
}
