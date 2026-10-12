from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import (
    FRONTEND_URL,
    load_models,
)

from routers import (
    health,
    crops,
    disease,
    analysis,
    census,
    camera,
    camera_analysis,
    auth
)


app = FastAPI(
    title="Automated Agri Drone AI API",
    description=(
        "Crop detection, crop census "
        "and disease analysis API"
    ),
    version="2.1",
)


crops_model, disease_model = load_models()

app.state.crops_model = crops_model
app.state.disease_model = disease_model



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL.rstrip("/"),
        "https://gz0n8723-3000.inc1.devtunnels.ms",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(crops.router)
app.include_router(disease.router)
app.include_router(analysis.router)
app.include_router(census.router)
app.include_router(camera.router)
app.include_router(camera_analysis.router)