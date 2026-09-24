from fastapi import APIRouter, File, HTTPException, Request, UploadFile

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
):
    """
    Run complete crop detection and disease analysis.
    """

    try:
        frame = await read_image(file)

        result = analyze_full_image(
            frame,
            request.app.state.crops_model,
            request.app.state.disease_model,
        )

        return result

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )