
import os

os.environ["YOLO_CONFIG_DIR"] = "/tmp"

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

import cv2
import numpy as np


app = FastAPI(
    title="Automated Agri Drone AI API",
    description="Real-time cabbage detection and disease segmentation API",
    version="1.0"
)


# Allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://automated-agri-drone.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LOAD MODELS
# ============================================================

# Cabbage detection model
cabbage_model = YOLO("models/mangethev1.pt")

# Cabbage disease segmentation model
disease_model = YOLO("models/cabbage_disease_seg_v1.pt")


# Disease class names
DISEASE_NAMES = {
    0: "Alternaria leaf spot",
    1: "Black rot",
    2: "Downy mildew"
}


@app.get("/")
def home():
    return {
        "status": "AI backend running",
        "models": {
            "cabbage_detector": "mangethev1.pt",
            "cabbage_disease_segmentation": "cabbage_disease_seg_v1.pt"
        },
        "version": "1.0"
    }


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    try:
        # ========================================================
        # READ IMAGE
        # ========================================================

        image_bytes = await file.read()

        np_image = np.frombuffer(
            image_bytes,
            np.uint8
        )

        frame = cv2.imdecode(
            np_image,
            cv2.IMREAD_COLOR
        )

        if frame is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid image"
            )

        image_height, image_width = frame.shape[:2]


        # ========================================================
        # STEP 1 — CABBAGE DETECTION
        # ========================================================

        cabbage_results = cabbage_model(
            frame,
            imgsz=320,
            conf=0.4,
            verbose=False
        )

        detections = []

        for result in cabbage_results:

            for box in result.boxes:

                confidence = float(box.conf[0])
                class_id = int(box.cls[0])

                class_name = (
                    cabbage_model.names[class_id]
                    if class_id in cabbage_model.names
                    else "unknown"
                )

                x1, y1, x2, y2 = map(
                    int,
                    box.xyxy[0]
                )

                detections.append({
                    "class": class_name,
                    "confidence": round(confidence, 3),
                    "box": [
                        x1,
                        y1,
                        x2,
                        y2
                    ]
                })


        # ========================================================
        # STEP 2 — DISEASE SEGMENTATION
        # ========================================================

        disease_results = disease_model(
            frame,
            imgsz=640,
            conf=0.25,
            verbose=False
        )

        diseases = []

        for result in disease_results:

            if result.boxes is None:
                continue

            for index, box in enumerate(result.boxes):

                confidence = float(box.conf[0])
                class_id = int(box.cls[0])

                disease_name = DISEASE_NAMES.get(
                    class_id,
                    "unknown"
                )

                x1, y1, x2, y2 = map(
                    int,
                    box.xyxy[0]
                )

                disease_data = {
                    "disease": disease_name,
                    "confidence": round(confidence, 3),
                    "box": [
                        x1,
                        y1,
                        x2,
                        y2
                    ]
                }


                # =================================================
                # GET SEGMENTATION MASK
                # =================================================

                if result.masks is not None:
                    try:

                        mask = result.masks.data[index]

                        mask = mask.cpu().numpy()

                        # Convert mask to uint8
                        mask = (
                            mask * 255
                        ).astype(np.uint8)

                        # Resize mask to original image size
                        mask = cv2.resize(
                            mask,
                            (
                                image_width,
                                image_height
                            ),
                            interpolation=cv2.INTER_NEAREST
                        )

                        # Find mask pixels
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
                            2
                        )

                    except Exception:
                        pass

                diseases.append(
                    disease_data
                )


        # ========================================================
        # RESPONSE
        # ========================================================

        return {
            "image_width": image_width,
            "image_height": image_height,

            "cabbage_count": len(detections),

            "cabbage_detections": detections,

            "disease_count": len(diseases),

            "diseases": diseases
        }


    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

