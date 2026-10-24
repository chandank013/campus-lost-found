import cv2
import numpy as np

CORE_COLORS = ['black', 'white', 'grey', 'red', 'blue', 'green', 'yellow', 'brown']

def extract_dominant_color(bgr_image, bbox=None):
    """
    Extracts the dominant color from the cropped bounding box (or center crop).
    Classifies pixels in HSV color space and returns the majority vote color.
    """
    h, w = bgr_image.shape[:2]
    
    if bbox is not None:
        x1, y1, x2, y2 = bbox
        x1, y1 = max(0, int(x1)), max(0, int(y1))
        x2, y2 = min(w, int(x2)), min(h, int(y2))
        crop = bgr_image[y1:y2, x1:x2]
    else:
        # Fallback to center 50% crop
        cx1, cy1 = int(w * 0.25), int(h * 0.25)
        cx2, cy2 = int(w * 0.75), int(h * 0.75)
        crop = bgr_image[cy1:cy2, cx1:cx2]

    if crop.size == 0:
        crop = bgr_image

    # Resize to speed up pixel counting
    crop = cv2.resize(crop, (100, 100))
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)

    h_channel = hsv[:, :, 0]
    s_channel = hsv[:, :, 1]
    v_channel = hsv[:, :, 2]

    votes = {color: 0 for color in CORE_COLORS}

    # Per-pixel classification
    for y in range(hsv.shape[0]):
        for x in range(hsv.shape[1]):
            hue = int(h_channel[y, x])
            sat = int(s_channel[y, x])
            val = int(v_channel[y, x])

            if val < 45:
                votes['black'] += 1
            elif sat < 35 and val > 190:
                votes['white'] += 1
            elif sat < 40 and 45 <= val <= 190:
                votes['grey'] += 1
            elif sat >= 40:
                # Chromatic hues
                if (hue < 10 or hue >= 165):
                    votes['red'] += 1
                elif 10 <= hue < 18:
                    # Orange mapping: dark -> brown/red, bright -> yellow
                    if val < 130:
                        votes['brown'] += 1
                    else:
                        votes['yellow'] += 1
                elif 18 <= hue < 35:
                    if 45 <= val < 140 and hue < 25:
                        votes['brown'] += 1
                    else:
                        votes['yellow'] += 1
                elif 35 <= hue < 85:
                    votes['green'] += 1
                elif 85 <= hue < 135:
                    votes['blue'] += 1
                elif 135 <= hue < 155:
                    # Purple / Violet mapping
                    votes['blue'] += 1
                elif 155 <= hue < 165:
                    # Pink mapping
                    votes['red'] += 1
                else:
                    votes['red'] += 1
            else:
                # Low saturation, moderate value (Beige / Muted grey)
                if val > 170:
                    votes['white'] += 1
                else:
                    votes['grey'] += 1

    # Majority vote
    dominant_color = max(votes, key=votes.get)
    return dominant_color
