from fastapi import APIRouter


router = APIRouter(
    tags=["Health"],
)


@router.get("/")
async def health_check():
    return {
        "status": "ok",
        "message": "Automated Agri Drone API is running",
    }