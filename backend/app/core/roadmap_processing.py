import pandas as pd
from datetime import date


def build_roadmap_dataframe(epic_progress, epic_df, epic_map):
    roadmap_df = epic_progress.merge(
        epic_df,
        on="epic",
        how="left",
        suffixes=("", "_meta")
    ).copy()

    roadmap_df["epic_name"] = roadmap_df["epic"].map(epic_map)

    roadmap_df["start_date"] = pd.to_datetime(roadmap_df["start_date"], errors="coerce")
    roadmap_df["end_date"] = pd.to_datetime(roadmap_df["end_date"], errors="coerce")

    roadmap_df["progress_label"] = (
        roadmap_df["progress"].fillna(0).round(1).astype(str) + "%"
    )

    roadmap_df["epic_full_name"] = (
        roadmap_df["epic"]
        + " - "
        + roadmap_df["epic_name"].fillna("")
    )

    roadmap_df["display_name"] = (
        roadmap_df["team"].fillna("Sem time")
        + " | "
        + roadmap_df["epic"]
    )

    def classify_roadmap_status(row):
        progress = row.get("progress", 0) or 0
        end = row.get("end_date")
        today = pd.to_datetime(date.today())

        if progress >= 100:
            return "Concluído"

        if pd.notna(end) and today > end:
            return "Atrasado"

        if row.get("epic_risk", False):
            return "Em risco"

        if row.get("is_transbordo", False):
            return "Transbordo"

        return "Em andamento"

    roadmap_df["roadmap_status"] = roadmap_df.apply(
        classify_roadmap_status,
        axis=1
    )

    roadmap_df["risk_label"] = roadmap_df["epic_risk"].apply(
        lambda x: "Sim" if x else "Não"
    )

    roadmap_df["transbordo_label"] = roadmap_df["is_transbordo"].apply(
        lambda x: "Sim" if x else "Não"
    )

    roadmap_df["date_range_label"] = (
        roadmap_df["start_date"].dt.strftime("%d/%m/%Y")
        + " → "
        + roadmap_df["end_date"].dt.strftime("%d/%m/%Y")
    )

    today = pd.to_datetime(date.today())

    def classify_temporal_status(row):
        progress = row.get("progress", 0) or 0
        start = row.get("start_date")
        end = row.get("end_date")

        if pd.isna(start) or pd.isna(end):
            return "Sem datas"

        if progress >= 100:
            return "Concluído"

        if today < start:
            return "Ainda não iniciou"

        if today > end:
            return "Prazo passou"

        return "Em janela"

    roadmap_df["temporal_status"] = roadmap_df.apply(
        classify_temporal_status,
        axis=1
    )
    
    roadmap_df.loc[
        roadmap_df["temporal_status"] == "Sem datas",
        "display_name"
    ] = (
        roadmap_df["display_name"] + " ⚠️ Sem datas"
    )

    roadmap_df["epic_url"] = (
        "https://medcel.atlassian.net/browse/" + roadmap_df["epic"]
    )

    roadmap_df = roadmap_df.sort_values(
        by=["team", "start_date", "end_date", "epic"],
        ascending=[True, True, True, True]
    ).reset_index(drop=True)

    return roadmap_df
