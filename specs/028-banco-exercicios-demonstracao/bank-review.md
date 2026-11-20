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

## Lote P1: Aquecimento geral e ativação de membros superiores (T079)

Itens novos do catálogo de preparação: nascem completos e nunca entram em `pending.json`. `knownNames` fica vazio até a T084, que cura os nomes antigos de `legacy-item-names.json`.

| id | fases | regiões | modo | equipamento |
|:---|:---|:---|:---|:---|
| bike-leve | aquecimento | sistêmica, joelho, quadril | contínuo | bicicleta |
| remo-leve | aquecimento | sistêmica, lombar | contínuo | remo |
| marcha-no-lugar | aquecimento | sistêmica, quadril | contínuo | nenhum |
| polichinelo-leve | aquecimento | sistêmica | contínuo | nenhum |
| balanco-perna | aquecimento | quadril | por lado | nenhum |
| circulos-braco | aquecimento | ombro | repetições | nenhum |
| deslizamento-parede | aquecimento, mobilidade | ombro | repetições | nenhum |
| rotacao-externa-elastico | aquecimento | ombro | por lado | elástico |
| rotacao-passagem-ombro-elastico | aquecimento, mobilidade | ombro | repetições | elástico |
| puxada-elastico-rosto | aquecimento | ombro | repetições | elástico |
| suspensao-ativa-barra | aquecimento | ombro | sustentação | barra fixa |

Implementos novos: `bicicleta` (sem carga; a cena desenha quadro, selim, guidão e pedal) e `remo` (puxador e corrente até o volante). Cenas novas: `bicicleta` e `remo`.

Demonstração: bicicleta e remo em modo `cycle`; na bicicleta os pés dão a volta no pedal, um do lado oposto ao outro. Marcha no lugar alterna as pernas. Polichinelo e deslizamento na parede são vistos de frente; no polichinelo os joelhos ficam soltos, porque o quadril é o apoio fixo da figura. A rotação externa é mostrada na posição 90/90, de perfil: o braço aponta para quem vê e aparece curto, e o antebraço gira da horizontal para cima; a legenda explica. Na passagem de ombro, sem ponto de fixação, o elástico aparece só nas mãos. A suspensão ativa mantém os braços estendidos; a diferença entre solto e ativo é pequena no desenho, e a legenda e a orientação descrevem os ombros descendo.

## Lote P2: Ativação inferior e mobilidade de quadril e tornozelo (T080)

Itens novos do catálogo de preparação. `knownNames` fica para a T084.

| id | fases | regiões | modo | equipamento |
|:---|:---|:---|:---|:---|
| ponte-gluteo | aquecimento | quadril, lombar | repetições | nenhum |
| flexao-inclinada-leve | aquecimento | ombro | repetições | banco |
| afundo-sem-carga | aquecimento | joelho, quadril | por lado | nenhum |
| agachamento-banco-sem-carga | aquecimento | joelho, quadril | repetições | banco |
| dobradica-quadril-bastao | aquecimento | lombar, quadril | repetições | bastão |
| quadril-90-90 | mobilidade, aquecimento | quadril | por lado | nenhum |
| abertura-quadril-sapo | mobilidade, volta à calma | quadril | repetições | nenhum |
| agachamento-profundo-pausa | mobilidade, aquecimento | quadril, tornozelo, joelho | sustentação | nenhum |
| agachamento-cossaco | mobilidade, aquecimento | quadril, joelho | por lado | nenhum |
| tornozelo-joelho-parede | mobilidade, aquecimento | tornozelo | por lado | nenhum |
| dorsiflexao-halux | mobilidade | tornozelo | sustentação | nenhum |

Implemento novo: `bastao`, desenhado encostado nas costas, do quadril até acima da cabeça.

Demonstração: ponte de glúteo, flexão inclinada e afundo usam as bases de força já aprovadas, sem implemento. O agachamento no banco tem base própria, com os braços à frente. O agachamento cossaco é visto de frente, sem espelhar, e passa de um lado ao outro em ciclo. O quadril 90/90 e o sapo são vistos de perfil: a perna que aponta para quem vê aparece curta, e a legenda explica a posição. No tornozelo, o joelho da frente avança até perto da parede com o calcanhar no chão. Na dorsiflexão do hálux, ajoelhado com os dedos dobrados, o quadril desce até os calcanhares; o detalhe dos dedos é pequeno no desenho, e a legenda explica.

## Lote P3: Mobilidade de coluna e joelho e relaxamento (T081)

Itens novos do catálogo de preparação. `knownNames` fica para a T084.

