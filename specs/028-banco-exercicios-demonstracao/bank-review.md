# Revisão do banco de exercícios (028)

Registro de toda correção de classificação ou de dados do banco (FR-016). Mudança de `pattern`, `muscleGroup` ou `stress` também exige teste de regressão (FR-017). Nenhum nome é alterado (R3), e `equipment` e `muscleGroup` mantêm o significado (R4).

| id | campo | antes | depois | justificativa |
|:---|:---|:---|:---|:---|
| pullover-halteres | muscles | primário dorsal; secundário bíceps | primário dorsal e peito; secundário tríceps e core | O pullover é extensão de ombro com cotovelo quase fixo: o bíceps não participa, e o peitoral maior divide o trabalho com o dorsal. O secundário vinha do padrão `puxar-vertical`. |
| russian-twist-halteres | muscles | primário core; secundário nenhum | igual | Conferido. Os oblíquos ficam em `core`. |
| cadeira-adutora | muscles | primário quadríceps | primário adutores | O mapa antigo não tinha adutores e usava o `muscleGroup`. `muscleGroup` continua `quadriceps` para o volume semanal (R4). |
| flexao-pike-corporal | muscles | primário ombro; secundário tríceps | primário ombro; secundário tríceps e core | O core sustenta o quadril alto durante todo o movimento. |
| mesa-flexora | muscles | primário quadríceps | primário posterior de coxa; secundário panturrilha | Erro do mapa antigo, que juntava `posterior` em quadríceps. O gastrocnêmio auxilia a flexão do joelho (FR-015). |
| pullover-halteres, russian-twist-halteres, cadeira-adutora, flexao-pike-corporal, mesa-flexora | gear | — | halteres, halteres, maquina, peso-corporal, maquina | Conferido no piloto; sem correção. |

## Lote 1: Agachar (T058)

Antes, todos os 15 itens tinham o mesmo mapa derivado do padrão `agachar`: primário quadríceps, secundário core. `muscleGroup` continua `quadriceps` em todos (R4), e `pattern` e `stress` não mudam.

| id | campo | antes | depois | justificativa |
|:---|:---|:---|:---|:---|
| agachamento-livre-barra | muscles | quadríceps; core | quadríceps e glúteo; adutores, posterior, lombar e core | Agachamento profundo com a barra nas costas: o glúteo divide a extensão do quadril, e a lombar sustenta o tronco inclinado. |
| agachamento-frontal-barra | muscles | quadríceps; core | quadríceps; glúteo, adutores e core | Tronco mais vertical desloca o trabalho para o quadríceps; o core segura a barra na frente. |
| agachamento-bulgaro-halteres | muscles | quadríceps; core | quadríceps e glúteo; adutores e core | Unilateral com passo longo: glúteo da perna da frente trabalha como primário. |
| afundo-halteres | muscles | quadríceps; core | quadríceps e glúteo; adutores e core | Mesmo raciocínio do búlgaro, com os dois pés no chão. |
| agachamento-goblet-halteres | muscles | quadríceps; core | quadríceps e glúteo; adutores e core | Agachamento profundo e ereto; o halter na frente exige core. |
| leg-press-45 | muscles | quadríceps; core | quadríceps e glúteo; adutores e posterior | Costas apoiadas: o core quase não trabalha. O glúteo e os adutores participam com a flexão profunda do quadril. |
| agachamento-sumo-halteres | muscles | quadríceps; core | quadríceps, adutores e glúteo; posterior | Base larga com os pés para fora recruta mais adutores e glúteo. |
| agachamento-livre-corporal | muscles | quadríceps; core | quadríceps e glúteo; core | Acrescenta o glúteo, que divide a extensão do quadril. |
| afundo-reverso-corporal | muscles | quadríceps; core | glúteo e quadríceps; adutores e core | O passo para trás leva o tronco à frente e aumenta o trabalho do glúteo. |
| agachamento-overhead-barra | muscles | quadríceps; core | quadríceps e glúteo; ombro, trapézio e core | Ombros e trapézio sustentam a barra acima da cabeça durante todo o movimento. |
| step-up-halteres | muscles | quadríceps; core | quadríceps e glúteo; posterior e core | A subida no degrau estende quadril e joelho da perna de cima. |
| agachamento-hack-maquina | muscles | quadríceps; core | quadríceps; glúteo e adutores | Costas apoiadas e pés à frente concentram o trabalho no quadríceps; o core quase não trabalha. |
| pistol-squat-assistido | muscles | quadríceps; core | quadríceps e glúteo; adutores e core | Agachamento profundo numa perna; o core estabiliza a perna livre. |
| agachamento-smith-maquina | muscles | quadríceps; core | quadríceps e glúteo; adutores | A barra guiada reduz a demanda de estabilização do core. |
| agachamento-box-barra | muscles | quadríceps; core | glúteo e quadríceps; posterior e lombar | Canela quase vertical e quadril para trás até a caixa: mais quadril e posterior, com a lombar segurando o tronco inclinado. |
| (lote 1) | gear | — | barra, barra, halteres, halteres, halteres, maquina, halteres, peso-corporal, peso-corporal, barra, halteres, maquina, peso-corporal, smith, barra | Conferido; sem correção. |
| (lote 1) | guidance | dicas com "Bom para…" no goblet e no peso corporal | recomendação movida para `context` | FR-018 e FR-019: passos só com instruções de execução. |
