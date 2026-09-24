from services.crop_service import detect_crops
from services.disease_service import segment_disease


def analyze_full_image(
    frame,
    crops_model,
    disease_model,
):
    image_height, image_width = frame.shape[:2]

    crops = detect_crops(
        frame,
        crops_model,
    )

    analysis = []

    for crop_index, crop in enumerate(
        crops
    ):
        x1, y1, x2, y2 = crop["box"]

        if x2 <= x1 or y2 <= y1:
            continue

        crop_image = frame[
            y1:y2,
            x1:x2,
        ]

        if crop_image.size == 0:
            continue

        diseases = segment_disease(
            crop_image,
            disease_model,
        )

        # Convert disease coordinates
        # back to original image coordinates.
        for disease in diseases:
            dx1, dy1, dx2, dy2 = disease["box"]

            disease["box"] = [
                dx1 + x1,
                dy1 + y1,
                dx2 + x1,
                dy2 + y1,
            ]

        analysis.append(
            {
                "crop_id": crop_index + 1,
                "crop": crop["crop"],
                "confidence": crop["confidence"],
                "box": crop["box"],
                "disease_count": len(
                    diseases
                ),
                "diseases": diseases,
            }
        )

    total_diseases = sum(
        item["disease_count"]
        for item in analysis
    )

    return {
        "image_width": image_width,
        "image_height": image_height,
        "crop_count": len(crops),
        "diseased_crop_count": sum(
            1
            for item in analysis
            if item["disease_count"] > 0
        ),
        "disease_count": total_diseases,
        "crops": analysis,
    }