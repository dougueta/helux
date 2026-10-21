import type {
  AgentKey,
  ConversationFact,
  Equipment,
  FactCategory,
  GuidanceKind,
  GuidanceStatus,
  MesocycleSession,
  ProposalKind,
  ProposalStatus,
  SessionChange,
  SessionEdit,
  SharedGuidance,
  TrainingLocation,
  TrainingPreferences,
  TrainingStyle,
  WorkoutAdjustmentProposal,
} from '@helux/types'

// Linhas do Supabase (snake_case) ↔ tipos de domínio da spec 022.

export interface PreferencesRow {
  available_days: number[]
  max_session_minutes: number | null
  location: TrainingLocation | null
  available_equipment: Equipment[]
  favorite_exercises: string[]
  exercises_to_avoid: string[]
  priority_muscle_groups: string[]
  training_style: TrainingStyle | null
  free_instructions: string | null
  updated_at: string
}

export const EMPTY_PREFERENCES: TrainingPreferences = {
  availableDays: [],
  maxSessionMinutes: null,
  location: null,
  availableEquipment: [],
  favoriteExercises: [],
  exercisesToAvoid: [],
  priorityMuscleGroups: [],
  trainingStyle: null,
  freeInstructions: null,
  updatedAt: null,
}

export function toPreferences(row: PreferencesRow | null): TrainingPreferences {
  if (!row) return EMPTY_PREFERENCES
  return {
    availableDays: row.available_days ?? [],
    maxSessionMinutes: row.max_session_minutes,
    location: row.location,
    availableEquipment: row.available_equipment ?? [],
    favoriteExercises: row.favorite_exercises ?? [],
    exercisesToAvoid: row.exercises_to_avoid ?? [],
    priorityMuscleGroups: row.priority_muscle_groups ?? [],
    trainingStyle: row.training_style,
    freeInstructions: row.free_instructions,
    updatedAt: row.updated_at,
  }
}

export interface GuidanceRow {
  id: string
  kind: GuidanceKind
  text: string
  reason: string
  origin_agent: AgentKey
  status: GuidanceStatus
  starts_at: string | null
  expires_at: string | null
  duration_days: number | null
  blocked_patterns: string[] | null
  blocked_exercises: string[] | null
  conflicts_with?: string | null
  created_at: string
}

export function toGuidance(row: GuidanceRow): SharedGuidance {
  return {
    id: row.id,
    kind: row.kind,
    text: row.text,
    reason: row.reason,
    originAgent: row.origin_agent,
    status: row.status,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    durationDays: row.duration_days,
    blockedPatterns: row.blocked_patterns ?? [],
    blockedExercises: row.blocked_exercises ?? [],
    conflictsWith: row.conflicts_with ?? null,
    createdAt: row.created_at,
  }
}

export interface FactRow {
  id: string
  category: FactCategory
  text: string
  origin_agent: AgentKey
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export function toFact(row: FactRow): ConversationFact {
  return {
    id: row.id,
    category: row.category,
    text: row.text,
    originAgent: row.origin_agent,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  }
}

export interface ProposalRow {
  id: string
  mesocycle_id: string
  kind: ProposalKind
  session_indexes: number[]
  before: MesocycleSession[]
  after: MesocycleSession[]
  changes: SessionChange[]
  reason: string
  status: ProposalStatus
  created_at: string
}

export function toProposal(row: ProposalRow): WorkoutAdjustmentProposal {
  return {
    id: row.id,
    mesocycleId: row.mesocycle_id,
    kind: row.kind,
    sessionIndexes: row.session_indexes,
    before: row.before,
    after: row.after,
    changes: row.changes ?? [],
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
  }
}

export interface SessionEditRow {
  id: string
  session_index: number
  exercise_index: number
  kind: SessionEdit['kind']
  before: SessionEdit['before']
  after: SessionEdit['after']
  safety_override: boolean
  created_at: string
}

export function toSessionEdit(row: SessionEditRow): SessionEdit {
  return {
    id: row.id,
    sessionIndex: row.session_index,
    exerciseIndex: row.exercise_index,
    kind: row.kind,
    before: row.before,
    after: row.after,
    safetyOverride: row.safety_override,
    createdAt: row.created_at,
  }
}
