const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const { protect } = require('../middleware/authMiddleware');
const {
    extractTextFromPDF,
    extractTextFromDOCX,
    extractSkills,
    getKeywordFrequency,
    calculateATSScore,
    extractStructure,
} = require('../services/resumeParser');
const { analyzeResumeWithAI } = require('../services/groqService');

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF and DOCX files are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// @route   POST /api/resume/upload
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const ext = path.extname(req.file.originalname).toLowerCase().slice(1);
        const filePath = req.file.path;

        let extractedText = '';
        if (ext === 'pdf') {
            extractedText = await extractTextFromPDF(filePath);
        } else if (ext === 'docx') {
            extractedText = await extractTextFromDOCX(filePath);
        }

        const initialSkills = extractSkills(extractedText);
        const keywordsFrequency = getKeywordFrequency(extractedText);
        const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
        
        // 1.5 Structural Analysis (Landmarks)
        const structure = extractStructure(extractedText);
        
        // Parsability check
        if (wordCount < 50) {
            return res.status(400).json({ message: 'Extracted text is too short. The resume might be an image or poorly formatted.' });
        }

        // 2. Deep AI Analysis with Structure
        const aiAnalysis = await analyzeResumeWithAI(extractedText, structure);
        
        // Combine or fallback
        const fallbackScore = calculateATSScore(extractedText, initialSkills);
        const atsScore = aiAnalysis?.atsScore || fallbackScore;

        console.warn(`[ATS Analysis] AI Score: ${aiAnalysis?.atsScore || 'N/A'} | Fallback Score: ${fallbackScore} | WordCount: ${wordCount}`);
        
        const finalSkills = aiAnalysis?.skills?.length > 0 ? aiAnalysis.skills : initialSkills;
        const summary = aiAnalysis?.summary || 'Resume uploaded and basic analysis complete.';
        const improvementTips = aiAnalysis?.improvementTips || [];
        const industryFit = aiAnalysis?.industryFit || 'Technical Role';

        const resume = await Resume.create({
            userId: req.user._id,
            filename: req.file.filename,
            originalName: req.file.originalname,
            fileType: ext,
            extractedText,
            skills: finalSkills,
            keywordsFrequency,
            atsScore,
            wordCount,
            summary,
            improvementTips,
            industryFit,
            skillRoadmap: aiAnalysis?.skillRoadmap || []
        });

        res.status(201).json(resume);
    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/resume/list
router.get('/list', protect, async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .select('-extractedText');
        res.json(resumes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/resume/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
        if (!resume) return res.status(404).json({ message: 'Resume not found' });
        res.json(resume);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/resume/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
        if (!resume) return res.status(404).json({ message: 'Resume not found' });

        const filePath = path.join(__dirname, '../uploads', resume.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await Resume.findByIdAndDelete(req.params.id);
        res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
