from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from services.image_service import read_image
from services.crop_service import detect_crops


router = APIRouter(
    prefix="/api/v1/census",
    tags=["Census"],
)


@router.post("")
async def crop_census(
    request: Request,
    file: UploadFile = File(...),
):
    """
    Count crops detected in a single image.
    """

    try:
        frame = await read_image(file)

        crops = detect_crops(
            frame,
            request.app.state.crops_model,
        )

        height, width = frame.shape[:2]

        crop_summary = {}

        for crop in crops:
            crop_name = crop["crop"]

            crop_summary[crop_name] = (
                crop_summary.get(crop_name, 0) + 1
            )

        return {
            "image_width": width,
            "image_height": height,
            "total_crops": len(crops),
            "crop_summary": crop_summary,
            "crops": crops,
            "census_type": "single_image",
            "note": (
                "This census counts detected crops "
                "in a single image."
            ),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )