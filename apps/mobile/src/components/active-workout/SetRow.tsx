import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, fontFamilies, radii } from '@/constants/theme'
import type { SetState } from '@helux/workouts'
import Icon from '@/components/shared/Icon'

interface Props {
  setNum: number
  state: SetState
  onUpdateW: (w: number) => void
  onUpdateR: (r: number) => void
  onComplete: () => void
}

interface StepperProps {
  value: number
  step: number
  done: boolean
  onChange: (v: number) => void
}

function Stepper({ value, step, done, onChange }: StepperProps) {
  const press = (dir: number) => {
    const next = Math.max(0, Math.round((value + dir * step) * 100) / 100)
    onChange(next)
  }

  return (
    <View style={stepperStyles.container}>
      <TouchableOpacity
        style={[stepperStyles.btn, done && stepperStyles.btnDone]}
        onPress={() => press(-1)}
        activeOpacity={0.7}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Icon name="minus" size={13} stroke={done ? colors.textFaint : colors.textDim} />
      </TouchableOpacity>
      <Text style={[stepperStyles.value, done && stepperStyles.valueDone]}>
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </Text>
      <TouchableOpacity
        style={[stepperStyles.btn, done && stepperStyles.btnDone]}
        onPress={() => press(1)}
        activeOpacity={0.7}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Icon name="plus" size={13} stroke={done ? colors.textFaint : colors.textDim} />
      </TouchableOpacity>
    </View>
  )
}

const stepperStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDone: {
    backgroundColor: 'transparent',
  },
  value: {
    fontFamily: fontFamilies.mono,
    fontSize: 15,
    color: colors.text,
    width: 40,
    textAlign: 'center',
  },
  valueDone: {
    color: colors.textFaint,
  },
})

export default function SetRow({ setNum, state, onUpdateW, onUpdateR, onComplete }: Props) {
  const { w, r, prev, done } = state

  return (
    <View style={[styles.row, done && styles.rowDone]}>
      {/* Set number */}
      <Text style={[styles.setNo, done && styles.setNoDone]}>
        {setNum}
      </Text>

      {/* Previous */}
      <Text style={styles.prev} numberOfLines={1}>
        {prev || '—'}
      </Text>

      {/* Stepper kg */}
      <Stepper value={w} step={2.5} done={done} onChange={onUpdateW} />

      {/* Stepper reps */}
      <Stepper value={r} step={1} done={done} onChange={onUpdateR} />

      {/* Complete button */}
      <TouchableOpacity
        style={[styles.checkBtn, done && styles.checkBtnDone]}
        onPress={onComplete}
        activeOpacity={0.7}
        disabled={done}
      >
        <Icon
          name="check"
          size={16}
          stroke={done ? colors.accentInk : colors.textFaint}
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 8,
  },
  rowDone: {
    backgroundColor: colors.accentSoft,
  },
  setNo: {
    fontFamily: fontFamilies.mono,
    fontSize: 13,
    color: colors.textFaint,
    width: 18,
    textAlign: 'center',
  },
  setNoDone: {
    color: colors.text,
  },
  prev: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    color: colors.textFaint,
    fontStyle: 'italic',
    width: 72,
    flexShrink: 1,
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
})
