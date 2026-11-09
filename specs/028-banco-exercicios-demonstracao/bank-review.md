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

## Lote 4: Empurrar na vertical (T061)

Antes, os 8 itens tinham primário ombro e secundário tríceps. `muscleGroup`, `pattern` e `stress` não mudam.

| id | campo | antes | depois | justificativa |
|:---|:---|:---|:---|:---|
| desenvolvimento-militar-barra | muscles | ombro; tríceps | ombro; tríceps, trapézio e core | Em pé, o core segura o tronco e o trapézio sobe as escápulas no topo. |
| desenvolvimento-unilateral-halteres | muscles | ombro; tríceps | ombro; tríceps e core | Com carga de um lado só, o core evita a inclinação lateral. |
| desenvolvimento-halteres | muscles | ombro; tríceps | ombro; tríceps e trapézio | O trapézio sobe as escápulas no topo. |
| desenvolvimento-landmine-barra | muscles | ombro; tríceps | ombro e peito; tríceps e core | O trajeto inclinado para a frente recruta a parte de cima do peito. |
| handstand-pushup-assistido | muscles | ombro; tríceps | ombro e tríceps; trapézio e core | O peso do corpo inteiro exige tríceps como primário, e o core mantém o corpo alinhado. |
| desenvolvimento-arnold, desenvolvimento-maquina, desenvolvimento-smith-maquina | muscles | ombro; tríceps | igual | Conferido. |
| (lote 4) | gear | — | conferido | Sem correção. |
| (lote 4) | guidance | recomendações nos passos de 4 itens ("Pode ser feito…", "Recruta…", "Boa opção…", "Exercício avançado…") | movidas para `context` | FR-018 e FR-019. |

Demonstração: o desenvolvimento unilateral usa a base do desenvolvimento em pé com halter; de perfil, só aparece o braço que trabalha. Halteres, máquina e Smith sentados dividem a base, e o implemento diferencia cada um. O landmine desenha a barra do apoio no chão até a mão (`anchor`).

## Lote 5: Puxar na vertical (T062)

Antes, os 9 itens tinham primário dorsal e secundário bíceps. `muscleGroup`, `pattern` e `stress` não mudam.

| id | campo | antes | depois | justificativa |
|:---|:---|:---|:---|:---|
| barra-fixa-corporal | muscles | dorsal; bíceps | dorsal; bíceps, antebraço e core | O peso do corpo pendurado exige pegada e o core evita o balanço. |
| barra-fixa-supinada-corporal | muscles | dorsal; bíceps | dorsal e bíceps; antebraço | A pegada supinada põe o bíceps como motor principal junto com o dorsal. |
| barra-fixa-neutra-corporal | muscles | dorsal; bíceps | dorsal; bíceps e antebraço | Pegada sustentando o peso do corpo. |
| puxada-alta-cabo | muscles | dorsal; bíceps | dorsal; bíceps e trapézio | A parte de baixo do trapézio desce as escápulas no final. |
| puxada-unilateral-cabo | muscles | dorsal; bíceps | dorsal; bíceps e core | O core evita o giro do tronco. |
| pullover-barra | muscles | dorsal; bíceps | dorsal e peito; tríceps e core | Mesmo raciocínio do pullover com halteres, aprovado no piloto: extensão de ombro com cotovelo quase fixo. |
| puxada-alta-fechada-cabo, puxada-alta-neutra-cabo, pulldown-assistido-maquina | muscles | dorsal; bíceps | igual | Conferido. |
| (lote 5) | gear | — | conferido | Sem correção. |
| (lote 5) | guidance | recomendações nos passos de 6 itens ("Use elástico…", "Maior participação…", "Boa opção…", "Reduz…", "Boa progressão…") | movidas para `context` | FR-018 e FR-019. |

Demonstração: as três barras fixas dividem a base, e as quatro puxadas no cabo dividem outra; de perfil a pegada não aparece, então cada uma tem legenda própria. O pulldown assistido usa a base da barra fixa com a almofada da máquina nos joelhos. O pullover com barra usa a base do pullover do piloto.

