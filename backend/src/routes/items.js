import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Item } from '../models/Item.js';
import { Notification } from '../models/Notification.js';
import { findTopMatches } from '../services/matcher.js';
import { hashAnswer, verifyAnswer } from '../utils/security.js';
import { requireAuth } from '../middleware/auth.js';

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

// GET /api/items — List public feed items (strictly excludes contact and hashes)
router.get('/', async (req, res) => {
  try {
    const { type, category, status } = req.query;
    const filter = {};

    if (type && type !== 'all') {
      filter.type = type.toLowerCase();
    }
    if (category && category !== 'all') {
      const cat = category.toLowerCase();
      if (cat === 'headphone') {
        filter.category = { $in: ['headphone', 'hearphone'] };
      } else {
        filter.category = cat;
      }
    }
    if (status && status !== 'all') {
      filter.status = status.toLowerCase();
    } else if (!status) {
      filter.status = 'active'; // default active
    }

    const items = await Item.find(filter)
      .select('-contact -privateAnswerHash')
      .populate('owner', 'email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items', message: error.message });
  }
});

// GET /api/items/mine — Return current user's items (requires auth)
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user._id })
      .select('-contact -privateAnswerHash')
      .populate('owner', 'email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your items', message: error.message });
  }
});

// GET /api/items/:id — Single item detail (strictly excludes contact and hashes)
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .select('-contact -privateAnswerHash')
      .populate('owner', 'email');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve item', message: error.message });
  }
});

// POST /api/items — Create new item with photo upload (requires auth)
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
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
      owner: req.user._id
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
    
    // 1. Generate broadcast notification for all users on the main dashboard
    try {
      await Notification.create({
        type: 'broadcast',
        recipient: null, // to all users before login on main dashboard
        title: `New ${saved.type === 'lost' ? 'Lost' : 'Found'} Item Reported`,
        message: `${saved.description || `${saved.color} ${saved.category}`} was reported at ${saved.location}`,
        item: saved._id
      });

      // Notification exclusively for the uploader (the owner)
      if (saved.owner) {
        await Notification.create({
          type: 'report',
          recipient: saved.owner,
          title: `Your ${saved.type === 'lost' ? 'Lost' : 'Found'} Item Was Reported`,
          message: `Your report for "${saved.description || `${saved.color} ${saved.category}`}" at ${saved.location} is active.`,
          item: saved._id
        });
      }
    } catch (notifErr) {
      console.error('[Notification] Failed to create notification:', notifErr.message);
    }

    // 2. Evaluate matches with opposite-side active items
    // If items match, send targeted notifications ONLY to the item founder and the person who uploaded the lost item
    try {
      const oppositeType = saved.type === 'lost' ? 'found' : 'lost';
      const oppositeCandidates = await Item.find({
        type: oppositeType,
        status: 'active',
        _id: { $ne: saved._id }
      }).select('-contact -privateAnswerHash');

      const matches = findTopMatches(saved, oppositeCandidates);

      for (const match of matches) {
        const candidate = match.item;
        const candidateOwner = candidate.owner?._id || candidate.owner;
        const currentOwner = saved.owner;

        // Targeted match notification to current uploader
        if (currentOwner) {
          await Notification.create({
            type: 'match',
            recipient: currentOwner,
            title: `Potential Match for Your ${saved.type === 'lost' ? 'Lost' : 'Found'} Report!`,
            message: `A ${candidate.type} ${candidate.category} ("${candidate.description || candidate.category}") matches your report (${match.tier} • ${match.score}% score).`,
            item: candidate._id,
            matchedItem: saved._id,
            matchScore: match.score,
            matchTier: match.tier
          });
        }

        // Targeted match notification to the other party (founder or lost item poster)
        if (candidateOwner && String(candidateOwner) !== String(currentOwner)) {
          await Notification.create({
            type: 'match',
            recipient: candidateOwner,
            title: `New Potential Match for Your ${candidate.type === 'lost' ? 'Lost' : 'Found'} Report!`,
            message: `A newly reported ${saved.type} ${saved.category} ("${saved.description || saved.category}") matches your report (${match.tier} • ${match.score}% score).`,
            item: saved._id,
            matchedItem: candidate._id,
            matchScore: match.score,
            matchTier: match.tier
          });
        }
      }
    } catch (matchNotifErr) {
      console.error('[Notification] Failed to generate match notifications:', matchNotifErr.message);
    }

    // Return created item with contact and internal hashes omitted
    const responseItem = saved.toObject();
    delete responseItem.contact;
    delete responseItem.privateAnswerHash;

    res.status(201).json(responseItem);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ error: 'Failed to create item', message: error.message });
  }
});

// GET /api/items/:id/matches — Top 3 explainable opposite-side matches (public)
router.get('/:id/matches', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .select('-contact -privateAnswerHash');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const oppositeType = item.type === 'lost' ? 'found' : 'lost';

    // Query active items of opposite type, excluding current item, omitting contact and hashes
    const candidates = await Item.find({
      type: oppositeType,
      status: 'active',
      _id: { $ne: item._id }
    }).select('-contact -privateAnswerHash');

    const topMatches = findTopMatches(item, candidates);

    res.json(topMatches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute matches', message: error.message });
  }
});

// POST /api/items/:id/reveal-contact — Contact reveal endpoint (requires auth & optional question verification)
router.post('/:id/reveal-contact', requireAuth, async (req, res) => {
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

// PATCH /api/items/:id/return — Mark item as returned (requires auth, allowed ONLY for owner)
router.patch('/:id/return', requireAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .select('-contact -privateAnswerHash');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Verify ownership
    if (!item.owner || item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden. Only the owner of this item can mark it as returned.'
      });
    }

    item.status = 'returned';
    await item.save();

    // Automatically mark all notifications associated with this returned item as done/read
    try {
      await Notification.updateMany(
        {
          $or: [
            { item: item._id },
            { matchedItem: item._id }
          ]
        },
        {
          $set: { isResolved: true },
          $addToSet: { readBy: req.user._id }
        }
      );
    } catch (notifErr) {
      console.error('[Notification] Failed to mark notifications done for returned item:', notifErr.message);
    }

    const responseItem = item.toObject();
    delete responseItem.contact;
    delete responseItem.privateAnswerHash;

    res.json({ success: true, item: responseItem });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark item returned', message: error.message });
  }
});

export default router;
