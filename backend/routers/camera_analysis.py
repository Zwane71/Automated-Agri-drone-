from fastapi import APIRouter, HTTPException, Query, Request

from services.camera_analysis_service import (
    analyze_camera_frame,
)

router = APIRouter(
    prefix="/api/v1/camera",
    tags=["Camera AI"],
)


@router.get("/analyze")
async def analyze_camera(
    request: Request,
    camera_url: str = Query(...),
):
    """
    Capture one frame from the camera and run
    crop detection + disease analysis.
    """

    try:
        result = analyze_camera_frame(
            camera_url,
            request.app.state.crops_model,
            request.app.state.disease_model,
        )

        return result

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )