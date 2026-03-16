const express = require('express');
const ChatHistory = require('../models/ChatHistory');
const { protect } = require('../middleware/authMiddleware');
const { sendMessageToGroq } = require('../services/groqService');

const router = express.Router();

// @route   POST /api/chat/send
router.post('/send', protect, async (req, res) => {
    try {
        const { message, chatId } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        let chat;

        if (chatId) {
            chat = await ChatHistory.findOne({ _id: chatId, userId: req.user._id });
        }

        if (!chat) {
            chat = await ChatHistory.create({
                userId: req.user._id,
                title: message.substring(0, 50),
                messages: [],
            });
        }

        // Add user message
        chat.messages.push({ role: 'user', content: message });

        // Build history for Groq (last 10 messages)
        const history = chat.messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
        }));

        // Get AI response
        const aiReply = await sendMessageToGroq(history);

        // Add assistant message
        chat.messages.push({ role: 'assistant', content: aiReply });
        await chat.save();

        res.json({
            chatId: chat._id,
            reply: aiReply,
            messages: chat.messages,
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/chat/history
router.get('/history', protect, async (req, res) => {
    try {
        const chats = await ChatHistory.find({ userId: req.user._id })
            .sort({ updatedAt: -1 })
            .select('title updatedAt messages')
            .limit(20);
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/chat/history/:id
router.get('/history/:id', protect, async (req, res) => {
    try {
        const chat = await ChatHistory.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/chat/history/:id
router.delete('/history/:id', protect, async (req, res) => {
    try {
        await ChatHistory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
