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

## Lote 2: Dobrar o quadril (T059)

Antes, os 15 itens tinham primário quadríceps e secundário core. O mapa antigo convertia `gluteo` e `posterior` em quadríceps, então nenhum deles mostrava glúteo nem posterior de coxa. `muscleGroup` (`gluteo` ou `posterior`), `pattern` e `stress` não mudam (R4).

| id | campo | antes | depois | justificativa |
|:---|:---|:---|:---|:---|
| levantamento-terra-barra | muscles | quadríceps; core | posterior e glúteo; lombar, quadríceps, trapézio e antebraço | Extensão de quadril com a barra do chão; o quadríceps ajuda na saída, e a pegada e o trapézio seguram a carga. |
| levantamento-terra-romeno-barra | muscles | quadríceps; core | posterior e glúteo; lombar e antebraço | Joelhos quase fixos: o trabalho é do quadril. |
| levantamento-terra-romeno-halteres | muscles | quadríceps; core | posterior e glúteo; lombar e antebraço | Igual à versão com barra. |
| levantamento-terra-sumo-barra | muscles | quadríceps; core | glúteo, posterior e adutores; quadríceps, lombar e trapézio | Base larga recruta adutores e deixa o tronco mais ereto. |
| stiff-barra | muscles | quadríceps; core | posterior; glúteo e lombar | Joelhos quase estendidos alongam mais o posterior de coxa. |
| stiff-halteres | muscles | quadríceps; core | posterior; glúteo e lombar | Igual à versão com barra. |
| good-morning-barra | muscles | quadríceps; core | posterior e lombar; glúteo e core | A barra nas costas e o tronco perto da horizontal exigem muito dos eretores. |
| terra-halteres-unilateral | muscles | quadríceps; core | posterior e glúteo; abdutores e core | Os abdutores do quadril de apoio mantêm a pelve nivelada. |
| kettlebell-swing | muscles | quadríceps; core | glúteo e posterior; lombar, core e ombro | Extensão explosiva do quadril; o ombro só conduz o peso. |
| pull-through-cabo | muscles | quadríceps; core | glúteo e posterior; lombar | Dobradiça com resistência horizontal, sem trabalho de joelho. |
| elevacao-pelvica-barra | muscles | quadríceps; core | glúteo; posterior, adutores e core | Extensão de quadril com joelho dobrado concentra o trabalho no glúteo. |
| elevacao-pelvica-maquina | muscles | quadríceps; core | glúteo; posterior e adutores | Igual à versão com barra, com o encosto estabilizando o tronco. |
| elevacao-pelvica-corporal | muscles | quadríceps; core | glúteo; posterior e core | Ponte no solo. |
| elevacao-pelvica-unilateral | muscles | quadríceps; core | glúteo; posterior, abdutores e core | Numa perna só, os abdutores seguram a pelve nivelada. |
| hiperextensao-lombar-banco | muscles | quadríceps; core | lombar e glúteo; posterior | Extensão do tronco no banco romano. |
| (lote 2) | gear | — | conferido | Sem correção: kettlebell, cabo, máquina e banco já estavam certos. |
| (lote 2) | guidance | recomendações nos passos de 5 itens ("Boa opção…", "Alternativa…", "Ótimo…", "Use carga…", "Pode segurar…") | movidas para `context` | FR-018 e FR-019. |

Demonstração: nas variações de terra (convencional, romeno, stiff, sumô e unilateral) os braços da figura são um pouco mais longos (66 em vez de 58). Com o braço padrão, a barra no chão obrigaria o quadril a ficar abaixo do joelho, que é a técnica errada. A hiperextensão usa a cena nova `banco-romano`.

## Lote 3: Empurrar na horizontal (T060)

Antes, os supinos e as flexões tinham primário peito e secundário ombro e tríceps; a flexão diamante, primário tríceps e secundário ombro. A maior parte estava certa. `muscleGroup`, `pattern` e `stress` não mudam.

| id | campo | antes | depois | justificativa |
|:---|:---|:---|:---|:---|
| supino-reto-barra, supino-reto-halteres, supino-declinado-barra, supino-maquina | muscles | peito; ombro e tríceps | peito; tríceps e ombro | Conferido; só a ordem dos secundários muda (tríceps trabalha mais que o deltoide anterior). |
| supino-inclinado-barra, supino-inclinado-halteres | muscles | peito; ombro e tríceps | peito e ombro; tríceps | Na inclinação de 30 a 45 graus, o deltoide anterior trabalha quase tanto quanto a parte de cima do peito. |
| supino-pegada-neutra-halteres | muscles | peito; ombro e tríceps | peito e tríceps; ombro | Com os cotovelos junto ao tronco, o tríceps assume parte maior do trabalho. |
| flexao-braco-corporal, flexao-maos-elevadas-corporal | muscles | peito; ombro e tríceps | peito; tríceps, ombro e core | O core segura o corpo em prancha durante todo o movimento. |
| flexao-declinada-corporal | muscles | peito; ombro e tríceps | peito e ombro; tríceps e core | Com os pés elevados, o ombro recebe mais carga. |
| flexao-diamante-corporal | muscles | tríceps; ombro | tríceps; peito, ombro e core | O peito continua trabalhando, e o core segura a prancha. |
| (lote 3) | gear | — | conferido | Sem correção. |
| (lote 3) | guidance | recomendações nos passos de 7 itens ("Boa opção…", "Permite…", "Use trava…", "Regule…") | movidas para `context` | FR-018 e FR-019. |

Demonstração: o supino com pegada neutra usa a mesma base do supino com halteres, e a diferença (palmas voltadas uma para a outra) não aparece de perfil. Por isso ele tem legenda. O supino declinado usa a cena nova `banco-declinado`. No cartão de revisão, a legenda passa a aparecer uma vez, abaixo dos três quadros.
