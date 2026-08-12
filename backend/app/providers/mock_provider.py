"""Provider MOCK — devolve dados no MESMO formato de `fetch_issues`
(lista de issues estilo Jira, epic_map e epic_df), para que toda a
pipeline de cálculo rode de verdade sem precisar do Jira.

Os dados espelham o protótipo aprovado (Afya Bridge / Afya One, Q2).
O mock filtra os épicos pelos labels presentes na JQL, como o Jira faria.
"""

import re
from types import SimpleNamespace
import pandas as pd

from app.core.config import TEAM_FIELD, TRANSBORDO_LABELS

# ---- Dataset fictício (mesmo do protótipo) ----
# item: (key, summary, status, team_override|None, flagged)
def _epic(key, summary, team, project, labels, start, end,
          items, risk=False, risk_reason=""):
    return dict(key=key, summary=summary, team=team, project=project,
                labels=labels, start=start, end=end, items=items,
                risk=risk, risk_reason=risk_reason)


_L_BRIDGE_Q2 = ["EpicoPI2Legado"]
_L_TRANS = ["LegadoTransbordoP126"]
_L_ONE_Q2 = ["PI2AfyaOne"]

MOCK_EPICS = [
    # ---------------- Afya Bridge · Q2 ----------------
    _epic("APR-1204", "Trilha adaptativa de estudos", "Squad Aprender", "APR",
          _L_BRIDGE_Q2, "2026-04-13", "2026-06-05",
          [("APR-1210", "Motor de recomendação de conteúdo", "Deploy em PROD", None, False),
           ("APR-1211", "Tela de trilha personalizada", "Em QA", None, False),
           ("APR-1212", "Ajuste de dificuldade por desempenho", "Desenvolvimento", None, False),
           ("APR-1213", "Relatório de evolução do aluno", "A fazer", None, False),
           ("APR-1214", "Integração com banco de questões", "Em Homologação", None, False),
           ("APR-1219", "Legado descontinuado", "Cancelado", None, False)],
          risk=True,
          risk_reason="Dependência do time de Dados atrasou a base de recomendação."),

    _epic("APR-1231", "Onboarding do aluno de medicina", "Squad Aprender", "APR",
          _L_BRIDGE_Q2, "2026-04-13", "2026-05-22",
          [("APR-1240", "Fluxo de boas-vindas", "Concluído", None, False),
           ("APR-1241", "Tour guiado do produto", "Prod", None, False),
           ("APR-1242", "Checklist do primeiro acesso", "Concluído", None, False)]),

    # épico vazio e sem datas (demonstra "sem datas" no roadmap)
    _epic("APR-1255", "Painel de mentoria (novo)", "Squad Aprender", "APR",
          _L_BRIDGE_Q2, None, None, []),

    _epic("DESC-880", "Busca inteligente de residências", "Squad Descobrir", "DESC",
          _L_BRIDGE_Q2, "2026-04-13", "2026-06-20",
          [("DESC-890", "Indexação de programas", "Staging", None, False),
           ("DESC-891", "Filtros por especialidade", "Desenvolvimento", None, True),
           ("DESC-892", "Ranking de compatibilidade", "A fazer", None, False),
           ("DESC-893", "Página de detalhe do programa", "Code Review", None, False)]),

    _epic("DESC-905", "Comparador de instituições", "Squad Descobrir", "DESC",
          _L_BRIDGE_Q2, "2026-04-27", "2026-06-30",
          [("DESC-910", "Modelo de dados comparativo", "Concluído", None, False),
           ("DESC-911", "UI de comparação lado a lado", "Em QA", None, False),
           # item de outra squad -> "atividades compartilhadas"
           ("APR-1290", "Métricas de aprovação (compartilhada)", "Desenvolvimento", "Squad Aprender", False)]),

    _epic("CONV-410", "Novo fluxo de matrícula", "Squad Conversão", "CONV",
          _L_BRIDGE_Q2, "2026-04-13", "2026-05-30",
          [("CONV-420", "Checkout em etapa única", "Deploy em PROD", None, False),
           ("CONV-421", "Pagamento via Pix", "Prod", None, False),
           ("CONV-422", "Recuperação de carrinho", "Em Homologação", None, False),
           ("CONV-423", "Cupom de desconto", "Concluído", None, False),
           ("CONV-424", "Antifraude", "Em QA", None, False)]),

    # transbordo (label em TRANSBORDO_LABELS e presente na JQL de Bridge Q2)
    _epic("CONV-455", "Reengajamento de leads", "Squad Conversão", "CONV",
          _L_BRIDGE_Q2 + _L_TRANS, "2026-05-04", "2026-06-30",
          [("CONV-460", "Automação de e-mails", "Desenvolvimento", None, False),
           ("CONV-461", "Segmentação por interesse", "A fazer", None, False),
           ("CONV-462", "Landing de retorno", "A fazer", None, False)]),

    _epic("COREX-72", "Migração de autenticação (SSO)", "Squad Core", "COREX",
          _L_BRIDGE_Q2, "2026-04-13", "2026-06-13",
          [("COREX-80", "Provider OAuth unificado", "Deploy em PROD", None, False),
           ("COREX-81", "Migração de sessões legadas", "Desenvolvimento", None, True),
           ("COREX-82", "Revogação de tokens", "A fazer", None, False),
           ("COREX-83", "Auditoria de acesso", "A fazer", None, False)],
          risk=True,
          risk_reason="Janela de migração conflita com o congelamento de release."),

    _epic("APP-330", "Notificações push de aulas", "Squad App", "APP",
          _L_BRIDGE_Q2, "2026-04-13", "2026-05-16",
          [("APP-340", "Serviço de push", "Concluído", None, False),
           ("APP-341", "Preferências de notificação", "Prod", None, False),
           ("APP-342", "Deep link para a aula", "Concluído", None, False)]),

    _epic("APP-360", "Modo offline de conteúdo", "Squad App", "APP",
          _L_BRIDGE_Q2, "2026-05-11", "2026-06-30",
          [("APP-370", "Download de vídeos", "Em QA", None, False),
           ("APP-371", "Cache de PDFs", "Desenvolvimento", None, False),
           ("APP-372", "Sincronização de progresso", "A fazer", None, False),
           ("APP-373", "Gestão de armazenamento", "A fazer", None, False)]),

    # ---------------- Afya One · Q2 ----------------
    _epic("APR-2110", "Biblioteca unificada de conteúdos", "Squad One Aprender", "APR",
          _L_ONE_Q2, "2026-04-13", "2026-06-20",
          [("APR-2120", "Catálogo único", "Staging", None, False),
           ("APR-2121", "Player integrado", "Desenvolvimento", None, False),
           ("APR-2122", "Favoritos e histórico", "A fazer", None, False)]),

    _epic("APR-2140", "Certificados digitais", "Squad One Aprender", "APR",
          _L_ONE_Q2, "2026-04-27", "2026-06-06",
          [("APR-2150", "Geração de PDF assinado", "Concluído", None, False),
           ("APR-2151", "Validação por QR Code", "Em QA", None, False)]),

    _epic("COREX-210", "Data lake de eventos", "Squad One Core", "COREX",
          _L_ONE_Q2, "2026-04-13", "2026-06-30",
          [("COREX-220", "Pipeline de ingestão", "Desenvolvimento", None, True),
           ("COREX-221", "Modelagem dimensional", "A fazer", None, False),
           ("COREX-222", "Painel de qualidade de dados", "A fazer", None, False)],
          risk=True,
          risk_reason="Volume de eventos acima do previsto exige revisão de infra."),
]


