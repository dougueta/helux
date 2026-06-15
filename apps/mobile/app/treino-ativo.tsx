import React, { useReducer, useEffect, useRef, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  startSession,
  logSet,
  completeSet,
  swapVariant,
  addSet,
  finishSession,
  saveSession,
  loadSession,
  clearSession,
} from '@helux/workouts'
import type { ActiveSession, WorkoutSummary } from '@helux/workouts'
import { MOCK_SESSION } from '@/data/mock'
import { colors, fontFamilies } from '@/constants/theme'
import ExerciseProgressSegments from '@/components/active-workout/ExerciseProgressSegments'
import ExerciseHeader from '@/components/active-workout/ExerciseHeader'
import SetTable from '@/components/active-workout/SetTable'
import RestTimerBanner from '@/components/active-workout/RestTimerBanner'
import WorkoutCompletionScreen from '@/components/active-workout/WorkoutCompletionScreen'
import Icon from '@/components/shared/Icon'

// ── Types ──────────────────────────────────────────────────────

interface RestState {
  active: boolean
  left: number
  total: number
}

interface ActiveScreenState {
  session: ActiveSession
  idx: number
  rest: RestState
  sheetOpen: boolean
  finished: boolean
}

type Action =
  | { type: 'LOG_SET'; exId: string; setIdx: number; w: number; r: number }
  | { type: 'COMPLETE_SET'; exId: string; setIdx: number }
  | { type: 'SWAP_VARIANT'; exId: string; variantId: string }
  | { type: 'ADD_SET'; exId: string }
  | { type: 'NAVIGATE'; idx: number }
  | { type: 'OPEN_SHEET' }
  | { type: 'CLOSE_SHEET' }
  | { type: 'START_REST'; total: number }
  | { type: 'TICK_REST' }
  | { type: 'SKIP_REST' }
  | { type: 'EXTEND_REST' }
  | { type: 'FINISH' }
  | { type: 'RESTORE'; session: ActiveSession }

// ── Initial session ────────────────────────────────────────────

const initialSession = startSession(
  MOCK_SESSION.workoutId,
  MOCK_SESSION.workoutName,
  MOCK_SESSION.exercises,
)

const initialState: ActiveScreenState = {
  session: initialSession,
  idx: 0,
  rest: { active: false, left: 0, total: 0 },
  sheetOpen: false,
  finished: false,
}

// ── Reducer ────────────────────────────────────────────────────

function reducer(state: ActiveScreenState, action: Action): ActiveScreenState {
  switch (action.type) {
    case 'LOG_SET':
      return {
        ...state,
        session: logSet(state.session, action.exId, action.setIdx, action.w, action.r),
      }

    case 'COMPLETE_SET': {
      const updatedSession = completeSet(state.session, action.exId, action.setIdx)
      const exercise = updatedSession.exercises.find((e) => e.id === action.exId)
      const restTotal = exercise?.rest ?? 60
      return {
        ...state,
        session: updatedSession,
        rest: { active: true, left: restTotal, total: restTotal },
      }
    }

    case 'SWAP_VARIANT':
      return {
        ...state,
        session: swapVariant(state.session, action.exId, action.variantId),
      }

    case 'ADD_SET':
      return {
        ...state,
        session: addSet(state.session, action.exId),
      }

    case 'NAVIGATE':
      return {
        ...state,
        idx: action.idx,
        rest: { active: false, left: 0, total: 0 },
      }

    case 'OPEN_SHEET':
      return { ...state, sheetOpen: true }

    case 'CLOSE_SHEET':
      return { ...state, sheetOpen: false }

    case 'START_REST':
      return {
        ...state,
        rest: { active: true, left: action.total, total: action.total },
      }

    case 'TICK_REST': {
      const newLeft = state.rest.left - 1
      if (newLeft <= 0) {
        return { ...state, rest: { active: false, left: 0, total: state.rest.total } }
      }
      return { ...state, rest: { ...state.rest, left: newLeft } }
    }

    case 'SKIP_REST':
      return { ...state, rest: { active: false, left: 0, total: state.rest.total } }

    case 'EXTEND_REST': {
      const extended = state.rest.left + 15
      return {
        ...state,
        rest: {
          ...state.rest,
          left: extended,
          total: Math.max(state.rest.total, extended),
        },
      }
    }

    case 'FINISH':
      return { ...state, finished: true }

    case 'RESTORE':
      return { ...state, session: action.session }

    default:
      return state
  }
}

// ── Format helpers ─────────────────────────────────────────────

function fmtElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Main screen ────────────────────────────────────────────────

