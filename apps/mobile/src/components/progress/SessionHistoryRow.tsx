import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, fontFamilies } from '@/constants/theme'

interface SessionHistory {
  name: string
  date: string
  volume: string
  sets: number
  dur: number
}

interface SessionHistoryRowProps {
  session: SessionHistory
  isLast?: boolean
}

export function SessionHistoryRow({ session, isLast = false }: SessionHistoryRowProps) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.date}>{session.date}</Text>
      <View style={styles.content}>
        <Text style={styles.name}>{session.name}</Text>
        <Text style={styles.meta}>
          {session.sets} séries · {session.dur} min
        </Text>
      </View>
      <Text style={styles.volume}>{session.volume}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  date: {
    fontSize: 13,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
    width: 50,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontFamily: fontFamilies.ui,
    fontWeight: '500',
    color: colors.text,
  },
  meta: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
    marginTop: 2,
  },
  volume: {
    fontSize: 14,
    fontFamily: fontFamilies.mono,
    color: colors.text,
  },
})
