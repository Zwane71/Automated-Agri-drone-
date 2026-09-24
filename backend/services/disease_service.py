import cv2
import numpy as np


def segment_disease(
    frame,
    disease_model,
):
    image_height, image_width = frame.shape[:2]

    results = disease_model(
        frame,
        imgsz=640,
        conf=0.25,
        verbose=False,
    )

    diseases = []

    for result in results:
        if result.boxes is None:
            continue

        for index, box in enumerate(
            result.boxes
        ):
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])

            disease_name = (
                disease_model.names[class_id]
                if class_id in disease_model.names
                else "unknown"
            )

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0],
            )

            disease_data = {
                "disease": disease_name,
                "confidence": round(
                    confidence,
                    3,
                ),
                "box": [
                    x1,
                    y1,
                    x2,
                    y2,
                ],
            }

            if result.masks is not None:
                try:
                    mask = result.masks.data[index]

                    mask = mask.cpu().numpy()

                    mask = (
                        mask * 255
                    ).astype(np.uint8)

                    mask = cv2.resize(
                        mask,
                        (
                            image_width,
                            image_height,
                        ),
                        interpolation=cv2.INTER_NEAREST,
                    )

                    mask_pixels = int(
                        np.count_nonzero(mask)
                    )

                    image_pixels = (
                        image_width
                        * image_height
                    )

                    affected_area_percent = (
                        mask_pixels
                        / image_pixels
                    ) * 100

                    disease_data[
                        "mask_pixels"
                    ] = mask_pixels

                    disease_data[
                        "affected_area_percent"
                    ] = round(
                        affected_area_percent,
                        2,
                    )

                except Exception:
                    pass

            diseases.append(
                disease_data
            )

    return diseases