| id | fases | regiões | modo | equipamento |
|:---|:---|:---|:---|:---|
| rotacao-toracica-quatro-apoios | mobilidade, aquecimento | ombro, lombar | por lado | nenhum |
| rotacao-toracica-deitado-lado | mobilidade, volta à calma | ombro, lombar | por lado | nenhum |
| mobilidade-toracica-rolo | mobilidade, aquecimento | ombro, lombar | repetições | rolo |
| gato-camelo | mobilidade, aquecimento | lombar | repetições | nenhum |
| bascula-pelvica | mobilidade, volta à calma | lombar, quadril | repetições | nenhum |
| balanco-quatro-apoios | mobilidade, aquecimento | quadril, lombar | repetições | nenhum |
| deslizamento-calcanhar | mobilidade | joelho | por lado | nenhum |
| extensao-joelho-toalha | mobilidade | joelho | por lado | toalha |
| extensao-terminal-joelho-elastico | aquecimento, mobilidade | joelho | por lado | elástico |
| respiracao-diafragmatica | volta à calma | sistêmica, lombar | contínuo | nenhum |

A coluna torácica não é uma região de `REGIONS`; os itens torácicos usam ombro e lombar.

Implementos novos: `rolo` (rolo de espuma) e `toalha` (toalha enrolada). Os dois ficam parados no ponto de apoio (`anchor`), sob o corpo. Como estão em `needs`, a geração de planos (T087) precisa decidir se toalha conta como equipamento; até lá, o joelho tem itens sem equipamento suficientes.

Demonstração: os itens em quatro apoios compartilham a mesma posição (mão sob o ombro, joelho sob o quadril). Na rotação torácica em quatro apoios, o braço livre aparece encurtado, com a mão na nuca, e o cotovelo vai de baixo até o teto; a legenda explica. O traço do tronco é reto, então no gato-camelo a curva das costas aparece pela cabeça, que desce e sobe; a legenda explica. A rotação deitado de lado é vista a partir da cabeça, para o braço abrir no plano do desenho sem mudar de comprimento: é o desenho mais abstrato do lote, e a legenda explica. No rolo, o quadril fica no chão e o tronco desce até encostar no rolo, com a cabeça indo para trás. Na báscula pélvica, o quadril gira e sobe só um pouco, bem menos que numa ponte; a legenda explica. Na revisão, a báscula, a respiração e as duas extensões de joelho tiveram o movimento aumentado, porque pareciam paradas. Na extensão de joelho, a toalha fica sob o joelho e o calcanhar sobe quando a perna estende. Na extensão terminal, o elástico vai da parede até o joelho. Na respiração, só a mão da barriga sobe.

## Lote P4: Alongamentos de tronco e membros superiores (T082)

Itens novos do catálogo de preparação. `knownNames` fica para a T084.

| id | fases | regiões | modo | equipamento |
|:---|:---|:---|:---|:---|
| alongamento-peitoral-parede | volta à calma | ombro | sustentação | nenhum |
| alongamento-dorsal-banco | volta à calma | ombro, lombar | sustentação | banco |
| alongamento-dorsal-apoio | volta à calma | ombro, lombar | sustentação | nenhum |
| alongamento-posterior-ombro | volta à calma | ombro | sustentação | nenhum |
| alongamento-biceps-parede | volta à calma | cotovelo, ombro | sustentação | nenhum |
| alongamento-triceps | volta à calma | cotovelo, ombro | sustentação | nenhum |
| alongamento-antebraco | volta à calma | punho, cotovelo | sustentação | nenhum |
| postura-crianca | volta à calma, mobilidade | lombar, quadril, ombro | sustentação | nenhum |
| joelhos-ao-peito | volta à calma, mobilidade | lombar, quadril | sustentação | nenhum |

Nomes: o `data-model.md` agrupa os alongamentos com nomes curtos ("Peitoral na parede", "Antebraço"). No catálogo, o nome aparece sozinho no treino, então os alongamentos levam "Alongamento de" na frente, como a IA já escrevia. "Postura da criança" e "Joelhos ao peito" já se explicam.

O apoio do dorsal no apoio pode ser um rack, o encosto de um aparelho ou a parede, então o item fica sem equipamento. O antebraço é o primeiro item da região punho.

