# Contracts — UI (029)

## Rotas da web

| Rota | Conteúdo |
|:---|:---|
| `/checkin` | Resumo: peso de tendência + variação semanal, último registro de medidas, lembrete de medidas (FR-018) e os botões **Registrar peso** e **Registrar medidas**; link Histórico. O subtítulo "Mensal" sai. |
| `/checkin/peso` | `WeightForm`: campo de peso (vírgula decimal), data (padrão hoje, sem futuro), lembrete do protocolo de pesagem (FR-015). Confirmação via `Dialog` se `needsConfirmation` (FR-005). Se já há pesagem na data escolhida, avisa antes de salvar ("Já há uma pesagem neste dia (x kg). Salvar vai substituí-la."). Volta para `/checkin` (ou para a Nutrição com `?voltar=nutricao`). `?data=YYYY-MM-DD` abre a pesagem daquele dia para corrigir. |
| `/checkin/medidas` | `MeasurementForm` novo registro. Aceita `?voltar=nutricao` como hoje. |
| `/checkin/medidas/[id]` | `MeasurementForm` edição + botão Apagar (FR-013). |
| `/checkin/history` | Abas **Peso** e **Medidas**. Peso: `TrendChart` (pontos + linha de tendência, sem ligar gaps), lista de pesagens com editar/apagar (FR-006), aviso quando não há tendência (US1-4). Medidas: lista de registros com massa gorda/magra, cintura/altura e origem do %; gráfico de % com uma série por origem (FR-012). |

## `MeasurementForm`

- Seções: **Protocolo** (texto fixo da US4-1, recolhível), **Composição** (pescoço, cintura, quadril, ombros, peitoral), **Membros** (braço, coxa, panturrilha — cada um com dois campos lado a lado "Esq." e "Dir."), **Performance** (agachamento, supino, terra), **Observações**.
- Cada campo de medida tem um botão "Onde medir?" (`aria-label="Onde medir: <medida>"`) que abre um `Sheet` com a silhueta SVG e o texto da US4-2.
- Prévia ao vivo do % pela Marinha (já existe) com as mensagens de perfil incompleto / medidas insuficientes / inconsistentes.
- Opção recolhida **"Tenho uma medição de aparelho"** (FR-011): ao abrir, mostra `% de gordura` + `Segmented` de origem (Bioimpedância, Adipômetro, DEXA, Outro); salvar exige a origem.
- Data do registro (padrão hoje, sem futuro).
- Depois de salvar: se `navy_status ≠ ok` e havia cintura+pescoço, mostra o motivo antes de sair.

## Home — `CheckinCard`

- Itens: **Peso** (tendência; sem tendência, última pesagem com a data), **Variação 7 dias**, **Gordura** (efetivo, com rótulo de origem: "fita" ou o aparelho), **Agachamento/Supino** do último registro.
- Lembrete "Hora de refazer as medidas" quando `measurementsDue`.
- Botão único "Check-in" → `/checkin` (sem campo de pesagem na Home, clarify Q4).

## Nutrição — `PhaseSection`

- Botão **Recalibrar dieta** (secundário) com fase ativa.
- Ao tocar: chama o preview e abre um `Dialog`:
  - `proposta` → metas atuais → novas (kcal, P/C/G), taxa semanal pela tendência, variação da cintura e o motivo; botões **Aplicar** e **Descartar**.
  - `intervalo-curto` → "Você poderá recalibrar a partir de dd/mm."
  - `faltam-pesagens` → "Faltam pesagens para calcular a tendência: registre pelo menos 3 por semana." + link `/checkin/peso`.
  - `indisponivel` → o motivo (perfil incompleto).
- Após aplicar: atualiza metas e `CalibrationList`.
