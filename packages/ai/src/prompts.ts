import { EXERCISE_BANK, type ExerciseBankEntry } from './exercise-bank'

// Catálogo de exercícios no prompt do Agente de Treino. O gerador legado (planner.ts) que usava o resto deste arquivo saiu na spec 024.

export function buildExerciseCatalogSection(): string {
  const byPattern = new Map<string, ExerciseBankEntry[]>()
  for (const entry of EXERCISE_BANK) {
    const list = byPattern.get(entry.pattern) ?? []
    list.push(entry)
    byPattern.set(entry.pattern, list)
  }

  const sections = Array.from(byPattern.entries())
    .map(([pattern, entries]) => `**${pattern}**: ${entries.map((e) => e.name).join(', ')}`)
    .join('\n')

  return `## Catálogo de exercícios

Os exercícios de força vêm só desta lista, com o nome exatamente como aparece (o schema da resposta também confere).

Varie em relação aos exercícios recentes do histórico quando houver alternativa equivalente para o mesmo padrão de movimento, sem trocar o que está funcionando.

${sections}`
}
