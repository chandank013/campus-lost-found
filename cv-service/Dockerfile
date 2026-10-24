FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU first for efficient layer caching
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu torch torchvision

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir flask ultralytics opencv-python-headless pillow numpy

# Copy service code
COPY . .

# Ensure model weights are present
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

EXPOSE 5001

CMD ["python", "app.py"]