def _labels_from_jql(jql):
    """Extrai os labels de um trecho `labels in (a, b, c)`."""
    m = re.search(r"labels\s+in\s*\(([^)]*)\)", jql, flags=re.IGNORECASE)
    if not m:
        return set()
    raw = m.group(1)
    return {x.strip().strip('"').strip("'") for x in raw.split(",") if x.strip()}


def _fields(**kw):
    return SimpleNamespace(**kw)


def fetch_issues(jql):
    wanted = _labels_from_jql(jql)
    epics = [
        e for e in MOCK_EPICS
        if not wanted or (set(e["labels"]) & wanted)
    ]

    epic_map = {e["key"]: e["summary"] for e in epics}

    epic_rows = []
    for e in epics:
        is_transbordo = any(l in TRANSBORDO_LABELS for l in e["labels"])
        epic_rows.append({
            "epic": e["key"],
            "team": e["team"],
            "project": e["project"],
            "epic_risk": bool(e["risk"]),
            "epic_risk_reason": e["risk_reason"] or "",
            "is_transbordo": is_transbordo,
            "start_date": e["start"],
            "end_date": e["end"],
        })

    epic_df = pd.DataFrame(
        epic_rows,
        columns=["epic", "team", "project", "epic_risk",
                 "epic_risk_reason", "is_transbordo", "start_date", "end_date"],
    )

    issues = []
    for e in epics:
        for (key, summary, status, team_override, flagged) in e["items"]:
            team_name = team_override or e["team"]
            flags = [_fields(value="Impedimento")] if flagged else None
            fields = _fields(
                summary=summary,
                parent=_fields(key=e["key"]),
                status=_fields(name=status),
                customfield_10500=flags,
            )
            # campo team dinâmico (customfield_10001)
            setattr(fields, TEAM_FIELD, _fields(name=team_name))
            issues.append(_fields(key=key, fields=fields))

    return issues, epic_map, epic_df
