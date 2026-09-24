import cv2


def connect_camera(camera_url: str):
    """
    Open a connection to an IP/RTSP/HTTP camera.
    """
    camera = cv2.VideoCapture(camera_url)

    if not camera.isOpened():
        camera.release()
        return None

    return camera


def read_frame(camera):
    """
    Read one frame from an opened camera.
    """
    success, frame = camera.read()

    if not success or frame is None:
        return None

    return frame


def encode_frame(frame):
    """
    Convert an OpenCV frame into JPEG bytes.
    """
    success, buffer = cv2.imencode(
        ".jpg",
        frame,
    )

    if not success:
        return None

    return buffer.tobytes()


def release_camera(camera):
    """
    Safely release the camera connection.
    """
    if camera is not None:
        camera.release()


def generate_frames(camera_url: str):
    """
    Continuously read frames from the camera
    and yield them as an MJPEG stream.
    """
    camera = connect_camera(camera_url)

    if camera is None:
        return

    try:
        while True:
            frame = read_frame(camera)

            if frame is None:
                break

            frame_bytes = encode_frame(frame)

            if frame_bytes is None:
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + frame_bytes
                + b"\r\n"
            )

    finally:
        release_camera(camera)