import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, fontFamilies } from '@/constants/theme'
import Icon from '@/components/shared/Icon'

interface PersonalRecord {
  lift: string
  value: string
  delta: string
  when: string
  up: boolean
}

interface PersonalRecordRowProps {
  record: PersonalRecord
}

export function PersonalRecordRow({ record }: PersonalRecordRowProps) {
  return (
    <View style={styles.row}>
      <Icon
        name="trophy"
        size={18}
        stroke={record.up ? colors.accent : colors.textFaint}
      />
      <View style={styles.content}>
        <Text style={styles.lift}>{record.lift}</Text>
        <Text style={styles.when}>{record.when}</Text>
      </View>
      <Text style={styles.value}>{record.value}</Text>
      {record.up && record.delta !== '+0' && (
        <Text style={styles.delta}>{record.delta}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
  },
  lift: {
    fontSize: 14,
    fontFamily: fontFamilies.uiSemiBold,
    color: colors.text,
  },
  when: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
    marginTop: 2,
  },
  value: {
    fontSize: 14,
    fontFamily: fontFamilies.mono,
    color: colors.text,
  },
  delta: {
    fontSize: 13,
    fontFamily: fontFamilies.mono,
    color: colors.accent,
    marginLeft: 4,
  },
})
