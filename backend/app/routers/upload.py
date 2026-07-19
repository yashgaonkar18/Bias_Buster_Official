from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
from pathlib import Path
from ..utils.file_validation import save_upload_file, validate_csv_file
from ..utils.model_validation import safe_load_model_from_path
from ..db import get_session
from app.models.models import UploadRecord

router = APIRouter(prefix="/api")

@router.post("/upload", response_model=Any)
async def upload_files(
    dataset_file: UploadFile = File(...),
    model_file: UploadFile = File(...),
    experiment_id: int = Form(...),
    session: AsyncSession = Depends(get_session),
):
    from app.auth.dependencies import get_current_user
    from app.db import current_user_id
    from sqlalchemy import select
    from app.models.experiment import Experiment
    from app.models.workspace import Workspace
    
    uid = current_user_id.get()
    result = await session.execute(
        select(Experiment)
        .join(Workspace, Experiment.workspace_id == Workspace.id)
        .where(Experiment.id == experiment_id, Workspace.user_id == uid)
    )
    experiment = result.scalar_one_or_none()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    ds_ext = Path(dataset_file.filename).suffix.lower()
    md_ext = Path(model_file.filename).suffix.lower()

    if ds_ext != ".csv":
        raise HTTPException(status_code=400, detail="Dataset must be a .csv file")
    if md_ext not in {".pkl", ".joblib"}:
        raise HTTPException(status_code=400, detail="Model must be a .pkl or .joblib file")

    try:
        ds_path = await save_upload_file(dataset_file, subdir="datasets")
        md_path = await save_upload_file(model_file, subdir="models")

        df, _ = await validate_csv_file(ds_path)
        model_info = safe_load_model_from_path(md_path)

        from app.utils.column_normalizer import normalize_dataframe_columns
        df = normalize_dataframe_columns(df, model_info["model"])
        
        # Save the normalized DataFrame back to the CSV file
        # so subsequent services load the cleaned column names
        df.to_csv(ds_path, index=False)

    except ValueError as ve:
        for p in (locals().get("ds_path"), locals().get("md_path")):
            try:
                if p and Path(p).exists():
                    Path(p).unlink()
            except:
                pass
        raise HTTPException(status_code=400, detail=str(ve))

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}")

    # FIXED HERE ↓ store Boolean, no str() wrapping
    record = UploadRecord(
        dataset_filename = ds_path.name,
        original_dataset_filename = dataset_file.filename,
        model_filename = md_path.name,
        original_model_filename = model_file.filename,
        dataset_rows = int(df.shape[0]),
        dataset_columns = int(df.shape[1]),
        dataset_columns_list = df.columns.astype(str).tolist(),
        model_type = model_info["model_type"],
        model_supports_predict_proba = bool(model_info["supports_proba"]),
        user_id = uid,
        experiment_id = experiment_id,
    )

    session.add(record)
    await session.commit()
    await session.refresh(record)

    success = {
        "upload_id": record.id,
        "status": "success",
        "dataset_info": {
            "rows": df.shape[0],
            "columns": df.shape[1],
            "column_names": df.columns.tolist(),
        },
        "model_info": {
            "model_type": model_info["model_type"],
            "supports_predict_proba": model_info["supports_proba"],  # ✔ fixed typo
        },
        "next_step": "select_sensitive_attribute",
    }

    return JSONResponse(content=success)
