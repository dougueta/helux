// Roteamento do chat "Equipe Helux" (022 R4). Atalho determinístico de
// segurança: sinais de alerta médico (R10) vão direto para a Medicina Esportiva.

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Um padrão por sinal da lista fechada `MEDICAL_RED_FLAGS` (personas.ts), sobre texto sem acento. */
const RED_FLAG_PATTERNS: RegExp[] = [
  /\b(dor|aperto|pressao)( forte| muito forte)? (no|na|do) peito/,
  /falta de ar.{0,40}(desproporcional|muito forte|em repouso|nao passa)/,
  /\b(quase )?desmai/,
  /(palpitac\w*.{0,40}tontur|tontur\w*.{0,40}palpitac)/,
  /perd\w*.{0,30}(forca|sensibilidade).{0,40}(subit|de repente|repentin)|(subit|de repente|repentin)\w*.{0,30}perd\w*.{0,30}(forca|sensibilidade)|perda subita/,
  /(dormencia|dormente|formigamento).{0,40}(nao passa|persist|um lado|lado do corpo|braco esquerdo)/,
  /dor de cabeca.{0,30}(subita|intensa|muito forte|explosiva)/,
  /inch\w*.{0,40}(muito|deform)|deformad/,
  /estalo.{0,60}(nao consig|sem conseguir|incapaz).{0,20}(apoiar|mover|andar|pisar)/,
  /urina.{0,20}(escura|marrom|cor de coca|coca-cola)/,
  /febre.{0,40}dor muscular.{0,15}(intensa|forte)|dor muscular (intensa|forte).{0,40}febre/,
]

/** Mensagem com sinal de alerta médico? Puro; usado antes do roteador (pula a chamada de IA). */
export function matchesMedicalRedFlag(message: string): boolean {
  const text = normalize(message)
  return RED_FLAG_PATTERNS.some(p => p.test(text))
}
