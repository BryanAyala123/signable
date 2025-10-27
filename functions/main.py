"""Firebase HTTPS function for ASL recognition with OpenCV preprocessing."""
from __future__ import annotations

import base64
import io
import json
import os
import time
from typing import Any, Dict

import numpy as np
from PIL import Image
from firebase_admin import initialize_app
from firebase_functions import https_fn

# --- GLOBAL CONFIGURATION -------------------------------------------------

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

initialize_app()

try:
    import cv2  # type: ignore
except ModuleNotFoundError:
    cv2 = None  # type: ignore

IMG_SIZE = 128
MODEL = None
LABELS: Dict[int, str] = {
    0: "0", 1: "A", 2: "B", 3: "C", 4: "D", 5: "E", 6: "F", 7: "G", 8: "H", 9: "I",
    10: "J", 11: "K", 12: "L", 13: "M", 14: "N", 15: "O", 16: "P", 17: "Q",
    18: "R", 19: "S", 20: "T", 21: "U", 22: "V", 23: "W", 24: "X", 25: "Y", 26: "Z"
}

# --- MODEL LOADING --------------------------------------------------------

def load_model_if_needed():
    """Lazy load the ASL classifier model only once."""
    global MODEL
    if MODEL is None:
        try:
            print("🧠 Loading ASL classifier model...")
            import keras
            model_path = os.path.join(os.path.dirname(__file__), "asl_classifier.h5")
            MODEL = keras.models.load_model(model_path)
            print("✅ ASL classifier model loaded successfully.")
        except Exception as exc:
            print(f"💥 ERROR: Could not load ASL model: {exc}")
            raise
    return MODEL

# --- PREPROCESSING --------------------------------------------------------

def _decode_image(image_field: str) -> bytes:
    if "," in image_field:
        image_field = image_field.split(",", 1)[1]
    return base64.b64decode(image_field)

def _gaussian_kernel(size: int = 5, sigma: float = 2.0) -> np.ndarray:
    ax = np.arange(-(size // 2), size // 2 + 1)
    kernel_1d = np.exp(-(ax ** 2) / (2.0 * sigma ** 2))
    kernel_2d = np.outer(kernel_1d, kernel_1d)
    kernel_2d /= kernel_2d.sum()
    return kernel_2d.astype(np.float32)

def _convolve2d(image: np.ndarray, kernel: np.ndarray) -> np.ndarray:
    pad_h = kernel.shape[0] // 2
    pad_w = kernel.shape[1] // 2
    padded = np.pad(image, ((pad_h, pad_h), (pad_w, pad_w)), mode="edge")
    output = np.zeros_like(image, dtype=np.float32)
    for y in range(image.shape[0]):
        for x in range(image.shape[1]):
            region = padded[y:y+kernel.shape[0], x:x+kernel.shape[1]]
            output[y, x] = np.sum(region * kernel)
    return output

def _otsu_threshold(image: np.ndarray) -> float:
    hist = np.bincount(image.ravel(), minlength=256)
    total = image.size
    sum_total = float(np.dot(np.arange(256), hist))
    sum_b = 0.0
    weight_b = 0.0
    max_var, threshold = -1.0, 0.0

    for level in range(256):
        weight_b += hist[level]
        if weight_b == 0:
            continue
        weight_f = total - weight_b
        if weight_f == 0:
            break
        sum_b += level * hist[level]
        mean_b = sum_b / weight_b
        mean_f = (sum_total - sum_b) / weight_f
        var_between = weight_b * weight_f * (mean_b - mean_f) ** 2
        if var_between > max_var:
            max_var, threshold = var_between, level
    return threshold

def _preprocess_with_cv2(gray: np.ndarray) -> np.ndarray:
    blur = cv2.GaussianBlur(gray, (5, 5), 2)
    adaptive = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 11, 2
    )
    _, thresholded = cv2.threshold(
        adaptive, 70, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )
    return thresholded

def _preprocess_without_cv2(gray: np.ndarray) -> np.ndarray:
    kernel = _gaussian_kernel(5, 2.0)
    blurred = _convolve2d(gray, kernel)
    adaptive_kernel = _gaussian_kernel(11, 2.0)
    local_mean = _convolve2d(blurred, adaptive_kernel)
    adaptive = np.where(blurred > (local_mean - 2.0), 0, 255).astype(np.uint8)
    otsu = _otsu_threshold(adaptive)
    thresholded = np.where(adaptive > otsu, 0, 255).astype(np.uint8)
    return thresholded

def _preprocess_image(img_bytes: bytes) -> tuple[np.ndarray, str]:
    """Replicate OpenCV preprocessing & return both model input and base64 ROI."""
    image = Image.open(io.BytesIO(img_bytes)).convert("L")
    gray = np.array(image, dtype=np.uint8)

    processed = _preprocess_with_cv2(gray) if cv2 is not None else _preprocess_without_cv2(gray)

    # Save processed ROI for frontend preview
    buf = io.BytesIO()
    Image.fromarray(processed).save(buf, format="PNG")
    processed_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    resized = np.array(Image.fromarray(processed).resize((IMG_SIZE, IMG_SIZE)))
    normalized = resized.astype(np.float32) / 255.0
    reshaped = normalized.reshape((1, IMG_SIZE, IMG_SIZE, 1))

    return reshaped, processed_b64

# --- MAIN FUNCTION HANDLER ------------------------------------------------

@https_fn.on_request(memory=2048, timeout_sec=120, max_instances=10)
def recognize_sign(req: https_fn.Request) -> https_fn.Response:
    """Firebase HTTPS function to recognize ASL signs and return processed ROI."""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    if req.method == "OPTIONS":
        print("⚙️ Handling OPTIONS preflight request")
        return https_fn.Response("", status=204, headers=headers)

    print("✅ Received request")

    try:
        model = load_model_if_needed()
        request_json: Dict[str, Any] | None = req.get_json(silent=True)
        if not request_json or "image" not in request_json:
            return https_fn.Response(
                json.dumps({"error": "Missing 'image' field."}),
                status=400, headers=headers,
            )

        print("📦 Decoding base64 image...")
        img_bytes = _decode_image(request_json["image"])

        print("🧠 Preprocessing image...")
        reshaped, processed_b64 = _preprocess_image(img_bytes)

        print("🧮 Running model prediction...")
        result = model.predict(reshaped, verbose=0)
        label_idx = int(np.argmax(result, axis=1)[0])
        predicted_letter = LABELS.get(label_idx, "Unknown")
        print(f"✅ Predicted letter: {predicted_letter}")

        response = {
            "prediction": predicted_letter,
            "processed_roi_base64": processed_b64,
            "message": "Sign recognized successfully.",
        }
        return https_fn.Response(json.dumps(response), status=200, headers=headers)

    except Exception as exc:
        print(f"💥 Function error: {exc}")
        import traceback; traceback.print_exc()
        return https_fn.Response(
            json.dumps({"error": f"Server error: {exc}"}),
            status=500, headers=headers,
        )
