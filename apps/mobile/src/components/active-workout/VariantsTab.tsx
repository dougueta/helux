import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import type { Variant } from '@helux/workouts'
import { colors, fontFamilies, radii } from '@/constants/theme'
import Icon from '@/components/shared/Icon'

interface Props {
  variants: Variant[]
  activeVariantId?: string
  onApply: (variantId: string) => void
}

export default function VariantsTab({ variants, activeVariantId, onApply }: Props) {
  const recId = variants.find((v) => v.rec)?.id
  const [selectedId, setSelectedId] = useState<string>(activeVariantId ?? recId ?? variants[0]?.id)

  const sortedVariants = [...variants].sort((a, b) => b.match - a.match)

  const hasChanged = selectedId !== activeVariantId
  const isCurrentRec = activeVariantId === recId

  return (
    <View style={styles.container}>
      {/* Variant list — scrolls inside the sheet's BottomSheetScrollView */}
      <View style={styles.list}>
        <Text style={styles.intro}>
          Escolha a variante que vai executar hoje. O Helux ordena pelo{' '}
          <Text style={styles.introBold}>fit genético</Text> com o seu DNA.
        </Text>

        {sortedVariants.map((v) => {
          const isSelected = v.id === selectedId
          const isRec = v.id === recId

          return (
            <TouchableOpacity
              key={v.id}
              style={[styles.variantCard, isSelected && styles.variantCardSelected]}
              onPress={() => setSelectedId(v.id)}
              activeOpacity={0.75}
            >
              {/* Radio + main content + match */}
              <View style={styles.variantRow}>
                {/* Radio */}
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && (
                    <Icon name="check" size={12} stroke={colors.accentInk} />
                  )}
                </View>

                {/* Content */}
                <View style={styles.variantMain}>
                  {/* Name + flags */}
                  <View style={styles.variantTop}>
                    <Text style={styles.variantName}>{v.name}</Text>
                    {isRec && (
                      <View style={styles.flagRec}>
                        <Text style={styles.flagRecText}>Recomendado</Text>
                      </View>
                    )}
                    {v.betterFit && (
                      <View style={styles.flagBetter}>
                        <Icon name="arrowUp" size={11} stroke={colors.accentInk} />
                        <Text style={styles.flagBetterText}>fit maior</Text>
                      </View>
                    )}
                  </View>

                  {/* Equipment + level chips */}
                  <View style={styles.chipRow}>
                    {v.equip ? (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>{v.equip}</Text>
                      </View>
                    ) : null}
                    {v.level ? (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>{v.level}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Why/reason */}
                  {v.why ? (
                    <Text style={styles.variantWhy} numberOfLines={2}>{v.why}</Text>
                  ) : null}
                </View>

                {/* Match score */}
                <View style={styles.matchContainer}>
                  <Text style={styles.matchValue}>{v.match}</Text>
                  <Text style={styles.matchLabel}>fit</Text>
                </View>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Sticky footer */}
      <View style={styles.footer}>
        {hasChanged && (
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => onApply(selectedId)}
            activeOpacity={0.85}
          >
            <Icon name="swap" size={17} stroke={colors.accentInk} />
            <Text style={styles.applyBtnText}>Usar esta variante</Text>
          </TouchableOpacity>
        )}
        {activeVariantId && !isCurrentRec && (
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => {
              if (recId) {
                setSelectedId(recId)
                onApply(recId)
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostBtnText}>Voltar à recomendada</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 8,
  },
  intro: {
    fontSize: 13,
    color: colors.textDim,
    fontFamily: fontFamilies.ui,
    marginBottom: 4,
    lineHeight: 18,
  },
  introBold: {
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
  },
  variantCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface1,
    padding: 14,
  },
  variantCardSelected: {
    backgroundColor: colors.surface2,
    borderColor: colors.accentLine,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.hairline2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  variantMain: {
    flex: 1,
    gap: 6,
  },
  variantTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  variantName: {
    fontSize: 15,
    fontFamily: fontFamilies.uiSemiBold,
    color: colors.text,
    flexShrink: 1,
  },
  flagRec: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  flagRecText: {
    fontSize: 11,
    fontFamily: fontFamilies.ui,
    color: colors.accentInk,
  },
  flagBetter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warn,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  flagBetterText: {
    fontSize: 11,
    fontFamily: fontFamilies.ui,
    color: colors.accentInk,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: colors.surface2,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipText: {
    fontSize: 12,
    color: colors.textDim,
    fontFamily: fontFamilies.ui,
  },
  variantWhy: {
    fontSize: 13,
    color: colors.textDim,
    fontFamily: fontFamilies.ui,
    lineHeight: 18,
  },
  matchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  matchValue: {
    fontSize: 20,
    fontFamily: fontFamilies.mono,
    color: colors.accent,
  },
  matchLabel: {
    fontSize: 10,
    color: colors.textFaint,
    fontFamily: fontFamilies.ui,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 14,
  },
  applyBtnText: {
    fontSize: 15,
    fontFamily: fontFamilies.uiBold,
    color: colors.accentInk,
  },
  ghostBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline2,
  },
  ghostBtnText: {
    fontSize: 14,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
  },
})
