const express = require('express');
const Resume = require('../models/Resume');
const ChatHistory = require('../models/ChatHistory');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/analytics/dashboard
router.get('/dashboard', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        const [resumes, chats] = await Promise.all([
            Resume.find({ userId }).select('skills atsScore createdAt'),
            ChatHistory.find({ userId }).select('messages createdAt'),
        ]);

        const avgAtsScore =
            resumes.length > 0
                ? Math.round(resumes.reduce((sum, r) => sum + r.atsScore, 0) / resumes.length)
                : 0;

        const allSkills = resumes.flatMap((r) => r.skills);
        const skillFreq = {};
        for (const skill of allSkills) {
            skillFreq[skill] = (skillFreq[skill] || 0) + 1;
        }

        const topSkills = Object.entries(skillFreq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([skill, count]) => ({ skill, count }));

        const totalMessages = chats.reduce((sum, c) => sum + c.messages.length, 0);

        res.json({
            totalResumes: resumes.length,
            totalChats: chats.length,
            totalMessages,
            avgAtsScore,
            topSkills,
            latestResume: resumes[resumes.length - 1] || null,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/analytics/skills
router.get('/skills', protect, async (req, res) => {
    try {
        const { resumeId } = req.query;
        const filter = { userId: req.user._id };
        if (resumeId) filter._id = resumeId;

        const resumes = await Resume.find(filter).select('skills atsScore originalName');

        const skillFreq = {};
        for (const resume of resumes) {
            for (const skill of resume.skills) {
                skillFreq[skill] = (skillFreq[skill] || 0) + 1;
            }
        }

        const chartData = Object.entries(skillFreq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15)
            .map(([skill, count]) => ({ skill, count }));

        const allResumes = await Resume.find({ userId: req.user._id }).select('originalName atsScore skills skillRoadmap');

        res.json({
            chartData,
            fullResumes: allResumes, // Provide full data for detailed insights
            resumes: allResumes.map((r) => ({
                id: r._id,
                name: r.originalName,
                atsScore: r.atsScore,
                skillCount: r.skills.length,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
