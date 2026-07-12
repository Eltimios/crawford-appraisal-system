const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const data = await db('notifications')
      .select('*').where({ user_id: req.user.id })
      .orderBy('created_at', 'desc').limit(50);
    res.json({ notifications: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await db('notifications')
      .where({ id: req.params.id, user_id: req.user.id })
      .update({ is_read: true, read_at: new Date().toISOString() });
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const row = await db('notifications')
      .where({ user_id: req.user.id, is_read: false })
      .count('* as count').first();
    res.json({ count: Number(row?.count || 0) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread count.' });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    await db('notifications')
      .where({ user_id: req.user.id, is_read: false })
      .update({ is_read: true, read_at: new Date().toISOString() });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

module.exports = router;
