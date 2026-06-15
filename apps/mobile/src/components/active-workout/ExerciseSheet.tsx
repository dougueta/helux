import React, { forwardRef, useCallback, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import type { ActiveExercise } from '@helux/workouts'
import { colors, fontFamilies, radii } from '@/constants/theme'
import MatchBadge from '@/components/shared/MatchBadge'
import ExecutionTab from './ExecutionTab'
import VariantsTab from './VariantsTab'
import Icon from '@/components/shared/Icon'

interface Props {
  exercise: ActiveExercise | null
  activeVariantId?: string
  onSelectVariant: (variantId: string) => void
  onClose: () => void
}

const SNAP_POINTS = ['94%']

export const ExerciseSheet = forwardRef<BottomSheet, Props>(
  ({ exercise, activeVariantId, onSelectVariant, onClose }, ref) => {
    const [tab, setTab] = useState<'execucao' | 'variantes'>('execucao')

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      []
    )

    const handleChange = useCallback(
      (index: number) => {
        if (index === -1) {
          onClose()
        }
      },
      [onClose]
    )

    if (!exercise) return null

    // Active variant for display in header
    const activeVariant =
      exercise.variants.find((v) => v.id === activeVariantId) ??
      exercise.variants.find((v) => v.rec) ??
      exercise.variants[0]

    const equip = activeVariant?.equip ?? ''
    const level = activeVariant?.level ?? ''
    const variantCount = exercise.variants.length

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onChange={handleChange}
        backgroundStyle={[styles.sheetBackground]}
        handleIndicatorStyle={styles.handleIndicator}
      >
        {/* Non-scrollable header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.exerciseName} numberOfLines={1}>
              {activeVariant?.name ?? exercise.name}
            </Text>
            <View style={styles.headerRight}>
              <MatchBadge value={activeVariant?.match ?? exercise.match} size="sm" />
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  if (ref && 'current' in ref) {
                    ref.current?.close()
                  }
                  onClose()
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={18} stroke={colors.textDim} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Chips row */}
          <View style={styles.chipsRow}>
            {exercise.muscle ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{exercise.muscle}</Text>
              </View>
            ) : null}
            {equip ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{equip}</Text>
              </View>
            ) : null}
            {level ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{level}</Text>
              </View>
            ) : null}
          </View>

          {/* Segmented control (tabs) */}
          <View style={styles.segCtrl}>
            <TouchableOpacity
              style={[styles.segBtn, tab === 'execucao' && styles.segBtnActive]}
              onPress={() => setTab('execucao')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segBtnText, tab === 'execucao' && styles.segBtnTextActive]}>
                Execução
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segBtn, tab === 'variantes' && styles.segBtnActive]}
              onPress={() => setTab('variantes')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segBtnText, tab === 'variantes' && styles.segBtnTextActive]}>
                Variantes{' '}
                <Text style={styles.segCount}>{variantCount}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab content */}
        {tab === 'execucao' ? (
          <BottomSheetScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <ExecutionTab exercise={exercise} activeVariantId={activeVariantId} />
          </BottomSheetScrollView>
        ) : (
          <BottomSheetScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <VariantsTab
              variants={exercise.variants}
              activeVariantId={activeVariantId}
              onApply={(variantId) => {
                onSelectVariant(variantId)
                if (ref && 'current' in ref) {
                  ref.current?.close()
                }
              }}
            />
          </BottomSheetScrollView>
        )}
      </BottomSheet>
    )
  }
)

ExerciseSheet.displayName = 'ExerciseSheet'

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
  },
  handleIndicator: {
    backgroundColor: colors.hairline2,
    width: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  exerciseName: {
    flex: 1,
    fontSize: 18,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: colors.surface2,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipText: {
    fontSize: 13,
    color: colors.textDim,
    fontFamily: fontFamilies.ui,
  },
  segCtrl: {
    flexDirection: 'row',
    gap: 6,
  },
  segBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segBtnActive: {
    backgroundColor: colors.surface2,
    borderColor: colors.accentLine,
  },
  segBtnText: {
    fontSize: 14,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
  },
  segBtnTextActive: {
    color: colors.accent,
    fontFamily: fontFamilies.uiSemiBold,
  },
  segCount: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
})
