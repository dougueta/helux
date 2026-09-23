// v2-doc-b.jsx — components, screens, docs, app
function St({ l, children, w }) { return <div className="d-st" style={w ? { flexBasis: w } : null}><div className="d-st-b">{children}</div><div className="t-caption faint">{l}</div></div>; }
function Spec({ title, use, avoid, children }) {
  return <div className="d-spec"><div className="d-spec-h"><h3 className="d-h3">{title}</h3>
    <div className="d-spec-r">{use && <p><b>Use</b> {use}</p>}{avoid && <p><b>Evite</b> {avoid}</p>}</div></div>
    <div className="d-spec-demo">{children}</div></div>;
}
const F = { boxShadow: 'var(--focus)' };

function Components() {
  const [feel, setFeel] = useState('normal');
  const [tab, setTab] = useState('exec');
  const [w, setW] = useState(80);
  return <Sec id="componentes" n="02" title="Componentes" lead="Cada componente com seus estados. Tudo aqui é o mesmo código das telas.">
    <Spec title="Botão primário" use="uma vez por tela, na ação que avança: Iniciar treino, Próximo exercício, Tentar de novo." avoid="duas pílulas verdes visíveis ao mesmo tempo. Se a ação perdeu prioridade (ex.: durante o descanso), vira secundário.">
      <St l="padrão"><Btn size="lg" iconRight="play">Iniciar treino</Btn></St>
      <St l="pressionado"><Btn size="lg" iconRight="play" press>Iniciar treino</Btn></St>
      <St l="foco"><Btn size="lg" iconRight="play" style={F}>Iniciar treino</Btn></St>
      <St l="desabilitado"><Btn size="lg" iconRight="play" disabled>Iniciar treino</Btn></St>
      <St l="carregando"><Btn size="lg" loading>Iniciar treino</Btn></St>
    </Spec>
    <Spec title="Secundário, fantasma e ícone" use="secundário para ações de apoio com peso (Fechar, Sincronizar, +15s); fantasma para ações de baixa frequência (Adicionar série, Pular); ícone só com rótulo acessível." avoid="fantasma como única saída de uma tela.">
      <St l="secundário"><Btn kind="secondary">Fechar</Btn></St><St l="pressionado"><Btn kind="secondary" press>Fechar</Btn></St><St l="foco"><Btn kind="secondary" style={F}>Fechar</Btn></St><St l="desabilitado"><Btn kind="secondary" disabled>Fechar</Btn></St><St l="carregando"><Btn kind="secondary" loading>Fechar</Btn></St>
      <St l="fantasma"><Btn kind="ghost" icon="plus">Adicionar série</Btn></St><St l="fantasma pressionado"><Btn kind="ghost" icon="plus" press>Adicionar série</Btn></St>
      <St l="ícone"><IconBtn n="close" label="fechar" /></St><St l="ícone pressionado"><IconBtn n="close" label="fechar" press /></St><St l="ícone foco"><IconBtn n="close" label="fechar" style={F} /></St><St l="ícone desabilitado"><IconBtn n="timer" label="timer" disabled /></St>
      <St l="destrutivo"><Btn kind="danger">Encerrar treino</Btn></St>
    </Spec>
    <Spec title="Etiqueta e marcador genético" use="etiqueta retangular para classificar (músculo, equipamento, nível). Marcador genético ao lado da orientação que ele justifica; âmbar quando é alerta." avoid="etiqueta tocável; se tocar faz algo, é botão.">
      <St l="etiqueta"><Tag>Quadríceps</Tag></St><St l="contorno"><Tag kind="outline">Atual</Tag></St><St l="atenção"><Tag kind="warn">Dados antigos</Tag></St>
      <St l="marcador"><GeneTag gene="ACTN3" geno="R,X" /></St><St l="marcador de alerta"><GeneTag gene="COL1A1" geno="C,C" warn /></St>
      <St l="carregando"><Sk w={72} h={24} /></St>
    </Spec>
    <Spec title="Fit (MatchBadge)" use="sempre que houver escolha entre exercícios ou variantes. sm em linhas, md no card de foco, lg na tela de DNA." avoid="fit sem número. O comprimento ajuda o relance; o número dá a precisão.">
      <St l="sm alto"><Fit value={86} /></St><St l="sm médio"><Fit value={68} /></St><St l="sm baixo"><Fit value={41} /></St><St l="md"><Fit value={68} size="md" /></St><St l="lg"><Fit value={68} size="lg" /></St>
      <St l="carregando"><Sk w={74} h={14} /></St><St l="sem dado"><span className="t-caption">Fit indisponível. Refaça a sincronização do teste.</span></St>
    </Spec>
    <Spec title="Seletor segmentado" use="escolha única entre 2–4 opções curtas. Seleção neutra (Osso); abas em surface-3." avoid="mais de 4 opções; use lista.">
      <St l="cansaço, interativo" w="100%"><div style={{ width: 343 }}><Segmented options={['ótimo', 'normal', 'cansado', 'exausto']} value={feel} onChange={setFeel} /></div></St>
      <St l="abas, interativo" w="100%"><div style={{ width: 343 }}><Segmented tabs options={[{ v: 'exec', l: 'Execução' }, { v: 'var', l: 'Variantes (4)' }]} value={tab} onChange={setTab} /></div></St>
      <St l="desabilitado (sem recovery)" w="100%"><div style={{ width: 343 }}><Segmented options={['ótimo', 'normal', 'cansado', 'exausto']} value="normal" disabled /></div></St>
      <St l="carregando"><Sk w={343} h={52} r={999} /></St>
    </Spec>
    <Spec title="Stepper numérico" use="kg (passo 2,5) e reps (passo 1) durante a série. Botões de 44 × 52." avoid="stepper para valores que variam muito (peso corporal): use campo.">
      <St l="interativo"><div style={{ width: 150 }}><Stepper value={w} unit="kg" step={2.5} onChange={setW} label="carga" /></div></St>
      <St l="foco no +"><div style={{ width: 150 }} className="d-focus-last"><Stepper value={8} unit="reps" label="reps" /></div></St>
      <St l="desabilitado"><div style={{ width: 150 }}><Stepper value={80} unit="kg" disabled label="carga" /></div></St>
      <St l="erro (fora da faixa)"><div style={{ width: 150 }}><Stepper value={0} unit="reps" err label="reps" /></div></St>
    </Spec>
    <Spec title="Linha de série" use="série atual abre como área de foco com steppers; concluídas e próximas ficam compactas e tocáveis para editar." avoid="steppers em todas as linhas: é o que deixava a tabela apertada.">
      <div style={{ width: 343 }}>
        <div className="hx-sets">
          <SetRow no={1} prev="80 × 8" w={80} r={8} done />
          <CurrentSet no={2} total={4} prev="80 × 8" w={82.5} r={8} />
          <SetRow no={3} prev="80 × 8" w={80} r={8} />
          <SetRow no={4} prev={null} w={80} r={8} />
        </div>
        <p className="t-caption" style={{ marginTop: 8 }}>Concluída · atual · próxima · série extra sem anterior</p>
      </div>
      <div style={{ width: 290 }}><div className="hx-sets"><CurrentSet no={2} total={4} prev="80 × 8" w={80} r={8} /></div><p className="t-caption" style={{ marginTop: 8 }}>Em 320 px o ✓ desce para largura total</p></div>
      <div style={{ width: 343 }}><div className="hx-sets"><div className="hx-set"><Sk w={16} h={14} /><Sk w={50} h={12} /><Sk w={80} h={16} /><Sk w={44} h={44} r={999} /></div><div className="hx-set"><Sk w={16} h={14} /><Sk w={50} h={12} /><Sk w={80} h={16} /><Sk w={44} h={44} r={999} /></div></div><p className="t-caption" style={{ marginTop: 8 }}>Carregando</p></div>
    </Spec>
    <Spec title="Progresso do treino" use="um traço por série, agrupado por exercício; o exercício atual fica mais alto. Tocar num grupo leva ao exercício." avoid="porcentagem; o que importa é quantas séries faltam aqui.">
      <St l="início" w="343px"><div style={{ width: 343 }}><WorkoutProgress groups={GROUPS} done={[1, 0, 0, 0, 0, 0, 0]} cur={0} /></div></St>
      <St l="meio" w="343px"><div style={{ width: 343 }}><WorkoutProgress groups={GROUPS} done={[4, 3, 3, 2, 0, 0, 0]} cur={3} /></div></St>
    </Spec>
    <Spec title="Anel de progresso" use="somente para tempo que corre (descanso). É circular porque volta a zero." avoid="progresso de ciclo ou nota; use traços ou número.">
      <St l="descanso"><Ring size={48} value={.8}><Icon n="timer" s={20} style={{ color: 'var(--accent)' }} /></Ring></St>
      <St l="grande"><Ring size={88} stroke={4} value={.35}><span className="n-md">0:32</span></Ring></St>
    </Spec>
    <Spec title="Dicas de execução" use="uma orientação por linha, verbo no início. Marcador genético abaixo da dica que ele justifica, com quadrado âmbar no lugar do traço." avoid="parágrafo, texto verde, ATENÇÃO em caixa alta.">
      <div style={{ width: 343 }}><Tips items={[TIPS[1]]} /><p className="t-caption" style={{ marginTop: 8 }}>1 item</p></div>
      <div style={{ width: 343 }}><Tips items={TIPS.slice(0, 3)} /><p className="t-caption" style={{ marginTop: 8 }}>Vários, com marcador</p></div>
      <div style={{ width: 343 }}><Tips items={TIPS.slice(1, 4)} /><p className="t-caption" style={{ marginTop: 8 }}>Vários, sem marcador</p></div>
      <div style={{ width: 343 }}><div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}><Sk w="90%" /><Sk w="70%" /><Sk w="80%" /></div><p className="t-caption" style={{ marginTop: 8 }}>Carregando</p></div>
    </Spec>
    <Spec title="Passos numerados" use="sequência real de execução. O erro comum entra como último passo, em âmbar." avoid="numerar listas que não têm ordem.">
      <div style={{ width: 343 }}><Steps items={[{ text: 'Barra apoiada no trapézio, pés na largura dos ombros' }, { text: 'Desça até a coxa ficar paralela ao chão' }, { text: 'deixar os joelhos colapsarem na subida', warn: true }]} /></div>
    </Spec>
    <Spec title="Cabeçalhos" use="cabeçalho de tela com 44 px nas laterais; de seção em 16/600 com complemento opcional à direita." avoid="rótulo em caixa alta acima de todo bloco.">
      <div style={{ width: 375, background: 'var(--bg)', borderRadius: 12, padding: '8px 0', boxShadow: 'inset 0 0 0 1px var(--hairline)' }}><ScreenHeader left={<IconBtn n="close" label="fechar" />} title="Agachamento Livre" sub="1/23 séries" right={<IconBtn n="timer" label="timer" />} /></div>
      <div style={{ width: 343 }}><SectionHeader title="Recordes pessoais" aside="últimos 90 dias" /></div>
    </Spec>
    <Spec title="Barra de navegação" use="quatro destinos. Ativo: ícone limão, texto Osso, traço no topo. Some no treino ativo e no login." avoid="badge numérico nas abas.">
      <div style={{ width: 375, borderRadius: 12, overflow: 'hidden', '--safe-b': '12px' }}><NavBar cur="hoje" /></div>
    </Spec>
    <Spec title="Folha, diálogo e toast" use="folha para detalhe que não tira do contexto; diálogo só para confirmar algo que perde dados; toast para confirmação reversível." avoid="diálogo para informar. Todos ficam acima da barra de navegação.">
      <div className="d-mini"><div className="hx-scrim" /><div className="hx-sheet" style={{ top: 90, padding: '0 16px' }}><div className="hx-sheet-h" /><h3 className="t-heading" style={{ marginTop: 10 }}>Agachamento Livre (Barra)</h3><p className="t-secondary" style={{ marginTop: 6 }}>Folha: surface-1, raio 24, alça, scrim a 72%.</p><div style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}><Btn kind="secondary" block>Fechar</Btn></div></div></div>
      <div className="d-mini"><div className="hx-scrim" /><div className="hx-dialog"><h3 className="t-heading">Encerrar treino?</h3><p className="t-body dim" style={{ marginTop: 8 }}>As 5 séries feitas ficam salvas. As 18 restantes não entram no histórico.</p><div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}><Btn kind="danger" block>Encerrar</Btn><Btn kind="ghost" block>Continuar treinando</Btn></div></div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 343 }}>
        <div className="hx-toast"><span style={{ flex: 1 }}>Série 2 removida</span><Btn kind="ghost">Desfazer</Btn></div>
        <div className="hx-toast hx-toast--err"><Icon n="cloud" s={18} style={{ color: 'var(--danger)' }} /><span style={{ flex: 1 }}>Sem conexão. Tentando de novo em 10s.</span><Btn kind="ghost">Agora</Btn></div>
      </div>
    </Spec>
    <Spec title="Campo numérico com unidade" use="check-in (peso, cintura, gordura). Teclado decimal, unidade fixa à direita." avoid="unidade no placeholder.">
      <div style={{ width: 200 }}><Field label="Peso" value="82,0" unit="kg" help="Último: 82,4 kg" /></div>
      <div style={{ width: 200 }}><Field label="Cintura" value="84" unit="cm" focus /></div>
      <div style={{ width: 200 }}><Field label="Gordura" placeholder="0,0" unit="%" /></div>
      <div style={{ width: 200 }}><Field label="Gordura" value="68" unit="%" err="Use um valor entre 3 e 50 %." /></div>
      <div style={{ width: 200 }}><Field label="Peso" value="82,0" unit="kg" dis help="Vem da balança conectada" /></div>
    </Spec>
    <Spec title="Histórico e recordes" use="linhas planas com divisória; número à direita em mono." avoid="um card por item.">
      <div style={{ width: 343 }}><HistoryRow name="Treino C — Costas + Bíceps" date="Segunda, 21 de set." sets={19} dur={52} vol="12,6" /><PRCard lift="Leg Press 45°" kg={220} reps={10} delta="+20 kg" when="Segunda-feira" fresh /></div>
      <div style={{ width: 343 }}><div style={{ padding: '14px 0', borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between' }}><div><Sk w={160} /><Sk w={110} h={12} style={{ marginTop: 8 }} /></div><div><Sk w={60} h={18} /><Sk w={80} h={12} style={{ marginTop: 6 }} /></div></div><p className="t-caption" style={{ marginTop: 4 }}>Carregando</p></div>
      <div style={{ width: 343 }}><div className="hx-card" style={{ padding: 16 }}><div className="t-body-m">Nenhum recorde ainda</div><p className="t-secondary" style={{ marginTop: 4 }}>Recordes aparecem quando você supera a melhor carga de um exercício.</p><Btn kind="secondary" style={{ marginTop: 12 }}>Ver treino de hoje</Btn></div><p className="t-caption" style={{ marginTop: 8 }}>Vazio</p></div>
    </Spec>
    <Spec title="Gráfico de barras" use="volume por semana. Semana atual em Osso; as outras em surface-3." avoid="eixo Y, grade e verde: o número acima já dá a escala.">
      <div style={{ width: 343 }}><Bars data={[{ w: '26/8', v: 15.3 }, { w: '2/9', v: 9.8 }, { w: '9/9', v: 16.2 }, { w: '16/9', v: 17.4 }]} /></div>
      <div style={{ width: 343 }}><div className="hx-bars" style={{ alignItems: 'end' }}>{[40, 70, 55, 85].map((h, i) => <div key={i} className="hx-bar"><Sk h={`${h}%`} r={4} style={{ maxWidth: 28, width: '100%' }} /></div>)}</div><p className="t-caption" style={{ marginTop: 8 }}>Carregando</p></div>
      <div style={{ width: 343 }}><div style={{ height: 120, display: 'grid', placeItems: 'center', textAlign: 'center', borderRadius: 16, boxShadow: 'inset 0 0 0 1px var(--hairline)' }}><div><div className="t-body-m">Sem treinos nesta semana</div><p className="t-secondary">O volume aparece após o primeiro treino.</p></div></div><p className="t-caption" style={{ marginTop: 8 }}>Vazio</p></div>
    </Spec>
    <Spec title="Banners de estado" use="erro diz o que houve e o que fazer, sem pedir desculpas. Aviso quando o dado existe mas não é confiável." avoid="vermelho para dado antigo; é aviso, não erro.">
      <div style={{ width: 343 }}><Banner kind="warn" title="Dados antigos — sincronize novamente">Última leitura ontem, 07:12.</Banner></div>
      <div style={{ width: 343 }}><Banner kind="err" title="Não foi possível salvar">Sem conexão. O treino está guardado neste aparelho.</Banner></div>
    </Spec>
  </Sec>;
}

function Screens() {
  return <Sec id="telas" n="03" title="Telas" lead="375 px. As telas rolam dentro do aparelho e respondem: marque uma série, abra a execução, troque de aba.">
    <div className="d-phones">
      <figure><HomeScreen /><figcaption>1. Hoje</figcaption></figure>
      <figure><HomeScreen loading /><figcaption>1b. Hoje, carregando</figcaption></figure>
      <figure><ActiveScreen /><figcaption>2. Treino ativo, 1 série concluída</figcaption></figure>
      <figure><ActiveScreen resting label="Treino ativo descanso" /><figcaption>2b. Descanso rodando</figcaption></figure>
      <figure><ActiveScreen sheet label="Folha de execução" /><figcaption>3. Folha de execução</figcaption></figure>
      <figure><DNAScreen /><figcaption>4. DNA</figcaption></figure>
      <figure><ProgressScreen /><figcaption>5. Progresso, dados antigos</figcaption></figure>
      <figure><DoneScreen label="Treino concluído" /><figcaption>6. Treino concluído</figcaption></figure>
      <figure><DoneScreen state="saving" label="Salvando" /><figcaption>6b. Salvando treino…</figcaption></figure>
      <figure><DoneScreen state="err" label="Erro ao salvar" /><figcaption>6c. Não foi possível salvar</figcaption></figure>
    </div>
    <Sub title="Crítica em 375 px, e o que foi corrigido">
      <ul className="d-list">
        <li>Complementos curtos ("7 exercícios", "Informado por você", "Apple Watch") quebravam em duas linhas e disputavam com o título. Agora não quebram; o título cede espaço.</li>
        <li>O skeleton da Home sumia dentro da área de foco (surface-2 sobre surface-2). Dentro do foco, skeleton usa surface-3.</li>
        <li>Na demonstração, a cabeça encostava na anilha. A barra desceu para o trapézio e a cabeça avançou, como no agachamento com barra alta.</li>
        <li>O ícone de recorde na conclusão era limão chapado, o que quebrava a regra do acento. Virou âmbar sobre surface-3.</li>
        <li>Durante o descanso, dois botões grandes competiam. "Próximo exercício" vira secundário enquanto o tempo corre e volta a primário ao terminar.</li>
      </ul>
    </Sub>
    <Sub title="Hoje no desktop" note="Coluna central de 512 px; a barra de navegação alinha à coluna.">
      <div className="d-desk"><div style={{ transform: 'scale(var(--k))', transformOrigin: 'top left' }}><HomeDesktop /></div></div>
    </Sub>
  </Sec>;
}

function Docs() {
  const rows = [
    ['Limão --accent', 'CTA principal; item ativo da navegação; ✓ de série concluída; traço de série feita; fit alto; ícone do descanso.', 'Títulos, palavras destacadas, ícones decorativos, gráficos, recordes, seleção de cansaço, foco de teclado.'],
    ['Osso --text como fundo', 'Seleção em seletor segmentado, semana atual no gráfico, toast.', 'Grandes áreas; é para ponto de atenção pequeno.'],
    ['Âmbar --warn', 'Marcador genético de alerta, erro comum, dado antigo, streak.', 'Decorar; nunca como segunda cor de marca.'],
    ['Vermelho --danger', 'Falha que exige ação: não salvou, valor inválido, encerrar treino.', 'Recovery ruim como texto grande; use palavra + ponto.'],
    ['--text-faint', 'Informação terciária sobre bg, surface-1 ou surface-2: "anterior", legenda de ícone.', 'Sobre surface-3; qualquer coisa que a pessoa precise ler para decidir.'],
    ['Área de foco', 'Uma por tela: treino de hoje, série atual, descanso, recorde novo.', 'Dois blocos em surface-2 competindo na mesma dobra.'],
    ['Card', 'Grupo tocável (Ver execução + variante), traço genético, métrica comparável.', 'Envolver seções inteiras só para separar; use divisória.'],
    ['Hélice (assinatura)', 'Fit, progresso de séries, tela de DNA, conclusão.', 'Carregamento, fundo, logotipo animado, divisória.'],
    ['Pílula', 'Botões e seletores.', 'Etiquetas informativas; essas são retângulo de 6 px.'],
    ['Cabeçalho de seção', 'Quando o bloco não se explica pelo conteúdo (Séries, Recordes).', 'Acima de cada card; em caixa alta.'],
    ['Numeração', 'Séries e passos de execução.', 'Seções da tela, dicas, marcadores.'],
    ['Foco de teclado', 'Anel Osso de 2 px com 2 px de folga em tudo que é interativo.', 'Remover outline sem substituto; usar limão (confundiria com ativo).'],
  ];
  return <Sec id="docs" n="04" title="Regras de uso" lead="O que pode ser o quê. Na dúvida, a resposta é menos.">
    <div className="d-rules">{rows.map(([a, b, c]) => <div key={a} className="d-rule"><b>{a}</b><p><span className="d-k">Use</span>{b}</p><p><span className="d-k">Não use</span>{c}</p></div>)}</div>
    <Sub title="Requisitos atendidos">
      <ul className="d-list">
        <li>Alvos de toque de 44 px no mínimo: − / + têm 44 × 52, ✓ 44 (52 na série atual), pílulas de cansaço 44 de altura, itens da navegação 50.</li>
        <li>Sem rolagem horizontal em 320 px: a linha da série atual quebra o ✓ para largura total por container query; nomes longos quebram em até duas linhas (text-wrap: balance).</li>
        <li>Área segura inferior: --safe-b (34 px no iPhone, env(safe-area-inset-bottom) em produção) aplicado à navegação e aos CTAs fixos.</li>
        <li>Navegação some no treino ativo e na conclusão; folhas e diálogos usam z-index acima da navegação e scrim próprio.</li>
        <li>Skeletons repetem a forma do conteúdo final (mesmas alturas de linha e raios), com brilho desligado em prefers-reduced-motion.</li>
      </ul>
    </Sub>
  </Sec>;
}

function BeforeAfter() {
  const r = [
    ['Rótulos TREINO DE HOJE, PROGRESSO DO CICLO em caixa alta', 'Cabeçalhos em caixa normal e só onde necessários', 'Caixa alta espaçada é lida letra a letra; em sentence case o olho reconhece a palavra inteira, e sobra hierarquia para o que importa.'],
    ['Nome do usuário em verde na saudação', 'Saudação toda em Osso: "Bom treino, Doug"', 'Destacar uma palavra por enfeite gastava o verde que precisa sinalizar ação.'],
    ['Círculo verde decorativo no card da Home', 'Removido; o card virou área de foco em surface-2', 'Não carregava informação e competia com o CTA.'],
    ['MatchBadge "● 68 fit" com glow', 'Hélice projetada + número mono', 'O fit ganha forma própria ligada a DNA; é a assinatura do Helux.'],
    ['Dicas como bloco verde de texto corrido', 'Lista escaneável, uma orientação por linha, marcador genético como etiqueta', 'Entre séries a pessoa lê uma linha, não um parágrafo; o gene explica a dica sem gritar.'],
    ['Stepper em todas as 4 séries, 34 px', 'Série atual em foco com steppers de 52 px; demais compactas', 'Resolve o aperto da tabela e cumpre os 44 px.'],
    ['Barra de progresso com 7 segmentos iguais', 'Um traço por série, agrupados por exercício', 'Mostra quanto falta no exercício atual, não só no treino.'],
    ['Cards da Home soltos, cada um com borda', 'Um bloco de foco + seções planas com divisória', 'Menos caixas, mais leitura; a hierarquia vem da superfície.'],
    ['"técnica · músculos · 4 variantes"', '"Técnica, músculos e 4 variantes"', 'Frase em português lê mais rápido que metadado colado.'],
    ['Chips pílula para etiquetas', 'Retângulo de 6 px para etiqueta; pílula só para tocável', 'A forma avisa se o elemento responde ao toque.'],
    ['Seleção de cansaço em verde', 'Seleção em Osso', 'Deixa o verde exclusivo para o CTA logo abaixo.'],
    ['--text-faint #6A7164 (3,6:1 em surface-2)', '#858C7F (4,6:1)', 'Cumpre AA sem perder a função terciária.'],
    ['Glow e gradiente no CTA e nas barras', 'Cor chapada', 'Visual de laboratório: preciso, sem brilho.'],
  ];
  return <Sec id="antes-depois" n="05" title="Antes → depois">
    <div className="d-ba">{r.map(([a, b, c], i) => <div key={i}><span className="d-was">{a}</span><span className="t-body-m">{b}</span><p className="t-secondary">{c}</p></div>)}</div>
  </Sec>;
}

function DocApp() {
  useEffect(() => { const f = () => { const el = document.querySelector('.d-desk'); if (el) el.style.setProperty('--k', Math.min(1, el.clientWidth / 1280)); }; f(); addEventListener('resize', f); return () => removeEventListener('resize', f); }, []);
  return <div className="d-wrap">
    <header className="d-top"><span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 22, letterSpacing: '-.02em' }}><HelixMark s={28} />helux</span>
      <h1 className="d-h1">Design system v2</h1><p className="d-lead">Refinamento do sistema atual para treino na academia: legível de relance, suado, entre séries.</p>
      <nav className="d-toc">{[['plano', 'Plano'], ['fundamentos', 'Fundamentos'], ['componentes', 'Componentes'], ['telas', 'Telas'], ['docs', 'Regras'], ['antes-depois', 'Antes → depois']].map(([id, l]) => <a key={id} href={'#' + id}>{l}</a>)}</nav>
    </header>
    <Plan /><Foundations /><Components /><Screens /><Docs /><BeforeAfter />
  </div>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<DocApp />);
