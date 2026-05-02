const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/message.controller');

router.use(protect);

router.get('/unread-count', ctrl.getUnreadCount);
router.get('/contacts', ctrl.getContacts);
router.get('/inbox', ctrl.getInbox);
router.get('/conversations/:userId', ctrl.getConversation);
router.post('/', ctrl.sendMessage);
router.put('/:id/read', ctrl.markAsRead);

module.exports = router;
