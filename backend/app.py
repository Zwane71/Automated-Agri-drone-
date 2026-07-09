from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import cv2
import numpy as np


app = FastAPI(
    title="Automated Agri Drone AI API"
)


# Load trained cabbage detector
model = YOLO("models/yolo11n.pt")


@app.get("/")
def home():
    return {
        "status": "AI backend running",
        "model": "cabbage_detector"
    }


@app.post("/detect")
async def detect(file: UploadFile = File(...)):

    image_bytes = await file.read()

    np_image = np.frombuffer(
        image_bytes,
        np.uint8
    )

    frame = cv2.imdecode(
        np_image,
        cv2.IMREAD_COLOR
    )


    results = model(frame)


    detections = []


    for result in results:
        boxes = result.boxes

        for box in boxes:

            confidence = float(box.conf[0])

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0]
            )

            detections.append({
                "class": "cabbage",
                "confidence": round(confidence, 3),
                "box": [
                    x1,
                    y1,
                    x2,
                    y2
                ]
            })


    return {
        "count": len(detections),
        "detections": detections
    }