Demonstração: todas as bases usam `hold`, chegando à posição e parando. Peitoral e bíceps são montados com a figura de costas para a parede: o desenho espelha a figura para ela olhar para a esquerda. O peitoral foi refeito a pedido do dono, para quem nunca treinou entender de relance: a versão com o antebraço na parede depende de girar o tronco, o que não aparece de perfil. Agora a mão fica parada na parede, na altura do ombro, e a pessoa dá um passo à frente; o braço estica para trás. A perna que dá o passo é a principal. No bíceps, a mão fica na parede e o cotovelo estende. O dorsal no apoio vai de frente para a parede, com as mãos na altura do quadril. No dorsal no banco, os cotovelos ficam na borda do banco baixo e a cabeça pende à frente dele. No tríceps, a cabeça fica um pouco à frente para o braço passar atrás dela. O antebraço não tem punho no desenho, e a legenda explica. A postura da criança desce do tronco ereto até os braços tocarem o colchonete.

Vista frontal com braços diferentes: no posterior de ombro, cada braço faz uma coisa. Na vista frontal espelhada, `el2`/`ha2` passam a ser o braço do lado espelhado, guardado já espelhado, e substituem a cópia do braço principal (`demo-parts.tsx`). Nenhuma base anterior tinha `el2` com espelho, então as demais demonstrações não mudam. O braço que cruza fica na altura do peito, abaixo da linha dos ombros, para não se confundir com ela.

## Lote P5: Alongamentos de membros inferiores (T083)

Itens novos do catálogo de preparação. `knownNames` fica para a T084.

| id | fases | regiões | modo | equipamento |
|:---|:---|:---|:---|:---|
| alongamento-flexor-quadril | volta à calma, mobilidade | quadril, lombar | sustentação | nenhum |
| alongamento-quadriceps-deitado | volta à calma | joelho, quadril | sustentação | nenhum |
| alongamento-quadriceps-em-pe | volta à calma | joelho, quadril | sustentação | nenhum |
| alongamento-posterior-coxa-faixa | volta à calma | joelho, quadril, lombar | sustentação | faixa |
| alongamento-posterior-coxa-em-pe | volta à calma | joelho, quadril, lombar | sustentação | nenhum |
| alongamento-gluteo-figura-4 | volta à calma, mobilidade | quadril, lombar | sustentação | nenhum |
| alongamento-panturrilha-parede | volta à calma | tornozelo, joelho | sustentação | nenhum |

Com o pedido do dono no P4 (quem nunca treinou precisa entender de relance), o lote usa versões em que o movimento acontece no plano do desenho, e a perna que alonga é a principal (em destaque). Todas as bases usam `hold`.

Implemento novo: `faixa`, uma linha das mãos até o meio do pé. Serve uma toalha ou um cinto. Como está em `needs`, a T087 decide se a faixa conta como equipamento, como a toalha do P3.

Demonstração: o quadríceps deitado de lado é visto de cima, porque de perfil o joelho dobra para dentro do desenho. A perna de cima fica um pouco afastada da de baixo, para o joelho dobrado aparecer, e a legenda explica. Na figura 4, a perna cruzada aponta para quem vê e por isso aparece mais curta; o joelho dela cai para fora, formando o "4". Esses dois são os desenhos mais abstratos do lote. No quadríceps em pé, a coxa vai um pouco para trás, para o pé aparecer atrás do corpo.

## T084: cobertura por região e nomes antigos

**Invariante 6.** Cada região de `REGIONS` precisa de ao menos 2 itens de preparação, com ao menos 1 sem equipamento. Depois dos lotes P1 a P5, só punho ficava com 1 item (alongamento de antebraço). Entrou `mobilidade-punho-quatro-apoios` (mobilidade e aquecimento, sem equipamento, modo repetições): em quatro apoios, os ombros passam à frente das mãos com as palmas no chão. A demonstração reaproveita os quatro apoios do lote P3 (`demos/preparacao-coluna.ts`); o desenho não tem punho, e a legenda explica.

**Invariante 8.** Os 109 nomes de `legacy-item-names.json` resolvem ou estão em `__tests__/fixtures/legacy-unresolved.json`, com o motivo. O teste também falha se a lista documentada esconder um nome que resolve. A correspondência continua só por nome exato normalizado (R10), sem busca aproximada:

- 49 nomes entraram em `knownNames` de 31 itens: só quando o nome descreve o mesmo exercício (por exemplo "Bike em ritmo leve", "Mobilidade de tornozelo: joelho à parede", "Alongamento de peitoral no batente").
- 8 nomes de séries de aproximação de um único exercício de força entraram na lista curada `src/approach-names.ts` (leg press, agachamento box, frontal, com barra vazia, levantamento terra, goblet). O resolvedor mostra o exercício de força marcado como aproximação (passo 6 de "Resolução de um item na tela").
- 27 nomes ficam documentados: juntam dois ou mais itens ("Polichinelo leve ou marcha no lugar"), servem para mais de um exercício de força ("Séries de aproximação no supino"), ou não têm equivalente ("Alongamento de posterior de coxa sentado"). Esses mostram o aviso de indisponibilidade (FR-031).

