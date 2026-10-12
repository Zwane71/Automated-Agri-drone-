import os

from dotenv import load_dotenv
from huggingface_hub import hf_hub_download
from ultralytics import YOLO


load_dotenv()

os.environ["YOLO_CONFIG_DIR"] = "/tmp"


FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000",
)

MODEL_REPO = os.getenv(
    "MODEL_REPO",
    "MakZwane/automated-agri-drone-models",
)


def load_models():
    crops_model_path = hf_hub_download(
        repo_id=MODEL_REPO,
        filename="mangethev1.pt",
    )

    disease_model_path = hf_hub_download(
        repo_id=MODEL_REPO,
        filename="cabbage_seg_v2.pt",
    )

    crops_model = YOLO(crops_model_path)
    disease_model = YOLO(disease_model_path)

    return crops_model, disease_model