export default function TreinoAtivo() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const insets = useSafeAreaInsets()
  const startTimeRef = useRef<number>(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [elapsed, setElapsed] = React.useState(0)

  // Session elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Restore persisted session on mount
  useEffect(() => {
    loadSession(AsyncStorage).then((saved) => {
      if (saved) dispatch({ type: 'RESTORE', session: saved })
    })
  }, [])

  // Persist session on every change
  useEffect(() => {
    saveSession(state.session, AsyncStorage)
  }, [state.session])

  // Rest timer interval
  useEffect(() => {
    if (state.rest.active) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK_REST' })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state.rest.active])

  // Compute summary when finished
  const summary = useMemo<WorkoutSummary | null>(() => {
    if (!state.finished) return null
    return finishSession(state.session)
  }, [state.finished, state.session])

  const exercises = state.session.exercises
  const currentExercise = exercises[state.idx]
  const currentSets = state.session.sets[currentExercise.id] ?? []

  // Completed flags for progress bar
  const completedFlags = exercises.map((ex) => {
    const sets = state.session.sets[ex.id] ?? []
    return sets.length > 0 && sets.every((s) => s.done)
  })

  const isFirst = state.idx === 0
  const isLast = state.idx === exercises.length - 1

  const handleNext = () => {
    if (isLast) {
      clearSession(AsyncStorage)
      dispatch({ type: 'FINISH' })
    } else {
      dispatch({ type: 'NAVIGATE', idx: state.idx + 1 })
    }
  }

  const handlePrev = () => {
    if (!isFirst) dispatch({ type: 'NAVIGATE', idx: state.idx - 1 })
  }

  // Show completion overlay
  if (state.finished && summary) {
    return (
      <WorkoutCompletionScreen
        summary={summary}
        onDone={() => router.back()}
      />
    )
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* ── Fixed header ── */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="close" size={20} stroke={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerSub}>
              Exercício {state.idx + 1}/{exercises.length} · {state.session.workoutName}
            </Text>
          </View>

          <Text style={styles.sessionTimer}>{fmtElapsed(elapsed)}</Text>
        </View>
      </SafeAreaView>

      {/* ── Progress segments ── */}
      <View style={styles.segmentsWrap}>
        <ExerciseProgressSegments
          count={exercises.length}
          currentIdx={state.idx}
          completedFlags={completedFlags}
          onPress={(idx) => dispatch({ type: 'NAVIGATE', idx })}
        />
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ExerciseHeader
          exercise={currentExercise}
          onOpenSheet={() => {
            console.log('[TreinoAtivo] Ver execução — ExerciseSheet coming in Phase 4')
          }}
        />

        <SetTable
          exerciseId={currentExercise.id}
          sets={currentSets}
          onLogSet={(exId, setIdx, w, r) =>
            dispatch({ type: 'LOG_SET', exId, setIdx, w, r })
          }
          onCompleteSet={(exId, setIdx) =>
            dispatch({ type: 'COMPLETE_SET', exId, setIdx })
          }
          onAddSet={(exId) => dispatch({ type: 'ADD_SET', exId })}
        />
      </ScrollView>

      {/* ── Rest timer (absolute above footer) ── */}
      <RestTimerBanner
        rest={state.rest}
        onExtend={() => dispatch({ type: 'EXTEND_REST' })}
        onSkip={() => dispatch({ type: 'SKIP_REST' })}
      />

      {/* ── Footer ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {/* Previous button */}
        {!isFirst && (
          <TouchableOpacity style={styles.prevBtn} onPress={handlePrev} activeOpacity={0.7}>
            <Icon name="chevron" size={18} stroke={colors.textDim} />
            <Text style={styles.prevBtnText}>Anterior</Text>
          </TouchableOpacity>
        )}

        {/* Next / Finish button */}
        <TouchableOpacity
          style={[styles.nextBtn, isLast && styles.nextBtnFinish]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? 'Finalizar treino' : 'Próximo exercício'}
          </Text>
          <Icon
            name={isLast ? 'check' : 'chevron'}
            size={18}
            stroke={colors.accentInk}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────

const FOOTER_HEIGHT = 64

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerSafeArea: {
    backgroundColor: colors.bg,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSub: {
    fontSize: 14,
    color: colors.textDim,
    fontFamily: fontFamilies.ui,
    textAlign: 'center',
  },
  sessionTimer: {
    fontFamily: fontFamilies.mono,
    fontSize: 14,
    color: colors.textDim,
    width: 48,
    textAlign: 'right',
  },
  segmentsWrap: {
    paddingVertical: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: FOOTER_HEIGHT + 16,
  },
  footer: {
    height: FOOTER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.bg,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline2,
  },
  prevBtnText: {
    fontSize: 14,
    color: colors.textDim,
    fontFamily: fontFamilies.ui,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface2,
    borderRadius: 14,
    paddingVertical: 12,
  },
  nextBtnFinish: {
    backgroundColor: colors.accent,
  },
  nextBtnText: {
    fontSize: 15,
    fontFamily: fontFamilies.uiBold,
    color: colors.accentInk,
  },
})
