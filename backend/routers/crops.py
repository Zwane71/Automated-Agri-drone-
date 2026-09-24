import time as timer

from fastapi import APIRouter, UploadFile, File, HTTPException

from services.image_service import read_image
from services.crop_service import detect_crops


router = APIRouter(
    prefix="/api/v1/crops",
    tags=["Crops"],
)


@router.post("/detect")
async def detect_crops_endpoint(
    file: UploadFile = File(...),
    crops_model=None,
):
    try:
        total_start = timer.perf_counter()

        frame = await read_image(file)

        read_time = timer.perf_counter()

        image_height, image_width = (
            frame.shape[:2]
        )

        crops = detect_crops(
            frame,
            crops_model,
        )

        inference_time = timer.perf_counter()

        return {
            "image_width": image_width,
            "image_height": image_height,
            "crop_count": len(crops),
            "crops": crops,
            "timing": {
                "image_read_seconds": round(
                    read_time - total_start,
                    3,
                ),
                "model_seconds": round(
                    inference_time - read_time,
                    3,
                ),
                "total_seconds": round(
                    inference_time - total_start,
                    3,
                ),
            },
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )