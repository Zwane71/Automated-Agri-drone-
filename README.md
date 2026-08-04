# 🚁 Automated Agri Drone

An AI-powered precision agriculture system that detects cabbages in real time using a drone or mobile camera feed. The project combines a YOLO object detection model, a FastAPI backend, and a Next.js frontend to provide live crop detection and monitoring.

---

## 📖 Overview

The Automated Agri Drone project aims to assist farmers by using computer vision to detect cabbage crops from live camera feeds. The system processes images using a trained YOLO model and returns detected cabbages with confidence scores and bounding boxes.

---

## ✨ Features

- 🌱 Real-time cabbage detection
- 📷 Live camera streaming from a mobile device
- 🤖 YOLO11 object detection model
- ⚡ FastAPI REST API
- 🌐 Next.js dashboard
- 📦 JSON detection results
- 🚀 Cloud deployment using Render and Vercel
- 📱 Mobile-friendly interface

---

## 🏗 Project Architecture

```text
Phone Camera
      │
      ▼
Next.js Frontend
      │
      ▼
FastAPI Backend
      │
      ▼
YOLO11 Cabbage Detector
      │
      ▼
Detection Results
      │
      ▼
Live Dashboard
```

---

# 📂 Project Structure

```text
Automated-Agri-drone/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── models/
│   └── ...
│
├── frontend/
│   └── agridrone/
│
├── dataset/
│
├── notebooks/
│
├── runs/
│
├── results/
│
├── test_non_cabbage/
│
├── models/
│
├── README.md
└── .gitignore
```

---

# 🛠 Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- react-webcam

## Backend

- FastAPI
- Uvicorn
- OpenCV
- NumPy
- Ultralytics YOLO11

## AI

- YOLO11n
- PyTorch

---

# 📦 Installation

## Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Automated-Agri-drone.git

cd Automated-Agri-drone
```

---

# Backend Setup

Create a virtual environment

```bash
python -m venv env
```

Activate it

### Windows

```bash
env\Scripts\activate
```

### Linux/macOS

```bash
source env/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run the backend

```bash
uvicorn app:app --reload
```

---

# Frontend Setup

Navigate to the frontend

```bash
cd frontend/agridrone
```

Install packages

```bash
npm install
```

Create

```text
.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run

```bash
npm run dev
```

---

# Running Detection

Using the browser

Open

```
http://localhost:3000
```

Allow camera access and start detecting cabbages.

---

# Testing the AI Model

Run prediction on a folder of images

```bash
yolo detect predict model=runs/detect/train/weights/best.pt source=test_non_cabbage conf=0.5
```

---

# API

## Home

```
GET /
```

Response

```json
{
  "status": "AI backend running",
  "model": "cabbage_detector"
}
```

---

## Detect

```
POST /detect
```

Form Data

```
file
```

Response

```json
{
    "count":2,
    "detections":[
        {
            "class":"cabbage",
            "confidence":0.93,
            "box":[120,210,450,630]
        }
    ]
}
```

---

# Deployment

## Backend

Render

```
https://automated-agri-drone.onrender.com
```

---

## Frontend

Deploy using Vercel.

---

# Future Improvements

- Live video streaming
- Drone integration
- Weed detection
- Pest detection
- Disease detection
- Crop counting
- Crop health analysis
- GPS mapping
- Flight path planning
- Detection history
- User authentication
- AI analytics dashboard

---

# Model

Current model

- YOLO11n
- Custom-trained cabbage detector

---

# Performance Goals

- Real-time inference
- Low latency
- High precision
- Low false positives
- Mobile compatibility

---

# Contributors

Themba Makhohlisa

---

# License

This project is licensed under the MIT License.

---

## Acknowledgements

- Ultralytics YOLO
- FastAPI
- Next.js
- PyTorch
- OpenCV
