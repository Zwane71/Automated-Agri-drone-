from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from services.camera_service import (
    connect_camera,
    read_frame,
    generate_frames,
    release_camera,
)


router = APIRouter(
    prefix="/api/v1/camera",
    tags=["Camera"],
)


@router.get("/test")
async def test_camera(
    camera_url: str = Query(...),
):
    """
    Test whether an IP/RTSP/HTTP camera can be reached
    and whether it can provide a video frame.
    """

    camera = connect_camera(camera_url)

    if camera is None:
        return {
            "connected": False,
            "message": "Could not connect to the camera.",
        }

    try:
        frame = read_frame(camera)

        if frame is None:
            return {
                "connected": False,
                "message": (
                    "Camera connected but no video "
                    "frame was received."
                ),
            }

        height, width = frame.shape[:2]

        return {
            "connected": True,
            "message": "Camera connected successfully.",
            "image_width": width,
            "image_height": height,
        }

    finally:
        release_camera(camera)


@router.get("/stream")
async def camera_stream(
    camera_url: str = Query(...),
):
    """
    Stream an IP/RTSP/HTTP camera as MJPEG.
    """

    camera = connect_camera(camera_url)

    if camera is None:
        raise HTTPException(
            status_code=400,
            detail="Could not connect to the camera stream.",
        )

    release_camera(camera)

    return StreamingResponse(
        generate_frames(camera_url),
        media_type=(
            "multipart/x-mixed-replace; "
            "boundary=frame"
        ),
    )