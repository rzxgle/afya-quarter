# Epic Quarter — Backend (FastAPI)

API que serve as telas **Quarter Tracking** e **Quarter Roadmap**.
Reusa a lógica de negócio do projeto Streamlit **sem alterar nenhum cálculo**.

## Como rodar (modo mock — sem Jira)
```bash
cd backend
cp .env.example .env          # DATA_SOURCE=mock já vem por padrão
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# ou: ./run.sh
```
- API: http://localhost:8000
- Docs (OpenAPI/Swagger): http://localhost:8000/docs

## Modo produção (Jira)
No `.env`:
```
DATA_SOURCE=jira
JIRA_URL=https://sua-instancia.atlassian.net
JIRA_EMAIL=...
JIRA_TOKEN=...
```
Nada mais muda: os mesmos endpoints passam a ler do Jira (com cache de 5 min).

## Testes
```bash
DATA_SOURCE=mock pytest -q
```

## Arquitetura
```
app/
  core/         # lógica de negócio COPIADA VERBATIM do projeto original
                # (workflow_rules, safe_metrics, data_processing, roadmap_processing,
                #  period_utils, label_options, project_options, sprint_config,
                #  dashboard_filters) — só os caminhos de import foram ajustados
  providers/
    mock_provider.py   # dados fictícios do protótipo (mesmo formato do Jira)
    jira_provider.py   # Jira real, sem Streamlit; TTLCache no lugar do st.cache_data
    __init__.py        # seletor por DATA_SOURCE
  services/
    pipeline.py        # porta fiel de app.py + management_view.py -> payloads JSON
  schemas.py           # modelos de resposta (contrato / OpenAPI)
  main.py              # rotas FastAPI + CORS
  core/config.py       # env; validação do Jira é preguiçosa (mock não precisa)
```

## O que mudou vs. o original (e o que NÃO mudou)
- **Não mudou:** nenhuma regra de cálculo. `core/` é o código original com imports
  reapontados. Os mesmos inputs produzem os mesmos números.
- **Mudou (isolamento do Streamlit):** o `@st.cache_data(ttl=300)` do `jira_client`
  virou um `TTLCache(ttl=300)`; a validação de credenciais deixou de rodar no import.

## Endpoints
Veja [`../docs/DATA_CONTRACT.md`](../docs/DATA_CONTRACT.md).
