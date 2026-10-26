import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['broadcast', 'match', 'report'],
    required: true,
    default: 'broadcast'
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  // If recipient is null, this notification is a broadcast for all users (e.g. newly reported item).
  // If recipient is set, this is a targeted private notification (e.g. match between lost & found).
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true
  },
  // The relevant item (newly created item or matched target)
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  // The source/opposite item in case of a match
  matchedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  matchScore: {
    type: Number,
    default: null
  },
  matchTier: {
    type: String,
    default: null
  },
  // Users who have marked this notification as read
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for high performance queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
