# Design Tokens — Afya Quarter

Base da **Fase 3**. A fonte de verdade é `design-tokens.css` (variáveis CSS) e
`design-tokens.json` (para o `tailwind.config`). Derivados do protótipo aprovado.

## Marca
| Token | Hex | Uso |
|---|---|---|
| `--afya-brand` | `#CE0058` | Acento principal: logo, botão primário, KPI-título, foco, barra de progresso de épico |
| `--afya-brand-deep` | `#A80048` | Hover/estado pressionado |
| `--afya-brand-tint` | `#FCEBF2` | Fundos sutis do acento |
| `--afya-blue` | `#0057B8` | Acento de apoio |

> Regra de restrição: a magenta é usada com parcimônia (é o único acento "forte").
> O resto do dashboard é neutro para não cansar numa tela densa de dados.

## Neutros
`ink #333333` · `ink-2 #5B5B60` · `ink-3 #8A8A90` · `line #E6E4E6` ·
`line-soft #EEEEEE` · `surface #FFFFFF` · `bg #F6F5F6`

## Cores de tracking (status de item) — paleta discreta
Ajustadas para baixa saturação a pedido ("dashboard muito colorido"):

| Estado | Token | Hex |
|---|---|---|
| Concluído | `--st-done` | `#5B9E7D` |
| Em homologação | `--st-approval` | `#9488AE` |
| Em andamento | `--st-progress` | `#6E80A6` |
| A fazer | `--st-todo` | `#C7C7CD` |
| Cancelado | `--st-cancel` | `#E1E1E5` |

## Roadmap (Gantt) — status simplificado (3 estados)
| Estado | Token | Hex |
|---|---|---|
| Concluído | `--rm-concluido` | `#5B9E7D` |
| Em andamento | `--rm-andamento` | `#6E80A6` |
| Pendente (não iniciado) | `--rm-pendente` | `#C4C6CD` |
| Em risco (só contorno) | `--rm-risco` | `#C05F5F` |

Decisões do Gantt:
- **Atrasado** e **transbordo** não têm cor própria — ficam evidentes pelas datas
  (barra à esquerda da linha "Hoje" = atrasado; início antes do quarter = transbordo).
- **Em risco** = contorno fino (`--rm-risco`) na barra + detalhe no tooltip.
- A linha "Hoje" usa a magenta da marca (é chrome, não status).

## Tipografia
`--afya-font: "Afya Sans Pro","Afya Sans", Arial, Helvetica, sans-serif`

A **Afya Sans Pro** é a primária; **Arial** é a reserva. Hospedar o `.woff2` no
front para ativar a primária (hoje o protótipo cai no Arial).

## Forma
`--afya-radius: 12px` · sombra suave em `--afya-shadow`.
