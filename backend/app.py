from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np


app = FastAPI(
    title="Automated Agri Drone AI API",
    description="Real-time cabbage detection API",
    version="1.0"
)


# Allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://automated-agri-drone.vercel.app/"],  # change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Load trained cabbage model once
model = YOLO(
    "models/yolo11n.pt"
)



@app.get("/")
def home():

    return {
        "status": "AI backend running",
        "model": "cabbage_detector",
        "version": "1.0"
    }



@app.post("/detect")
async def detect(
    file: UploadFile = File(...)
):

    try:

        # Read uploaded image
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



        # Run YOLO inference
        results = model(
            frame,
            imgsz=320,
            conf=0.4,
            verbose=False
        )



        detections = []



        for result in results:


            for box in result.boxes:


                confidence = float(
                    box.conf[0]
                )


                class_id = int(
                    box.cls[0]
                )


                class_name = (
                    model.names[class_id]
                    if class_id in model.names
                    else "unknown"
                )



                x1, y1, x2, y2 = map(
                    int,
                    box.xyxy[0]
                )



                detections.append({

                    "class": class_name,

                    "confidence":
                        round(confidence, 3),

                    "box": [
                        x1,
                        y1,
                        x2,
                        y2
                    ]

                })



        return {

            "count":
                len(detections),

            "detections":
                detections

        }



    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )