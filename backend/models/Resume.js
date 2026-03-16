const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    extractedText: { type: String },
    skills: [{ type: String }],
    keywordsFrequency: { type: mongoose.Schema.Types.Mixed },
    atsScore: { type: Number },
    wordCount: { type: Number },
    summary: { type: String },
    improvementTips: [{ type: String }],
    industryFit: { type: String },
    skillRoadmap: [{
        topic: String,
        priority: String,
        tip: String
    }]
}, { timestamps: true });

const Resume = mongoose.model('Resume', resumeSchema);
module.exports = Resume;
