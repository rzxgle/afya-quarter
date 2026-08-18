import pandas as pd
from datetime import date
from app.core.workflow_rules import is_done, is_in_progress, is_ignored


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

    def classify_epic_status(status):
        status = status or ""
        if is_ignored(status):
            return "cancelled"
        if is_done(status):
            return "done"
        if is_in_progress(status):
            return "inprogress"
        return "todo"

    roadmap_df["epic_status"] = roadmap_df["epic_status"].fillna("")
    roadmap_df["epic_status_kind"] = roadmap_df["epic_status"].apply(
        classify_epic_status
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
        start = row.get("start_date")
        end = row.get("end_date")

        if is_done(row.get("epic_status", "") or ""):
            return "Concluído"

        if pd.isna(start) or pd.isna(end):
            return "Sem datas"

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
