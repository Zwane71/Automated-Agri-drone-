from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from services.image_service import read_image
from services.disease_service import segment_disease


router = APIRouter(
    prefix="/api/v1/disease",
    tags=["Disease"],
)


@router.post("/segment")
async def segment_disease_route(
    request: Request,
    file: UploadFile = File(...),
):
    """
    Run disease segmentation on an uploaded image.
    """

    try:
        frame = await read_image(file)

        diseases = segment_disease(
            frame,
            request.app.state.disease_model,
        )

        height, width = frame.shape[:2]

        return {
            "image_width": width,
            "image_height": height,
            "disease_count": len(diseases),
            "diseases": diseases,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )