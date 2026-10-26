import express from 'express';
import { Notification } from '../models/Notification.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Returns notifications:
 * - If logged in: ONLY notifications and matches belonging to this user (the owner)
 * - If before login (normal main dashboard): all upload broadcast notifications
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    // After login: show ONLY notifications where recipient is this user (the item owner)
    // Before login (normal main dashboard): show all campus upload notifications (recipient === null)
    const filter = req.user
      ? { recipient: req.user._id }
      : { recipient: null };

    const rawNotifications = await Notification.find(filter)
      .populate('item', 'category color description location imageUrl type status date')
      .populate('matchedItem', 'category color description location imageUrl type status date')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const currentUserIdStr = req.user ? req.user._id.toString() : null;

    let unreadCount = 0;
    const notifications = rawNotifications.map((notif) => {
      const readByList = notif.readBy || [];
      const userMarkedRead = currentUserIdStr
        ? readByList.some((id) => id.toString() === currentUserIdStr)
        : false;

      // Automatically resolve notifications whose items have been marked returned
      const isReturned = Boolean(
        notif.isResolved ||
        notif.item?.status === 'returned' ||
        notif.matchedItem?.status === 'returned'
      );

      const isRead = userMarkedRead || isReturned;

      // Deduct from unread count: returned items and read items do not count towards badge
      if (!isRead && !isReturned) {
        unreadCount++;
      }

      return {
        ...notif,
        isResolved: isReturned,
        isRead
      };
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications', message: error.message });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user) {
      await Notification.findByIdAndUpdate(id, {
        $addToSet: { readBy: req.user._id }
      });
    }

    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read', message: error.message });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for current user
 */
router.post('/read-all', optionalAuth, async (req, res) => {
  try {
    if (req.user) {
      await Notification.updateMany(
        { $or: [{ recipient: req.user._id }, { recipient: null }] },
        { $addToSet: { readBy: req.user._id } }
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read', message: error.message });
  }
});

export default router;
