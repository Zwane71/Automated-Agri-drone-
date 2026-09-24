import cv2
import numpy as np

from fastapi import HTTPException, UploadFile


async def read_image(file: UploadFile):
    image_bytes = await file.read()

    np_image = np.frombuffer(
        image_bytes,
        np.uint8,
    )

    frame = cv2.imdecode(
        np_image,
        cv2.IMREAD_COLOR,
    )

    if frame is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid image",
        )

    return frame