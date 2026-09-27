import type { GeneticProfile, Variant } from '@helux/types'
import { EXERCISE_BANK, type ExerciseBankEntry, type Joint } from './exercise-bank'
import { resolveMotion } from './motions'

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
  'peso-corporal': 'bodyweight',
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

// ---- spec 013: articulações sinalizadas e equivalência genética entre padrões ----

const JOINTS: Joint[] = ['joelho', 'ombro', 'lombar']

const JOINT_REGION: Record<Joint, RegExp> = {
  joelho: /joelho|patelar|menisco|cruzado/i,
  ombro: /ombro|manguito/i,
  lombar: /lombar|coluna|h[ée]rnia|disco/i,
}

/**
 * Articulações sinalizadas pelos alertas genéticos (FR-011). Um alerta que cita a
 * região vale para ela; um alerta articular sem região (tendão, ligamento,
 * colágeno…) vale para as três.
 */
export function flaggedJoints(alertas: string[]): Joint[] {
  const flagged = new Set<Joint>()
  for (const alerta of alertas) {
    const regions = JOINTS.filter((joint) => JOINT_REGION[joint].test(alerta))
    if (regions.length > 0) regions.forEach((joint) => flagged.add(joint))
    else if (JOINT_RISK_PATTERN.test(alerta) || /col[áa]geno/i.test(alerta)) JOINTS.forEach((joint) => flagged.add(joint))
  }
  return JOINTS.filter((joint) => flagged.has(joint))
}

/** Pontos de compatibilidade por nível de carga a menos (ou a mais) na articulação sinalizada. */
const JOINT_POINTS_PER_LEVEL = 4

/** Família funcional: padrões que se substituem entre si (FR-012). */
const PATTERN_FAMILY: Record<string, string> = {
  agachar: 'dobrar-quadril',
  'dobrar-quadril': 'agachar',
  'empurrar-horizontal': 'empurrar-vertical',
  'empurrar-vertical': 'empurrar-horizontal',
  'puxar-horizontal': 'puxar-vertical',
  'puxar-vertical': 'puxar-horizontal',
}

const PATTERN_LABEL: Record<string, string> = {
  agachar: 'agachar',
  'dobrar-quadril': 'dobrar o quadril',
  'empurrar-horizontal': 'empurrar na horizontal',
  'empurrar-vertical': 'empurrar na vertical',
  'puxar-horizontal': 'puxar na horizontal',
  'puxar-vertical': 'puxar na vertical',
}

const JOINT_PHRASE: Record<Joint, string> = { joelho: 'no joelho', ombro: 'no ombro', lombar: 'na lombar' }

const MAX_CROSS_PATTERN = 2

function jointAdjustment(original: ExerciseBankEntry, candidate: ExerciseBankEntry, joints: Joint[]): number {
  return joints.reduce((sum, joint) => sum + (original.stress[joint] - candidate.stress[joint]) * JOINT_POINTS_PER_LEVEL, 0)
}

/** Menos carga em ao menos uma articulação sinalizada e mais carga em nenhuma. */
function reducesFlaggedLoad(original: ExerciseBankEntry, candidate: ExerciseBankEntry, joints: Joint[]): boolean {
  if (joints.some((joint) => candidate.stress[joint] > original.stress[joint])) return false
  return joints.some((joint) => candidate.stress[joint] < original.stress[joint])
}

function crossPatternWhy(original: ExerciseBankEntry, candidate: ExerciseBankEntry, joints: Joint[]): string {
  const reduced = joints.filter((joint) => candidate.stress[joint] < original.stress[joint]).map((joint) => JOINT_PHRASE[joint])
  const where = reduced.length > 1 ? `${reduced.slice(0, -1).join(', ')} e ${reduced[reduced.length - 1]}` : reduced[0]
  return `Equivalente a ${PATTERN_LABEL[original.pattern]} com menos carga ${where}, articulação sinalizada no seu perfil genético.`
}

function toVariant(
  entry: ExerciseBankEntry,
  profile: GeneticProfile,
  rec: boolean,
  original: ExerciseBankEntry = entry,
  joints: Joint[] = [],
): Variant {
  const score = scoreEquipment(entry.equipment, profile) + jointAdjustment(original, entry, joints)
  const variant: Variant = {
    id: entry.id,
    name: entry.name,
    equip: EQUIPMENT_LABEL[entry.equipment],
    level: EQUIPMENT_LEVEL[entry.equipment],
    match: Math.max(50, Math.min(99, score)),
    motion: resolveMotion(entry),
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

  const joints = flaggedJoints(geneticProfile.alertas)
  const rec = toVariant(bankEntry, geneticProfile, true)
  const others = uniqueCandidates.map((entry) => toVariant(entry, geneticProfile, false, bankEntry, joints))
  const all = [rec, ...others, ...crossPatternVariants(bankEntry, geneticProfile, joints)].sort((a, b) => b.match - a.match)

  const topOther = all.find((v) => !v.rec)
  if (topOther && topOther.match > rec.match) {
    topOther.betterFit = true
  }

  return all
}

/**
 * Até 2 equivalentes do padrão irmão (FR-012/013): só quando há articulação
 * sinalizada, só candidatos que reduzem a carga nela sem aumentar em outra
 * sinalizada, maior compatibilidade primeiro, sem repetir equipamento.
 */
function crossPatternVariants(original: ExerciseBankEntry, profile: GeneticProfile, joints: Joint[]): Variant[] {
  const sibling = PATTERN_FAMILY[original.pattern]
  if (!sibling || joints.length === 0) return []

  const candidates = EXERCISE_BANK.filter((entry) => entry.pattern === sibling && reducesFlaggedLoad(original, entry, joints))
    .map((entry) => ({ entry, variant: toVariant(entry, profile, false, original, joints) }))
    .sort((a, b) => b.variant.match - a.variant.match)

  const seenEquipment = new Set<Equipment>()
  const picked: Variant[] = []
  for (const { entry, variant } of candidates) {
    if (picked.length >= MAX_CROSS_PATTERN) break
    if (seenEquipment.has(entry.equipment)) continue
    seenEquipment.add(entry.equipment)
    variant.crossPattern = true
    variant.why = crossPatternWhy(original, entry, joints)
    picked.push(variant)
  }
  return picked
}
