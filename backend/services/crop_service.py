import cv2


def detect_crops(
    frame,
    crops_model,
):
    image_height, image_width = frame.shape[:2]

    results = crops_model(
        frame,
        imgsz=320,
        conf=0.4,
        verbose=False,
    )

    crops = []

    for result in results:
        if result.boxes is None:
            continue

        for box in result.boxes:
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])

            class_name = (
                crops_model.names[class_id]
                if class_id in crops_model.names
                else "unknown"
            )

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0],
            )

            # Keep coordinates inside image
            x1 = max(
                0,
                min(x1, image_width - 1),
            )

            y1 = max(
                0,
                min(y1, image_height - 1),
            )

            x2 = max(
                0,
                min(x2, image_width),
            )

            y2 = max(
                0,
                min(y2, image_height),
            )

            crops.append(
                {
                    "crop": class_name,
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
            )

    return crops