## Lote C1: cardio (T085)

As 11 modalidades de `CARDIO_BANK` ganham demonstração (`demos/cardio.ts`, todas em `cycle`) e orientação (`cardio-guidance.ts`) com postura e as três zonas (`leve`, `moderada`, `intervalado-leve`). As zonas são explicadas pelo fôlego e pela fala, sem monitor. A tela de execução mostra a orientação da zona prescrita no plano, abaixo de "Zona … · … min", quando a zona do plano tem orientação.

| id | base | cena | implemento |
|:---|:---|:---|:---|
| bike, bike-intervalado | bicicleta-cardio | bicicleta | bicicleta |
| eliptico | eliptico | eliptico | eliptico (alavancas) |
| remo | remo-cardio | remo | remo |
| natacao | natacao | piscina | nenhum |
| caminhada | caminhada | solo | nenhum |
| caminhada-inclinada | caminhada-inclinada | esteira | esteira |
| escada | escada | escada | escada (pedais) |
| corrida-caminhada | corrida-caminhada | solo | nenhum |
| corrida | corrida | solo | nenhum |
| circuito-corporal | circuito | solo | nenhum |

Decisões:

- **No lugar.** Caminhada, corrida e circuito ficam com o quadril parado; os pés andam e o chão não. Assim o ciclo se repete sem a figura sair da cena.
- **Bike e remo** reaproveitam as bases aprovadas no P1, num ritmo mais rápido (bases `bicicleta-cardio` e `remo-cardio`). As duas bikes compartilham a base e se distinguem pela legenda.
- **Esteira inclinada.** A lona sobe cerca de 5° para a frente (dentro de 3% a 8%, visível no desenho), e o corpo inclina um pouco a partir dos tornozelos.
- **Natação.** Crawl de lado. Deitado, o corpo inteiro não cabe na largura da cena, então só essa base desenha a figura a 90%.
- **Circuito.** O banco descreve "marcha, agachamento parcial e deslocamento lateral". De perfil, o deslocamento lateral não aparece, e o motor exige um apoio parado (o quadril). Por isso a sequência desenhada e escrita é **marcha no lugar → socos alternados → calcanhar no glúteo**, todos sem salto. Cada terço do ciclo mostra um movimento, e as fases de evidência (0, 1/3, 2/3) caem em cada um.
- Implementos novos: `esteira` (só a cena), `eliptico` e `escada`, desenhados como alavancas que saem do eixo e vão até as mãos (elíptico) ou os pés (escada), dos dois lados.

## T086 a T091: geração de planos com o catálogo

- **Esquema.** Aquecimento, volta à calma e mobilidade aceitam só nomes do catálogo, um enum por fase. A região sai do catálogo (primeira região do item). A série de aproximação é um item próprio (`aproximacao`), com o exercício de força do dia, e vira `phase: 'aquecimento'` com `approachOf` e o nome "Série de aproximação: <exercício>". O nome é diferente do exercício para não entrar na progressão de carga dele.
- **Equipamento.** `allowedPreparation` filtra pelo equipamento do usuário. Toalha, faixa e bastão (cabo de vassoura) contam como itens de casa e ficam sempre liberados. Bike, remo, elástico, rolo e banco dependem de `maquina-cabo` (academia). A barra fixa segue o banco de força, que a trata como peso corporal.
- **Troca.** `repairPreparationItems` dá `catalogId` ao item do catálogo e troca o que está fora dele, ou que pede equipamento indisponível, pelo primeiro item permitido da mesma fase e região (sem região, a sistêmica), preferindo os sem equipamento. A troca é por código e não bloqueia o plano; fica registrada na regra `item-fora-do-catalogo` e no log da geração. No ajuste de sessão, só as sessões propostas passam pela troca.
- **Pedido.** O texto do método troca "itens livres" pela lista de cada fase, explica a aproximação e mantém a mobilidade das condições de saúde (FR-028).
- **Tela.** A série de aproximação mostra o exercício de força com a etiqueta "Série leve de preparação" e a dose. Itens mantidos mostram "Mantenha a posição: <tempo>", e itens por lado, "Cada lado: <dose>".