## Lote 6: Puxar na horizontal (T063)

Antes, as remadas tinham primário dorsal e secundário bíceps; face pull e remada alta, primário ombro e secundário bíceps. `muscleGroup`, `pattern` e `stress` não mudam.

| id | campo | antes | depois | justificativa |
|:---|:---|:---|:---|:---|
| remada-curvada-barra, remada-curvada-halteres | muscles | dorsal; bíceps | dorsal e trapézio; bíceps, lombar e ombro | Puxada horizontal com o tronco inclinado: o trapézio junta as escápulas, a lombar segura o tronco e o deltoide posterior ajuda. |
| remada-t-barra, remada-cavalinho-barra | muscles | dorsal; bíceps | dorsal e trapézio; bíceps e lombar | Mesma posição da curvada. |
| remada-pendlay-barra | muscles | dorsal; bíceps | dorsal e trapézio; bíceps, lombar e posterior | Tronco paralelo ao chão: o posterior de coxa sustenta a dobradiça. |
| remada-unilateral-halteres, remada-baixa-cabo | muscles | dorsal; bíceps | dorsal; bíceps e trapézio | O trapézio junta as escápulas no fim. |
| remada-maquina | muscles | dorsal; bíceps | dorsal e trapézio; bíceps | Peito apoiado concentra o trabalho nas costas. |
| remada-invertida-corporal | muscles | dorsal; bíceps | dorsal; bíceps, trapézio e core | O core segura o corpo reto. |
| face-pull-cabo | muscles | ombro; bíceps | ombro e trapézio; nenhum | Deltoide posterior e manguito com o trapézio; o bíceps quase não participa. |
| remada-alta-barra | muscles | ombro; bíceps | ombro e trapézio; bíceps e antebraço | Elevação dos braços com o trapézio superior. |
| (lote 6) | gear | — | conferido | Sem correção. |
| (lote 6) | guidance | recomendações nos passos de 8 itens ("Permite…", "Boa opção…", "Ajuste…", "Excelente…", "Reduza…") | movidas para `context` | FR-018 e FR-019. |

Demonstração: barra T e cavalinho usam a base da remada curvada com a barra presa no chão atrás; a pegada não aparece de perfil, então ambos têm legenda. Na remada unilateral, o banco reto é alto demais para a perna de apoio alcançar o chão, então a demonstração mostra só o joelho e a mão no banco. A remada invertida usa as paralelas como barra baixa.

## Lote 7a: Core, pranchas, anti-rotação e rollouts (T064)

Antes, todos os itens de core tinham primário core e nenhum secundário. `muscleGroup`, `pattern` e `stress` não mudam.

| id | campo | antes | depois | justificativa |
|:---|:---|:---|:---|:---|
| prancha-abdominal-corporal | muscles | core; nenhum | core; ombro e glúteo | Os ombros sustentam o apoio nos antebraços e o glúteo segura o quadril na linha. |
| prancha-lateral-corporal | muscles | core; nenhum | core; ombro e abdutores | O glúteo médio (abdutores) mantém o quadril elevado de lado. |
| prancha-rotacao | muscles | core; nenhum | core; ombro | Um braço sustenta o corpo durante a rotação. |
| prancha-toque-ombro-corporal | muscles | core; nenhum | core; ombro e tríceps | Apoio em um braço estendido a cada toque. |
| roda-abdominal, rollout-barra | muscles | core; nenhum | core; dorsal e ombro | O dorsal e o ombro controlam os braços acima da cabeça na volta. |
| dead-bug-corporal, hollow-hold-corporal, pallof-press-cabo | muscles | core; nenhum | igual (pallof com ombro de secundário) | Os braços do pallof sustentam o cabo estendido. |
| (lote 7a) | gear | — | conferido | Sem correção. |
| (lote 7a) | guidance | recomendações nos passos de 4 itens ("Excelente…", "Exercício avançado…", "Reduza…") | movidas para `context` | FR-018 e FR-019. |

