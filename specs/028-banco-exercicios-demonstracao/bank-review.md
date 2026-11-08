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
