import os
import cv2
import numpy as np
from flask import Flask, request, jsonify
from detector import ItemDetector

app = Flask(__name__)

# Initialize YOLOv8 detector
detector = None

def get_detector():
    global detector
    if detector is None:
        model_path = os.environ.get('YOLO_MODEL_PATH', os.path.join(os.path.dirname(__file__), 'yolov8n.pt'))
        detector = ItemDetector(model_path=model_path)
    return detector

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'campus-lost-found-cv'})

@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file uploaded'}), 400

    file = request.files['image']
    file_bytes = file.read()
    
    # Decode image with OpenCV
    np_arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    if img is None:
        return jsonify({'error': 'Could not decode image'}), 400

    try:
        det = get_detector()
        result = det.detect(img)
        return jsonify({
            'category': result['category'],
            'color': result['color'],
            'confidence': result['confidence']
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'category': 'other',
            'color': None
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f'[Flask CV] Starting service on port {port}...')
    app.run(host='0.0.0.0', port=port)