Demonstração: na prancha lateral, vista de frente, o antebraço de apoio aponta para quem olha e aparece encurtado. Prancha com rotação e toque no ombro alternam o lado. O pallof é visto de perfil, então o cabo, que vem do lado, aparece vindo de trás; a legenda explica. Roda abdominal e rollout com barra dividem a base e mudam o implemento.

## Lote 7b: Core, flexão e rotação de tronco (T064)

Antes, primário core e nenhum secundário. `muscleGroup`, `pattern` e `stress` não mudam.

| id | campo | antes | depois | justificativa |
|:---|:---|:---|:---|:---|
| elevacao-pernas-barra | muscles | core; nenhum | core; antebraço e dorsal | Pendurado na barra: a pegada e o dorsal sustentam o corpo. |
| rotacao-tronco-cabo | muscles | core; nenhum | core; ombro | Os braços seguram a alça estendidos durante a rotação. |
| abdominal-supra-corporal, abdominal-infra-corporal, abdominal-bicicleta-corporal, abdominal-polia-cabo | muscles | core; nenhum | igual | Conferido. |
| (lote 7b) | gear | — | conferido | Sem correção. |
| (lote 7b) | guidance | sem recomendações nos passos | — | Erros comuns que estavam nos passos foram para `commonError`. |

Demonstração: a rotação de tronco no cabo é vista de frente, com a polia à direita; as mãos juntas cruzam de um lado ao outro. A bicicleta alterna o lado; de perfil, o cotovelo que vai ao joelho oposto não aparece. A elevação de pernas na barra usa a barra fixa com as pernas estendidas.

## Lote 8: Bíceps e tríceps (T065)

Antes, as roscas tinham primário bíceps e os itens de tríceps, primário tríceps; nenhum tinha secundário. `muscleGroup`, `pattern` e `stress` não mudam.

| id | campo | antes | depois | justificativa |
|:---|:---|:---|:---|:---|
| rosca-direta-barra, rosca-direta-halteres, rosca-alternada-halteres, rosca-scott-barra, rosca-cabo, rosca-21-barra | muscles | bíceps; nenhum | bíceps; antebraço | O braquiorradial e os flexores do punho ajudam a segurar e subir a carga. |
| rosca-martelo-halteres | muscles | bíceps; nenhum | bíceps e antebraço; nenhum | A pegada neutra põe o braquiorradial como motor principal junto com o bíceps. |
| mergulho-banco-corporal | muscles | tríceps; nenhum | tríceps; peito e ombro | Extensão de cotovelo com o ombro em extensão: peito e deltoide anterior ajudam. |
| paralelas-corporal | muscles | tríceps; nenhum | tríceps e peito; ombro | O peito é motor principal com o tronco inclinado. |
| rosca-concentrada-halteres, triceps-testa-barra, triceps-testa-halteres, triceps-corda-cabo, triceps-frances-halteres | muscles | igual | igual | Conferido. |
| (lote 8) | gear | — | conferido | Sem correção. |
| (lote 8) | guidance | recomendações nos passos de 6 itens ("Recruta…", "A tensão…", "Use carga…", "Boa técnica…", "Elimina…", "Permite…") | movidas para `context` ou para a posição inicial | FR-018 e FR-019. |

Demonstração: rosca direta com barra e rosca 21 dividem a base e o implemento, e se distinguem pela legenda; o mesmo vale para a rosca direta e a martelo com halteres, já que a pegada não aparece de perfil. A rosca Scott ganhou a cena do banco Scott (assento e apoio inclinado dos braços). No tríceps francês, de perfil, o braço passa na frente da cabeça. As paralelas mostram os joelhos dobrados para os pés não tocarem o chão.

## Lote 9: Ombro, trapézio e peito (T066)

Antes, as elevações e o crucifixo invertido tinham primário ombro; os encolhimentos, primário dorsal (o mapa antigo levava `costas` para dorsal); crucifixos, crossover e peck deck, primário peito. Nenhum tinha secundário. `muscleGroup`, `pattern` e `stress` não mudam.

