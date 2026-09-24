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
)


app = FastAPI(
    title="Automated Agri Drone AI API",
    description=(
        "Crop detection, crop census "
        "and disease analysis API"
    ),
    version="2.1",
)


# ============================================================
# MODELS
# ============================================================

crops_model, disease_model = load_models()

app.state.crops_model = crops_model
app.state.disease_model = disease_model


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(health.router)
app.include_router(crops.router)
app.include_router(disease.router)
app.include_router(analysis.router)
app.include_router(census.router)
app.include_router(camera.router)
app.include_router(camera.router)
app.include_router(camera_analysis.router)