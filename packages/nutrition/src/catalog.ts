import type { FoodGroup, FoodItem, FoodTag } from '@helux/types'

// Spec 018 (R7) — catálogo próprio de alimentos. Valores por porção de
// referência, aproximados da Tabela TACO (UNICAMP). É a única fonte de
// alimentos do plano do dia e da troca rápida: o filtro de lactose é feito
// pela tag `contem-lactose`.

function food(
  id: string,
  name: string,
  group: FoodGroup,
  grams: number,
  household: string,
  [kcal, proteinG, carbsG, fatG]: [number, number, number, number],
  tags: FoodTag[] = [],
): FoodItem {
  return { id, name, group, portion: { grams, household }, macros: { kcal, proteinG, carbsG, fatG }, tags }
}

export const FOOD_CATALOG: FoodItem[] = [
  // ---- proteína ----
  food('frango-peito', 'Peito de frango grelhado', 'proteina', 100, '1 filé médio', [159, 32.0, 0, 2.5], ['rico-b6']),
  food('patinho', 'Patinho grelhado', 'proteina', 100, '1 bife médio', [219, 35.9, 0, 7.3], ['rico-b6']),
  food('lombo-suino', 'Lombo suíno assado', 'proteina', 100, '2 fatias médias', [210, 35.7, 0, 6.4], ['rico-b6']),
  food('ovo', 'Ovo cozido', 'proteina', 50, '1 unidade', [73, 6.6, 0.3, 4.8], ['fonte-vitamina-d']),
  food('salmao', 'Salmão grelhado', 'proteina', 100, '1 posta pequena', [229, 23.9, 0, 14.0], ['fonte-vitamina-d', 'anti-inflamatorio', 'rico-b6']),
  food('sardinha', 'Sardinha em lata (com espinhas)', 'proteina', 60, '½ lata', [137, 13.0, 0, 9.4], ['fonte-vitamina-d', 'fonte-calcio-nao-lactea', 'anti-inflamatorio']),
  food('atum', 'Atum em lata (em água)', 'proteina', 60, '½ lata', [70, 15.6, 0, 0.8], ['rico-b6']),
  food('tilapia', 'Filé de tilápia grelhado', 'proteina', 100, '1 filé', [128, 26.2, 0, 2.7]),
  food('peito-peru', 'Peito de peru', 'proteina', 40, '3 fatias', [44, 7.8, 1.0, 0.9]),
  food('tofu', 'Tofu firme', 'proteina', 100, '1 fatia grossa', [76, 8.1, 1.9, 4.2], ['vegetal', 'fonte-calcio-nao-lactea']),
  food('whey-isolado', 'Whey protein isolado zero lactose', 'proteina', 30, '1 scoop', [114, 25.5, 1.5, 0.6], ['zero-lactose', 'rapida-digestao']),
  food('proteina-ervilha', 'Proteína de ervilha', 'proteina', 30, '1 scoop', [113, 24.0, 1.5, 1.5], ['vegetal', 'rapida-digestao']),
  food('iogurte-zero', 'Iogurte natural zero lactose', 'proteina', 170, '1 pote', [87, 7.1, 9.5, 2.2], ['zero-lactose']),
  food('iogurte-integral', 'Iogurte natural integral', 'proteina', 170, '1 pote', [100, 6.5, 8.0, 5.1], ['contem-lactose']),
  food('queijo-minas', 'Queijo minas frescal', 'proteina', 30, '1 fatia', [79, 5.2, 1.0, 6.1], ['contem-lactose']),
  food('whey-concentrado', 'Whey concentrado', 'proteina', 30, '1 scoop', [120, 24.0, 3.0, 1.5], ['contem-lactose', 'rapida-digestao']),

  // ---- carboidrato ----
  food('arroz-branco', 'Arroz branco', 'carboidrato', 100, '4 colheres de sopa', [128, 2.5, 28.1, 0.2], ['rapida-digestao']),
  food('arroz-integral', 'Arroz integral', 'carboidrato', 100, '4 colheres de sopa', [124, 2.6, 25.8, 1.0]),
  food('feijao', 'Feijão carioca', 'carboidrato', 86, '1 concha', [65, 4.1, 11.7, 0.4], ['vegetal']),
  food('lentilha', 'Lentilha cozida', 'carboidrato', 100, '½ concha cheia', [93, 6.3, 16.3, 0.5], ['vegetal']),
  food('grao-de-bico', 'Grão-de-bico cozido', 'carboidrato', 100, '4 colheres de sopa', [164, 8.9, 27.4, 2.6], ['vegetal', 'rico-b6']),
  food('batata-doce', 'Batata-doce cozida', 'carboidrato', 100, '1 unidade pequena', [77, 0.6, 18.4, 0.1], ['rico-b6']),
  food('batata', 'Batata inglesa cozida', 'carboidrato', 100, '1 unidade média', [52, 1.2, 11.9, 0], ['rico-b6']),
  food('mandioca', 'Mandioca cozida', 'carboidrato', 100, '2 pedaços', [125, 0.6, 30.1, 0.3]),
  food('macarrao', 'Macarrão cozido', 'carboidrato', 100, '1 pegador', [102, 3.4, 19.9, 1.2]),
  food('pao-frances', 'Pão francês', 'carboidrato', 50, '1 unidade', [150, 4.0, 29.3, 1.6], ['rapida-digestao']),
  food('pao-integral', 'Pão integral', 'carboidrato', 50, '2 fatias', [127, 4.7, 24.9, 1.7]),
  food('aveia', 'Aveia em flocos', 'carboidrato', 30, '3 colheres de sopa', [118, 4.2, 20.0, 2.6]),
  food('tapioca', 'Tapioca (goma hidratada)', 'carboidrato', 50, '1 tapioca média', [120, 0, 30.0, 0], ['rapida-digestao']),
  food('cuscuz', 'Cuscuz de milho', 'carboidrato', 100, '1 fatia média', [113, 2.2, 25.3, 0.7]),

  // ---- gordura ----
  food('azeite', 'Azeite de oliva', 'gordura', 10, '1 colher de sopa', [88, 0, 0, 10.0], ['anti-inflamatorio']),
  food('abacate', 'Abacate', 'gordura', 100, '4 colheres de sopa', [96, 1.2, 6.0, 8.4], ['anti-inflamatorio']),
  food('castanha-para', 'Castanha-do-pará', 'gordura', 10, '2 unidades', [64, 1.5, 1.5, 6.3]),
  food('amendoim', 'Amendoim torrado', 'gordura', 20, '1 colher de sopa cheia', [117, 4.4, 3.7, 10.0]),
  food('pasta-amendoim', 'Pasta de amendoim integral', 'gordura', 15, '1 colher de sopa', [93, 3.8, 3.0, 7.6]),
  food('tahine', 'Tahine (pasta de gergelim)', 'gordura', 15, '1 colher de sopa', [89, 2.6, 3.2, 8.0], ['fonte-calcio-nao-lactea']),
  food('gergelim', 'Gergelim', 'gordura', 10, '1 colher de sopa', [58, 2.1, 2.2, 5.0], ['fonte-calcio-nao-lactea']),
  food('amendoas', 'Amêndoas', 'gordura', 15, '10 unidades', [87, 3.2, 3.0, 7.5], ['fonte-calcio-nao-lactea']),
  food('pistache', 'Pistache', 'gordura', 15, '1 punhado', [85, 3.0, 4.2, 6.8], ['rico-b6']),
  food('chia', 'Semente de chia', 'gordura', 10, '1 colher de sopa', [49, 1.7, 4.2, 3.1], ['anti-inflamatorio', 'fonte-calcio-nao-lactea']),
  food('manteiga', 'Manteiga', 'gordura', 10, '1 colher de chá cheia', [73, 0.1, 0, 8.2], ['contem-lactose']),

  // ---- fruta / vegetal ----
  food('banana', 'Banana prata', 'fruta-vegetal', 70, '1 unidade', [69, 0.9, 18.2, 0.1], ['rico-b6', 'rapida-digestao']),
  food('maca', 'Maçã', 'fruta-vegetal', 130, '1 unidade', [73, 0.4, 19.9, 0.1]),
  food('mamao', 'Mamão papaia', 'fruta-vegetal', 150, '1 fatia', [60, 0.8, 15.6, 0.2]),
  food('laranja', 'Laranja', 'fruta-vegetal', 140, '1 unidade', [52, 1.3, 12.9, 0.1]),
  food('morango', 'Morango', 'fruta-vegetal', 100, '10 unidades', [30, 0.9, 6.8, 0.3], ['anti-inflamatorio']),
  food('brocolis', 'Brócolis cozido', 'fruta-vegetal', 100, '1 xícara', [25, 2.1, 4.4, 0.5], ['fonte-calcio-nao-lactea', 'anti-inflamatorio']),
  food('couve', 'Couve refogada', 'fruta-vegetal', 50, '2 colheres de sopa', [45, 0.9, 4.3, 3.0], ['fonte-calcio-nao-lactea']),
  food('folhas', 'Salada de folhas', 'fruta-vegetal', 50, '1 prato raso', [8, 0.6, 1.4, 0.1]),
  food('tomate', 'Tomate', 'fruta-vegetal', 80, '1 unidade', [12, 0.9, 2.5, 0.2]),
  food('cenoura', 'Cenoura crua', 'fruta-vegetal', 50, '½ xícara ralada', [17, 0.4, 3.9, 0.1]),
  food('abobora', 'Abóbora cabotiá cozida', 'fruta-vegetal', 100, '2 pedaços', [48, 1.4, 10.8, 0.7]),
  food('espinafre', 'Espinafre refogado', 'fruta-vegetal', 50, '2 colheres de sopa', [34, 1.4, 2.1, 2.4]),

  // ---- bebida ----
  food('agua-coco', 'Água de coco', 'bebida', 200, '1 copo', [44, 0, 10.6, 0], ['rapida-digestao']),
  food('cafe', 'Café sem açúcar', 'bebida', 50, '1 xícara', [2, 0.1, 0.3, 0], ['cafeina']),
  food('cha-verde', 'Chá verde', 'bebida', 200, '1 xícara grande', [2, 0, 0.4, 0], ['cafeina', 'anti-inflamatorio']),
  food('bebida-soja', 'Bebida de soja enriquecida com cálcio', 'bebida', 200, '1 copo', [80, 6.6, 5.0, 3.6], ['vegetal', 'fonte-calcio-nao-lactea', 'fonte-vitamina-d']),
  food('bebida-amendoas', 'Bebida de amêndoas enriquecida com cálcio', 'bebida', 200, '1 copo', [34, 1.0, 1.2, 2.8], ['vegetal', 'fonte-calcio-nao-lactea', 'fonte-vitamina-d']),
  food('leite-zero', 'Leite zero lactose semidesnatado', 'bebida', 200, '1 copo', [92, 6.2, 9.4, 3.2], ['zero-lactose']),
  food('suco-laranja', 'Suco de laranja natural', 'bebida', 200, '1 copo', [90, 1.4, 20.4, 0.2], ['rapida-digestao']),
  food('leite-integral', 'Leite integral', 'bebida', 200, '1 copo', [123, 6.1, 9.2, 6.8], ['contem-lactose']),
]

const BY_ID = new Map(FOOD_CATALOG.map(f => [f.id, f]))

export function foodById(id: string): FoodItem | undefined {
  return BY_ID.get(id)
}
