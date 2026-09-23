from datetime import time
import os

os.environ["YOLO_CONFIG_DIR"] = "/tmp"

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from huggingface_hub import hf_hub_download

import cv2
import numpy as np


# ============================================================
# MODEL CONFIGURATION
# ============================================================

MODEL_REPO = "MakZwane/automated-agri-drone-models"

crops_model_path = hf_hub_download(
    repo_id=MODEL_REPO,
    filename="mangethev1.pt"
)

disease_model_path = hf_hub_download(
    repo_id=MODEL_REPO,
    filename="cabbage_disease_seg_v1.pt"
)


# ============================================================
# LOAD MODELS
# ============================================================

crops_model = YOLO(crops_model_path)
disease_model = YOLO(disease_model_path)


# ============================================================
# DISEASE CLASSES
# ============================================================

DISEASE_NAMES = {
    0: "Alternaria leaf spot",
    1: "Black rot",
    2: "Downy mildew",
}


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="Automated Agri Drone AI API",
    description="Crop detection, crop census and disease analysis API",
    version="2.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://automated-agri-drone.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HELPER — READ IMAGE
# ============================================================

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


# ============================================================
# HELPER — CROP DETECTION
# ============================================================

def detect_crops(frame):
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

            # Keep coordinates inside the image
            x1 = max(0, min(x1, image_width - 1))
            y1 = max(0, min(y1, image_height - 1))
            x2 = max(0, min(x2, image_width))
            y2 = max(0, min(y2, image_height))

            crops.append(
                {
                    "crop": class_name,
                    "confidence": round(confidence, 3),
                    "box": [
                        x1,
                        y1,
                        x2,
                        y2,
                    ],
                }
            )

    return crops


# ============================================================
# HELPER — DISEASE SEGMENTATION
# ============================================================

def segment_disease(frame):
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

        for index, box in enumerate(result.boxes):
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])

            disease_name = DISEASE_NAMES.get(
                class_id,
                "unknown",
            )

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0],
            )

            disease_data = {
                "disease": disease_name,
                "confidence": round(confidence, 3),
                "box": [
                    x1,
                    y1,
                    x2,
                    y2,
                ],
            }

            # ------------------------------------------------
            # SEGMENTATION MASK
            # ------------------------------------------------

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
                        image_width *
                        image_height
                    )

                    affected_area_percent = (
                        mask_pixels /
                        image_pixels
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


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "status": "AI backend running",
        "version": "2.0",
        "apis": {
            "crops": "/api/v1/crops/detect",
            "disease": "/api/v1/disease/segment",
            "analysis": "/api/v1/analysis/full",
            "census": "/api/v1/census",
        },
        "models": {
            "crop_detector": "mangethev1.pt",
            "disease_segmentation": "cabbage_disease_seg_v1.pt",
        },
    }


# ============================================================
# 1. CROP DETECTION
# ============================================================

@app.post("/api/v1/crops/detect")
async def detect_crops_endpoint(
    file: UploadFile = File(...)
):
    try:
        total_start = time.perf_counter()

        frame = await read_image(file)

        read_time = time.perf_counter()

        image_height, image_width = frame.shape[:2]

        crops = detect_crops(frame)

        inference_time = time.perf_counter()

        return {
            "image_width": image_width,
            "image_height": image_height,
            "crop_count": len(crops),
            "crops": crops,

            "timing": {
                "image_read_seconds": round(
                    read_time - total_start,
                    3
                ),
                "model_seconds": round(
                    inference_time - read_time,
                    3
                ),
                "total_seconds": round(
                    inference_time - total_start,
                    3
                )
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

# ============================================================
# 2. DISEASE SEGMENTATION
# ============================================================

@app.post("/api/v1/disease/segment")
async def segment_disease_endpoint(
    file: UploadFile = File(...)
):
    try:
        frame = await read_image(file)

        image_height, image_width = frame.shape[:2]

        diseases = segment_disease(frame)

        return {
            "image_width": image_width,
            "image_height": image_height,
            "disease_count": len(diseases),
            "diseases": diseases,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# 3. FULL ANALYSIS
# ============================================================

@app.post("/api/v1/analysis/full")
async def full_analysis(
    file: UploadFile = File(...)
):
    try:
        frame = await read_image(file)

        image_height, image_width = frame.shape[:2]

        # ----------------------------------------------------
        # STEP 1 — DETECT CROPS
        # ----------------------------------------------------

        crops = detect_crops(frame)

        analysis = []

        # ----------------------------------------------------
        # STEP 2 — ANALYZE EACH CROP
        # ----------------------------------------------------

        for crop_index, crop in enumerate(crops):

            x1, y1, x2, y2 = crop["box"]

            # Ignore invalid boxes
            if x2 <= x1 or y2 <= y1:
                continue

            crop_image = frame[
                y1:y2,
                x1:x2,
            ]

            if crop_image.size == 0:
                continue

            # Disease model works on the individual crop
            diseases = segment_disease(
                crop_image
            )

            # ------------------------------------------------
            # Convert disease coordinates from crop coordinates
            # back to original image coordinates
            # ------------------------------------------------

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
                    "disease_count": len(diseases),
                    "diseases": diseases,
                }
            )

        # ----------------------------------------------------
        # SUMMARY
        # ----------------------------------------------------

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

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# 4. CROP CENSUS
# ============================================================

@app.post("/api/v1/census")
async def crop_census(
    file: UploadFile = File(...)
):
    try:
        frame = await read_image(file)

        image_height, image_width = frame.shape[:2]

        crops = detect_crops(frame)

        # Count crops by type
        crop_summary = {}

        for crop in crops:
            crop_name = crop["crop"]

            if crop_name not in crop_summary:
                crop_summary[crop_name] = 0

            crop_summary[crop_name] += 1

        return {
            "image_width": image_width,
            "image_height": image_height,

            "total_crops": len(crops),

            "crop_summary": crop_summary,

            "crops": crops,

            "census_type": "single_image",

            "note": (
                "This is a single-image crop census. "
                "Multi-image field census with GPS and "
                "duplicate detection will be added later."
            ),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# LEGACY ENDPOINT
# ============================================================
# Kept temporarily so the current frontend continues working.
# We will remove/migrate this after the frontend is updated.

@app.post("/detect")
async def legacy_detect(
    file: UploadFile = File(...)
):
    try:
        frame = await read_image(file)

        image_height, image_width = frame.shape[:2]

        crops = detect_crops(frame)

        diseases = segment_disease(frame)

        return {
            "image_width": image_width,
            "image_height": image_height,

            "cabbage_count": len(crops),

            "cabbage_detections": [
                {
                    "class": crop["crop"],
                    "confidence": crop["confidence"],
                    "box": crop["box"],
                }
                for crop in crops
            ],

            "disease_count": len(diseases),

            "diseases": diseases,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )