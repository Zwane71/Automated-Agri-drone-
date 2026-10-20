
from sqlalchemy import select, desc
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
)
from sqlalchemy.orm import Session

from pathlib import Path
from fastapi.responses import FileResponse
from uuid import uuid4

from core.database import get_db
from core.dependencies import get_current_user
from core.user_models import User
from core.farm_models import Farm
from core.field_models import Field
from core.analysis_models import AnalysisRecord
from services.image_service import read_image
from services.analysis_service import analyze_full_image


router = APIRouter(
    prefix="/api/v1/analysis",
    tags=["Analysis"],
)


@router.post("/full")
async def full_analysis(
    request: Request,
    file: UploadFile = File(...),
    field_id: int | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze an image and save its results and original image."""

    image_path = None

    try:
        # Verify the selected field belongs to the logged-in user.
        if field_id is not None:
            owned_field = db.scalar(
                select(Field)
                .join(Farm, Field.farm_id == Farm.id)
                .where(
                    Field.id == field_id,
                    Farm.owner_id == current_user.id,
                )
            )

            if owned_field is None:
                raise HTTPException(
                    status_code=404,
                    detail="Field not found.",
                )

        # Read and preserve the original uploaded image.
        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image is empty.",
            )

        await file.seek(0)
        frame = await read_image(file)

        # Keep the existing AI analysis pipeline unchanged.
        result = analyze_full_image(
            frame,
            request.app.state.crops_model,
            request.app.state.disease_model,
        )

        # Use a safe extension from an allowed list.
        original_extension = Path(file.filename or "").suffix.lower()
        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}

        extension = (
            original_extension
            if original_extension in allowed_extensions
            else ".jpg"
        )

        # Save images in backend/uploads/analysis.
        upload_dir = (
            Path(__file__).resolve().parents[1]
            / "uploads"
            / "analysis"
        )
        upload_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{uuid4().hex}{extension}"
        image_path = upload_dir / filename
        image_path.write_bytes(image_bytes)

        relative_image_path = f"uploads/analysis/{filename}"

        # Save the selected field with the analysis record.
        record = AnalysisRecord(
            owner_id=current_user.id,
            field_id=field_id,
            crop_count=result["crop_count"],
            diseased_crop_count=result["diseased_crop_count"],
            disease_count=result["disease_count"],
            results=result,
            image_path=relative_image_path,
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return result

    except HTTPException:
        db.rollback()

        if image_path is not None:
            image_path.unlink(missing_ok=True)

        raise

    except Exception as exc:
        db.rollback()

        if image_path is not None:
            image_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail="Analysis failed. Please try again.",
        ) from exc

@router.get("/history")
def get_analysis_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = db.scalars(
        select(AnalysisRecord)
        .where(AnalysisRecord.owner_id == current_user.id)
        .order_by(desc(AnalysisRecord.created_at))
    ).all()

    return [
        {
            "id": record.id,
            "field_id": record.field_id,
            "crop_count": record.crop_count,
            "diseased_crop_count": record.diseased_crop_count,
            "disease_count": record.disease_count,
            "results": record.results,
            "created_at": record.created_at.isoformat(),
        }
        for record in records
    ]


@router.get("/history/{record_id}/image")
def get_analysis_image(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the original image for the current user's analysis."""

    record = db.scalar(
        select(AnalysisRecord).where(
            AnalysisRecord.id == record_id,
            AnalysisRecord.owner_id == current_user.id,
        )
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis record not found.",
        )

    if not record.image_path:
        raise HTTPException(
            status_code=404,
            detail="No original image is available for this analysis.",
        )

    # Resolve paths relative to the backend directory.
    backend_dir = Path(__file__).resolve().parents[1]
    image_file = (backend_dir / record.image_path).resolve()
    upload_dir = (backend_dir / "uploads" / "analysis").resolve()

    # Prevent paths outside the analysis upload directory.
    if not image_file.is_relative_to(upload_dir):
        raise HTTPException(
            status_code=400,
            detail="Invalid image path.",
        )

    if not image_file.is_file():
        raise HTTPException(
            status_code=404,
            detail="Image file not found on the server.",
        )

    return FileResponse(
        path=image_file,
        media_type="image/jpeg",
        filename=f"analysis-{record.id}.jpg",
    )
