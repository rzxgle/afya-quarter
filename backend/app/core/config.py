"""Configuração central da API.

Mantém os MESMOS campos e constantes do projeto Streamlit original
(config.py), porém a validação das credenciais do Jira é preguiçosa:
o modo `mock` roda sem nenhuma variável de ambiente do Jira.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Fonte de dados: "mock" (dados fictícios, sem Jira) ou "jira" (produção)
DATA_SOURCE = os.getenv("DATA_SOURCE", "mock").strip().lower()

# Credenciais do Jira (só necessárias quando DATA_SOURCE=jira)
JIRA_URL = os.getenv("JIRA_URL")
JIRA_EMAIL = os.getenv("JIRA_EMAIL")
JIRA_TOKEN = os.getenv("JIRA_TOKEN")

# Base pública para links de épicos/itens (usada pelo front)
JIRA_BROWSE_BASE = os.getenv(
    "JIRA_BROWSE_BASE", "https://medcel.atlassian.net/browse/"
)

# TTL do cache de dados do Jira, em segundos (equivalente ao ttl=300 original)
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "300"))

# CORS: origens liberadas para o front (separadas por vírgula)
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

# ---- Campos customizados do Jira (idênticos ao original) ----
EPIC_LINK_FIELD = "customfield_10006"
TEAM_FIELD = "customfield_10001"

TRANSBORDO_LABELS = {
    "LegadoTransbordoP126",
    "LegadoTransbordoP226",
    "TransbordoPI2AfyaOne",
}


def require_jira_creds():
    """Valida as credenciais do Jira só no momento de uso real."""
    if not all([JIRA_URL, JIRA_EMAIL, JIRA_TOKEN]):
        raise RuntimeError(
            "Faltam variáveis de ambiente do Jira "
            "(JIRA_URL, JIRA_EMAIL, JIRA_TOKEN). "
            "Defina-as ou rode com DATA_SOURCE=mock."
        )
