import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Item } from '../models/Item.js';
import { findTopMatches } from '../services/matcher.js';

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

// GET /api/items — List items (excludes contact info)
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
      .select('-contact')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items', message: error.message });
  }
});

// GET /api/items/:id — Single item detail (excludes contact info)
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).select('-contact');
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
      currentLocation
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

    const newItem = new Item({
      type,
      category,
      color,
      description: description || '',
      location,
      date: date ? new Date(date) : new Date(),
      imageUrl,
      contact,
      currentLocation: currentLocation || '',
      status: 'active'
    });

    const saved = await newItem.save();
    
    // Return created item with contact omitted
    const responseItem = saved.toObject();
    delete responseItem.contact;

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
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const oppositeType = item.type === 'lost' ? 'found' : 'lost';

    // Query active items of opposite type, excluding current item, omitting contact
    const candidates = await Item.find({
      type: oppositeType,
      status: 'active',
      _id: { $ne: item._id }
    }).select('-contact');

    const topMatches = findTopMatches(item, candidates);

    res.json(topMatches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute matches', message: error.message });
  }
});

// POST /api/items/:id/reveal-contact — Dedicated contact reveal endpoint
router.post('/:id/reveal-contact', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).select('contact');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ contact: item.contact });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reveal contact', message: error.message });
  }
});

// PATCH /api/items/:id/return — Mark item as returned
router.patch('/:id/return', async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status: 'returned' },
      { new: true }
    ).select('-contact');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark item returned', message: error.message });
  }
});

export default router;
