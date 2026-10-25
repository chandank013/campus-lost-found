import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Item } from '../models/Item.js';
import { findTopMatches } from '../services/matcher.js';
import {
  hashAnswer,
  verifyAnswer,
  generateManageCode,
  hashCode,
  verifyCode
} from '../utils/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `item-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter
});

const router = express.Router();

// GET /api/items — List items (strictly excludes contact and hashes)
router.get('/', async (req, res) => {
  try {
    const { type, category, status } = req.query;
    const filter = {};

    if (type && type !== 'all') {
      filter.type = type.toLowerCase();
    }
    if (category && category !== 'all') {
      filter.category = category.toLowerCase();
    }
    if (status && status !== 'all') {
      filter.status = status.toLowerCase();
    } else if (!status) {
      filter.status = 'active'; // default active
    }

    const items = await Item.find(filter)
      .select('-contact -privateAnswerHash -manageCodeHash')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items', message: error.message });
  }
});

// GET /api/items/:id — Single item detail (strictly excludes contact and hashes)
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .select('-contact -privateAnswerHash -manageCodeHash');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve item', message: error.message });
  }
});

// POST /api/items — Create new item with photo upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required (images under 5MB).' });
    }

    const {
      type,
      category,
      color,
      description,
      location,
      date,
      contact,
      currentLocation,
      privateQuestion,
      privateAnswer
    } = req.body;

    if (!type || !category || !color || !location || !contact) {
      // Clean up uploaded file if validation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        error: 'Missing required fields: type, category, color, location, and contact are required.'
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // Generate one-time item manage code
    const manageCode = generateManageCode();
    const manageCodeHash = hashCode(manageCode);

    const itemData = {
      type,
      category,
      color,
      description: description || '',
      location,
      date: date ? new Date(date) : new Date(),
      imageUrl,
      contact,
      currentLocation: currentLocation || '',
      status: 'active',
      manageCodeHash
    };

    // If found item has optional private verification question & answer
    if (type === 'found' && privateQuestion && privateAnswer) {
      const q = typeof privateQuestion === 'string' ? privateQuestion.trim() : '';
      const a = typeof privateAnswer === 'string' ? privateAnswer.trim() : '';
      if (q && a) {
        itemData.privateQuestion = q;
        itemData.privateAnswerHash = hashAnswer(a);
      }
    }

    const newItem = new Item(itemData);
    const saved = await newItem.save();
    
    // Return created item with contact and internal hashes omitted, but manageCode returned ONCE
    const responseItem = saved.toObject();
    delete responseItem.contact;
    delete responseItem.privateAnswerHash;
    delete responseItem.manageCodeHash;
    responseItem.manageCode = manageCode;

    res.status(201).json(responseItem);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ error: 'Failed to create item', message: error.message });
  }
});

// GET /api/items/:id/matches — Top 3 explainable opposite-side matches
router.get('/:id/matches', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .select('-contact -privateAnswerHash -manageCodeHash');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const oppositeType = item.type === 'lost' ? 'found' : 'lost';

    // Query active items of opposite type, excluding current item, omitting contact and hashes
    const candidates = await Item.find({
      type: oppositeType,
      status: 'active',
      _id: { $ne: item._id }
    }).select('-contact -privateAnswerHash -manageCodeHash');

    const topMatches = findTopMatches(item, candidates);

    res.json(topMatches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute matches', message: error.message });
  }
});

// POST /api/items/:id/reveal-contact — Contact reveal endpoint with optional verification challenge
router.post('/:id/reveal-contact', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .select('+contact +privateAnswerHash +verificationAttempts +lockoutUntil +privateQuestion');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // If item has private verification question configured
    if (item.privateQuestion && item.privateAnswerHash) {
      const now = new Date();
      if (item.lockoutUntil && item.lockoutUntil > now) {
        const remainingSeconds = Math.ceil((item.lockoutUntil.getTime() - now.getTime()) / 1000);
        return res.status(429).json({
          error: 'Verification locked',
          message: `Too many failed attempts. This item is temporarily locked for ${remainingSeconds} more seconds.`,
          locked: true,
          remainingSeconds
        });
      }

      const { answer } = req.body || {};
      const isCorrect = verifyAnswer(answer, item.privateAnswerHash);

      if (!isCorrect) {
        item.verificationAttempts = (item.verificationAttempts || 0) + 1;
        if (item.verificationAttempts >= 3) {
          item.lockoutUntil = new Date(Date.now() + 5 * 60 * 1000); // 5-minute lockout
          item.verificationAttempts = 0; // reset attempts for after lockout
          await item.save();
          return res.status(429).json({
            error: 'Verification locked',
            message: 'Too many incorrect attempts. This item is locked for 5 minutes.',
            locked: true,
            remainingSeconds: 300
          });
        }
        await item.save();
        return res.status(401).json({
          error: 'Incorrect answer',
          message: `Incorrect answer. ${3 - item.verificationAttempts} attempt(s) remaining.`,
          attemptsRemaining: 3 - item.verificationAttempts
        });
      }

      // Correct answer provided! Reset attempts and lockout
      item.verificationAttempts = 0;
      item.lockoutUntil = null;
      await item.save();
    }

    res.json({ contact: item.contact });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reveal contact', message: error.message });
  }
});

// PATCH /api/items/:id/return — Mark item as returned (requires one-time manage code)
router.patch('/:id/return', async (req, res) => {
  try {
    const { manageCode } = req.body || {};
    if (!manageCode || typeof manageCode !== 'string' || !manageCode.trim()) {
      return res.status(400).json({
        error: 'Manage code is required to mark this item as returned.'
      });
    }

    const item = await Item.findById(req.params.id)
      .select('+manageCodeHash -contact -privateAnswerHash');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.manageCodeHash && !verifyCode(manageCode, item.manageCodeHash)) {
      return res.status(403).json({
        error: 'Invalid manage code. Please verify the code provided when the item was reported.'
      });
    }

    item.status = 'returned';
    await item.save();

    const responseItem = item.toObject();
    delete responseItem.contact;
    delete responseItem.manageCodeHash;
    delete responseItem.privateAnswerHash;

    res.json({ success: true, item: responseItem });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark item returned', message: error.message });
  }
});

export default router;
