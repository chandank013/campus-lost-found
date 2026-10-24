import os
from ultralytics import YOLO
from color import extract_dominant_color

# Map COCO labels to Campus Lost & Found categories
LABEL_TO_CATEGORY = {
    'backpack': 'bag',
    'handbag': 'bag',
    'suitcase': 'bag',
    'cell phone': 'phone',
    'bottle': 'bottle',
    'umbrella': 'umbrella',
    'laptop': 'laptop',
    'book': 'book'
}

class ItemDetector:
    def __init__(self, model_path=None):
        # Load local YOLOv8 nano model
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), 'yolov8n.pt')
        self.model = YOLO(model_path)

    def detect(self, cv_image):
        """
        Runs YOLOv8 object detection on a BGR OpenCV image.
        Returns { category: str, color: str, bbox: list|None, confidence: float }
        """
        results = self.model(cv_image, conf=0.30, verbose=False)
        
        best_box = None
        best_label = 'other'
        best_conf = 0.0

        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = self.model.names.get(cls_id, '')
                
                # Check if this detection maps to one of our target categories
                mapped = LABEL_TO_CATEGORY.get(label, 'other')
                if mapped != 'other' and conf > best_conf:
                    best_conf = conf
                    best_label = mapped
                    best_box = box.xyxy[0].tolist()

        # Extract dominant color using the bounding box (or center crop fallback)
        color = extract_dominant_color(cv_image, bbox=best_box)

        return {
            'category': best_label,
            'color': color,
            'confidence': round(best_conf, 2),
            'bbox': best_box
        }
