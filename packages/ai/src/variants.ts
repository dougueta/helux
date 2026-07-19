import type { GeneticProfile, Variant } from '@helux/types'
import { EXERCISE_BANK, type ExerciseBankEntry } from './exercise-bank'

type Equipment = ExerciseBankEntry['equipment']

const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barra: 'Barra',
  halteres: 'Halteres',
  'maquina-cabo': 'Máquina',
  'peso-corporal': 'Peso corporal',
}

const EQUIPMENT_LEVEL: Record<Equipment, string> = {
  barra: 'Avançado',
  halteres: 'Intermediário',
  'maquina-cabo': 'Iniciante',
  'peso-corporal': 'Iniciante',
}

const EQUIPMENT_IMPLEMENT: Record<Equipment, string> = {
  barra: 'barbell',
  halteres: 'dumbbell',
  'maquina-cabo': 'cable',
  'peso-corporal': 'machine',
}

// Genetic-fit scoring rules (deterministic, no LLM):
// base 70, plus a predisposição bonus per equipment, plus a recovery bonus,
// plus a joint/tendon-risk adjustment, clamped to [50, 99].
const FORCA_BONUS: Record<Equipment, number> = { barra: 18, halteres: 12, 'maquina-cabo': 4, 'peso-corporal': 0 }
const ENDURANCE_BONUS: Record<Equipment, number> = { barra: 2, halteres: 8, 'maquina-cabo': 12, 'peso-corporal': 16 }
const BAIXA_RECOVERY_BONUS: Record<Equipment, number> = { barra: -4, halteres: 0, 'maquina-cabo': 8, 'peso-corporal': 4 }
const JOINT_RISK_BONUS: Record<Equipment, number> = { barra: -10, halteres: 0, 'maquina-cabo': 10, 'peso-corporal': 6 }

const JOINT_RISK_PATTERN = /joelho|ombro|tend[ãa]o|tendinite|articula|ligamento/i

function hasJointRisk(alertas: string[]): boolean {
  return alertas.some((alerta) => JOINT_RISK_PATTERN.test(alerta))
}

function scoreEquipment(equipment: Equipment, profile: GeneticProfile): number {
  let score = 70

  if (profile.predisposicao === 'forca') score += FORCA_BONUS[equipment]
  else if (profile.predisposicao === 'endurance') score += ENDURANCE_BONUS[equipment]
  else score += 8 // misto: neutral bump, ranking driven by recovery/joint-risk rules instead

  if (profile.recuperacaoMuscular === 'baixa') score += BAIXA_RECOVERY_BONUS[equipment]
  else if (profile.recuperacaoMuscular === 'alta' && equipment === 'barra') score += 4

  if (hasJointRisk(profile.alertas)) score += JOINT_RISK_BONUS[equipment]

  return Math.max(50, Math.min(99, score))
}

function buildWhy(equipment: Equipment, profile: GeneticProfile): string {
  if (hasJointRisk(profile.alertas) && (equipment === 'maquina-cabo' || equipment === 'peso-corporal')) {
    return 'Trajetória mais controlada reduz o estresse nas articulações sinalizadas nos seus alertas.'
  }
  if (profile.predisposicao === 'forca' && (equipment === 'barra' || equipment === 'halteres')) {
    return 'Cargas altas casam com seu perfil de força.'
  }
  if (profile.predisposicao === 'endurance' && (equipment === 'maquina-cabo' || equipment === 'peso-corporal')) {
    return 'Padrão mais controlado favorece seu perfil de resistência em séries mais longas.'
  }
  if (profile.recuperacaoMuscular === 'baixa' && equipment === 'maquina-cabo') {
    return 'Menor exigência de estabilização ajuda sua recuperação muscular mais lenta.'
  }
  if (equipment === 'halteres') {
    return 'Maior amplitude e estabilização unilateral; ajuda a corrigir assimetrias.'
  }
  if (equipment === 'maquina-cabo') {
    return 'Trajetória guiada, mais seguro para treinar perto da falha.'
  }
  if (equipment === 'peso-corporal') {
    return 'Sem necessidade de equipamento; ótimo para variar o estímulo sem carga externa.'
  }
  return 'Alternativa de carga livre para variar o estímulo.'
}

// v1 limitation: HELUX_MOTIONS (ported in ExerciseDemo) only has upper-body
// press/pull presets. Patterns with no natural match fall back to 'press-flat'.
function motionFor(pattern: string): string {
  if (pattern === 'empurrar-vertical') return 'press-overhead'
  if (pattern === 'isolamento') return 'pushdown'
  return 'press-flat'
}

function toVariant(entry: ExerciseBankEntry, profile: GeneticProfile, rec: boolean): Variant {
  const variant: Variant = {
    id: entry.id,
    name: entry.name,
    equip: EQUIPMENT_LABEL[entry.equipment],
    level: EQUIPMENT_LEVEL[entry.equipment],
    match: scoreEquipment(entry.equipment, profile),
    motion: motionFor(entry.pattern),
    implement: EQUIPMENT_IMPLEMENT[entry.equipment],
    why: buildWhy(entry.equipment, profile),
  }
  if (rec) variant.rec = true
  return variant
}

export function buildVariants(exerciseName: string, geneticProfile: GeneticProfile): Variant[] {
  const bankEntry = EXERCISE_BANK.find((entry) => entry.name === exerciseName)
  if (!bankEntry) return []

  const seenEquipment = new Set<Equipment>([bankEntry.equipment])
  const uniqueCandidates: ExerciseBankEntry[] = []
  for (const entry of EXERCISE_BANK) {
    if (entry.pattern !== bankEntry.pattern) continue
    if (seenEquipment.has(entry.equipment)) continue
    seenEquipment.add(entry.equipment)
    uniqueCandidates.push(entry)
  }

  const rec = toVariant(bankEntry, geneticProfile, true)
  const others = uniqueCandidates.map((entry) => toVariant(entry, geneticProfile, false))
  const all = [rec, ...others].sort((a, b) => b.match - a.match)

  const topOther = all.find((v) => !v.rec)
  if (topOther && topOther.match > rec.match) {
    topOther.betterFit = true
  }

  return all
}
