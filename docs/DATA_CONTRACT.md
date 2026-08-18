# Contrato de dados — Afya Quarter API

API criada na **Fase 2** (Opção B). Ela **não altera nenhum cálculo**: reusa as
funções de `domain/` e `utils/` do projeto Streamlit original e apenas as expõe
como JSON. Fonte de dados controlada por `DATA_SOURCE` (`mock` | `jira`).

Base URL (dev): `http://localhost:8000`
Docs interativas (OpenAPI): `http://localhost:8000/docs`

---

## GET `/api/options`
Popula os filtros do front (produtos, ciclos, VS/projeto). Sem parâmetros.

```json
{
  "products": [
    { "product": "Afya Bridge", "default_cycle": "Q2",
      "cycles": [ { "cycle": "Q2", "display_name": "Quarter 2", "quarter": "Q2", "year": 2026 } ] }
  ],
  "project_views": ["Todos os projetos", "VS Aprender", "VS Descobrir", "VS Conversão", "VS Core", "VS APP"]
}
```

## GET `/api/tracking` — tela **Quarter Tracking**
Espelha `app.py`.

| Param | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `product` | string | sim | ex.: `Afya Bridge` |
| `cycle` | string | não | ex.: `Q2`; se omitido usa o ciclo padrão (atual) |
| `project_view` | string | não | ex.: `VS Aprender`; padrão `Todos os projetos` |
| `teams` | string[] | não | repetível; omitir = todas as squads |

Resposta:
```json
{
  "filters": { "product","cycle","project_view","available_teams":[],"selected_teams":[] },
  "period":  { "quarter","year","label","start_date","end_date" },
  "kpis": {
    "cluster_progress": 35.3, "total_completed": 12, "total_items": 34,
    "quarter_time_progress": 100.0, "epics_at_risk": 2, "squads_at_risk": 5, "total_epics": 10
  },
  "teams": [
    {
      "team": "Squad Aprender", "completed_items": 4, "total_items": 8, "progress": 50.0,
      "epics": [
        {
          "epic": "APR-1204", "epic_name": "...", "owner_team": "Squad Aprender",
          "epic_status": "Desenvolvimento",
          "completed_items": 1, "total_items": 5, "progress": 20.0,
          "is_completed": false, "is_empty": false,
          "start_date": "2026-04-13", "end_date": "2026-06-05",
          "epic_risk": true, "epic_risk_reason": "...", "is_transbordo": false,
          "blocked_count": 0, "shared_activities": false,
          "breakdown": { "done":1,"approval":1,"inprogress":2,"todo":1,"cancelled":1 },
          "url": "https://.../browse/APR-1204",
          "items": [
            { "issue":"APR-1210","summary":"...","status":"Deploy em PROD",
              "team":"Squad Aprender","blocked":false,"kind":"done","url":"..." }
          ]
        }
      ]
    }
  ]
}
```
Notas de paridade:
- `breakdown` é `null` quando o épico está vazio (`is_empty`).
- `kind` do item ∈ `done | approval | inprogress | todo | cancelled` (mesma classificação de `workflow_rules`).
- `shared_activities` segue a regra original (compara a contagem global de itens válidos).
- Épicos vêm ordenados por `progress` dentro de cada squad (como no `render_teams`).

## GET `/api/roadmap` — tela **Quarter Roadmap**
Espelha `pages/management_view.py`.

| Param | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `product` | string | sim | |
| `cycle` | string | não | padrão: ciclo atual |
| `project_view` | string | não | padrão `Todos os projetos` |
| `teams` | string[] | não | omitir = todas |
| `only_with_dates` | bool | não | padrão `false` |

Resposta (resumo):
```json
{
  "filters": { "...", "only_with_dates": false },
  "period":  { "quarter","year","label","start_date","end_date","quarter_time_progress":100.0 },
  "sprints": [ { "name":"Sprint 1","start":"2026-04-13","end":"2026-04-24" } ],
  "kpis": { "completion_rate":20.0,"delayed":1,"completed":2,"in_progress":4,"not_started":3,"total_epics":10 },
  "roadmap": [
    { "team":"Squad Aprender","epic":"APR-1204","epic_name":"...","progress":20.0,
      "start_date":"2026-04-13","end_date":"2026-06-05",
      "epic_status":"Desenvolvimento","epic_status_kind":"inprogress",
      "temporal_status":"Em janela",
      "epic_risk":true,"epic_risk_reason":"...","is_transbordo":false,
      "progress_label":"20.0%","display_name":"Squad Aprender | APR-1204","epic_url":"..." }
  ],
  "teams": [ /* mesma estrutura de /api/tracking (visão operacional) */ ]
}
```
Notas de paridade:
- `epic_status` é o nome original do status do épico no Jira.
- `epic_status_kind` classifica esse valor pelas regras de `workflow_rules.py`: `done | inprogress | todo | cancelled`.
- `progress` continua sendo calculado pelas histórias filhas e não define o status do épico.
- `temporal_status`, `epic_risk` e `is_transbordo` são dimensões independentes do workflow.
- `delayed` conta épicos com prazo passado que não estejam classificados como `done`; ele pode se sobrepor aos KPIs de andamento e não iniciado.
- Épicos sem datas aparecem em `roadmap` (com `start/end = null`) e são omitidos quando `only_with_dates=true`.

## POST `/api/refresh`
Limpa o cache de dados (equivale ao botão "Atualizar dados"). Sem corpo.

## GET `/api/health`
`{ "status":"ok", "data_source":"mock" }`

---

### Observação sobre "hoje"
Os cálculos temporais usam `date.today()` (como no original). No dataset mock o
quarter é **Q2/2026**; se o relógio estiver após 30/06/2026, o comportamento
"encerrado/atrasado" é o correto — o mesmo que o Streamlit exibiria na mesma data.