| id | campo | antes | depois | justificativa |
|:---|:---|:---|:---|:---|
| elevacao-lateral-halteres, elevacao-lateral-cabo, elevacao-posterior-halteres, crucifixo-invertido-maquina | muscles | ombro; nenhum | ombro; trapézio | O trapézio estabiliza e gira a escápula quando o braço sobe ou abre para trás. |
| elevacao-frontal-halteres | muscles | ombro; nenhum | ombro; peito | A parte de cima do peito ajuda na flexão do ombro. |
| encolhimento-ombros-halteres, encolhimento-barra | muscles | dorsal; nenhum | trapézio; antebraço | O encolhimento é do trapézio superior; o dorsal não participa, e a pegada segura a carga. `muscleGroup` continua `costas`. |
| crucifixo-halteres, crucifixo-inclinado-halteres, crossover-cabo, peck-deck-maquina | muscles | peito; nenhum | peito; ombro | O deltoide anterior acompanha a adução horizontal. |
| (lote 9) | gear | — | conferido | Sem correção. |
| (lote 9) | guidance | recomendações nos passos de 5 itens ("Foco…", "Importante…", "A tensão…", "Ênfase…", "Boa opção…") | movidas para `context` | FR-018 e FR-019. |

Demonstração: elevação lateral, elevação posterior, encolhimentos, crucifixos, crossover, peck deck e crucifixo invertido são vistos de frente, com o outro lado espelhado. O crucifixo deitado é visto a partir dos pés: o tronco aparece curto e os pés ficam no chão dos dois lados do banco; o inclinado mostra os ombros mais altos. O encolhimento não tem como subir só os ombros numa figura de tronco rígido, então o corpo inteiro sobe um pouco a partir dos joelhos soltos; a orientação descreve o movimento certo. Peck deck e crucifixo invertido dividem o caminho em sentidos opostos.

## Lote 10: Isolamento de pernas (T067)

Antes, o mapa antigo de 7 regiões levava glúteo, posterior e panturrilha para quadríceps; por isso a cadeira abdutora, a flexora e as cinco panturrilhas apareciam com primário quadríceps. A extensora já era quadríceps. Nenhum tinha secundário. `muscleGroup`, `pattern` e `stress` não mudam.

| id | campo | antes | depois | justificativa |
|:---|:---|:---|:---|:---|
| cadeira-abdutora | muscles | quadríceps; nenhum | abdutores e glúteo; nenhum | Abdução do quadril: glúteo médio e mínimo. |
| cadeira-flexora | muscles | quadríceps; nenhum | posterior; panturrilha | Flexão do joelho: isquiotibiais, com o gastrocnêmio ajudando. |
| elevacao-panturrilha-pe-maquina, elevacao-panturrilha-sentado-maquina, elevacao-panturrilha-corporal, panturrilha-leg-press | muscles | quadríceps; nenhum | panturrilha; nenhum | Flexão plantar. |
| elevacao-panturrilha-halteres | muscles | quadríceps; nenhum | panturrilha; antebraço | A pegada segura os halteres. |
| cadeira-extensora | muscles | quadríceps; nenhum | igual | Conferido. |
| (lote 10) | gear | — | conferido | Sem correção. |
| (lote 10) | guidance | recomendações nos passos de 5 itens ("Bom exercício…", "Boa opção…", "Com o joelho…", "Pode ser feito…", "Não trave…") | movidas para `context` ou reescritas como passo | FR-018 e FR-019. |

Demonstração: a cadeira abdutora usa a base da abdução do piloto. Cadeira extensora e flexora são vistas de perfil, com a coxa parada no assento. As panturrilhas em pé apoiam a ponta do pé na beira do degrau; para isso o motor ganhou o apoio `toe` (a ponta do pé fica fixa e o tornozelo sobe). Na panturrilha sentado, os joelhos sobem junto com os calcanhares. No leg press, só o pé gira em volta do tornozelo.
