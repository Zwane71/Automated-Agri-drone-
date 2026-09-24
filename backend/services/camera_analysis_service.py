import cv2

from services.analysis_service import analyze_full_image
from services.camera_service import (
    connect_camera,
    read_frame,
    release_camera,
)


def analyze_camera_frame(
    camera_url: str,
    crops_model,
    disease_model,
):
    """
    Connect to a camera, capture one frame,
    run the existing full AI analysis, then
    release the camera.
    """

    camera = connect_camera(camera_url)

    if camera is None:
        raise RuntimeError(
            "Could not connect to the camera."
        )

    try:
        frame = read_frame(camera)

        if frame is None:
            raise RuntimeError(
                "Camera connected but no frame was received."
            )

        result = analyze_full_image(
            frame,
            crops_model,
            disease_model,
        )

        return result

    finally:
        release_camera(camera)