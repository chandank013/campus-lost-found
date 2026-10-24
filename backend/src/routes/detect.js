import express from 'express';
import multer from 'multer';

const router = express.Router();

// In-memory Multer storage for detect previews (never writes to disk)
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed for tag detection.'));
    }
  }
});

router.post('/', memoryUpload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image file is required.' });
  }

  const flaskUrl = process.env.FLASK_SERVICE_URL || 'http://localhost:5001';

  try {
    const formData = new FormData();
    formData.append(
      'image',
      new Blob([req.file.buffer], { type: req.file.mimetype }),
      req.file.originalname || 'detect.jpg'
    );

    // Call Flask with an explicit 3-second abort timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const flaskResponse = await fetch(`${flaskUrl}/detect`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!flaskResponse.ok) {
      throw new Error(`Flask service responded with status ${flaskResponse.status}`);
    }

    const data = await flaskResponse.json();
    return res.json({
      category: data.category || 'other',
      color: data.color || null,
      confidence: data.confidence || 0
    });
  } catch (error) {
    // Graceful fallback: return 'other' without blocking user
    console.warn(`[Detect Proxy Warning] Flask service unavailable or timed out: ${error.message}. Falling back to manual.`);
    return res.json({
      category: 'other',
      color: null,
      fallback: true
    });
  }
});

export default router;
