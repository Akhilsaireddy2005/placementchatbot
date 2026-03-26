const express = require('express');
const ChatHistory = require('../models/ChatHistory');
const { protect } = require('../middleware/authMiddleware');
const { sendMessageToGroq, sendStreamingMessageToGroq } = require('../services/groqService');

const router = express.Router();

// @route   POST /api/chat/send
router.post('/send', protect, async (req, res) => {
    try {
        const { message, chatId, stream: shouldStream } = req.body;

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

        if (shouldStream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Send chatId first
            res.write(`data: ${JSON.stringify({ chatId: chat._id })}\n\n`);

            const stream = await sendStreamingMessageToGroq(history);
            let fullReply = '';

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                fullReply += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }

            // Save to DB after stream finishes
            chat.messages.push({ role: 'assistant', content: fullReply });
            await chat.save();
            
            res.write('data: [DONE]\n\n');
            res.end();
            return;
        }

        // Get AI response (standard)
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
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
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
