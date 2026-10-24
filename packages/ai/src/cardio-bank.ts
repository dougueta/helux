import type { Equipment, StressLevel } from '@helux/types'

// Spec 024 (R6): catálogo de cardio com impacto e carga articular, para validar
// o cardio prescrito contra as condições de saúde (ex.: joelho operado → impacto 0).

export interface CardioBankEntry {
  id: string
  name: string
  /** 0 = sem impacto, 1 = baixo, 2 = alto. */
  impact: StressLevel
  stress: { joelho: StressLevel; ombro: StressLevel; lombar: StressLevel }
  /** Onde dá para fazer: academia (máquina), casa/ao ar livre (peso corporal) ou piscina. */
  setting: 'academia' | 'casa' | 'ao-ar-livre' | 'piscina'
  equipment: Equipment | 'piscina' | 'nenhum'
}

const c = (id: string, name: string, impact: StressLevel, joelho: StressLevel, ombro: StressLevel, lombar: StressLevel, setting: CardioBankEntry['setting'], equipment: CardioBankEntry['equipment']): CardioBankEntry => ({
  id,
  name,
  impact,
  stress: { joelho, ombro, lombar },
  setting,
  equipment,
})

export const CARDIO_BANK: CardioBankEntry[] = [
  c('bike', 'Bike ergométrica', 0, 0, 0, 0, 'academia', 'maquina-cabo'),
  c('bike-intervalado', 'Bike ergométrica intervalada', 0, 1, 0, 0, 'academia', 'maquina-cabo'),
  c('eliptico', 'Elíptico', 0, 0, 0, 0, 'academia', 'maquina-cabo'),
  c('remo', 'Remo ergométrico', 0, 1, 1, 1, 'academia', 'maquina-cabo'),
  c('natacao', 'Natação', 0, 0, 1, 0, 'piscina', 'piscina'),
  c('caminhada', 'Caminhada', 1, 0, 0, 0, 'ao-ar-livre', 'nenhum'),
  c('caminhada-inclinada', 'Caminhada inclinada na esteira', 1, 1, 0, 1, 'academia', 'maquina-cabo'),
  c('escada', 'Escada / stepper', 1, 1, 0, 0, 'academia', 'maquina-cabo'),
  c('corrida-caminhada', 'Corrida alternada com caminhada', 2, 1, 0, 0, 'ao-ar-livre', 'nenhum'),
  c('corrida', 'Corrida', 2, 2, 0, 1, 'ao-ar-livre', 'nenhum'),
  c('circuito-corporal', 'Circuito com o peso do corpo (sem saltos)', 1, 1, 1, 0, 'casa', 'peso-corporal'),
]

const BY_ID = new Map(CARDIO_BANK.map(e => [e.id, e]))
const BY_NAME = new Map(CARDIO_BANK.map(e => [e.name, e]))

/** Modalidade de cardio pelo id ou pelo nome. */
export function findCardio(idOrName: string): CardioBankEntry | undefined {
  return BY_ID.get(idOrName) ?? BY_NAME.get(idOrName)
}
