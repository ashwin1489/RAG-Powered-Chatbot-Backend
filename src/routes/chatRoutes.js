const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/chat', chatController.chat); // POST /api/chat { sessionId?, message }
router.get('/session/:sessionId/history', chatController.getHistory);
router.post('/session/:sessionId/clear', chatController.clearSession);
router.post("/chat/stream", chatController.chatStream);


module.exports = router;
