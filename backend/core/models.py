from fastapi import Request


def get_crops_model(request: Request):
    return request.app.state.crops_model


def get_disease_model(request: Request):
    return request.app.state.disease_model