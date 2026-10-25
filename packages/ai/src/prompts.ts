import { EXERCISE_BANK, MUSCLE_GROUP_LABEL, type ExerciseBankEntry } from './exercise-bank'

// Catálogo de exercícios no pedido do Agente de Treino. O gerador legado (planner.ts) que usava o resto deste arquivo saiu na spec 024.

/**
 * Catálogo por grupo muscular (024 R17): só os exercícios que as restrições do
 * usuário permitem, agrupados pelo músculo principal, que é como o método conta
 * as séries.
 */
export function buildExerciseCatalogSection(entries: ExerciseBankEntry[] = EXERCISE_BANK): string {
  const byGroup = new Map<string, ExerciseBankEntry[]>()
  for (const entry of entries) {
    const list = byGroup.get(entry.muscleGroup) ?? []
    list.push(entry)
    byGroup.set(entry.muscleGroup, list)
  }

  const sections = Array.from(byGroup.entries())
    .map(([group, list]) => `**${MUSCLE_GROUP_LABEL[group] ?? group}**: ${list.map((e) => e.name).join(', ')}`)
    .join('\n')

  return `## Catálogo de exercícios

Os exercícios de força vêm só desta lista, com o nome exatamente como aparece. Ela já exclui o que as restrições e as condições de saúde do usuário proíbem (equipamento, bloqueios, carga articular); o schema da resposta só aceita estes nomes. Cada exercício conta séries para o grupo em que aparece.

Varie em relação aos exercícios recentes do histórico quando houver alternativa equivalente para o mesmo padrão de movimento, sem trocar o que está funcionando.

${sections}`
}
