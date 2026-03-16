const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

// Comprehensive tech skills keyword list
const SKILLS_LIST = [
    // Programming Languages
    'javascript', 'python', 'java', 'c++', 'c#', 'typescript', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
    // Web
    'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
    // Databases
    'mongodb', 'mysql', 'postgresql', 'sql', 'redis', 'firebase', 'dynamodb', 'oracle',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'git', 'github', 'linux',
    // Data Science & ML
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'nlp', 'computer vision',
    // Mobile
    'android', 'ios', 'react native', 'flutter',
    // Other
    'rest api', 'graphql', 'microservices', 'agile', 'scrum', 'html', 'css', 'bootstrap', 'tailwind',
    'data structures', 'algorithms', 'system design', 'oops', 'cybersecurity', 'blockchain',
];

const extractTextFromPDF = async (filePath) => {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
};

const extractTextFromDOCX = async (filePath) => {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
};

const extractSkills = (text) => {
    const lowerText = text.toLowerCase();
    return SKILLS_LIST.filter((skill) => lowerText.includes(skill));
};

const getKeywordFrequency = (text) => {
    const words = text
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3);

    const freq = {};
    const stopWords = new Set([
        'that', 'this', 'with', 'from', 'have', 'been', 'will', 'also', 'more',
        'such', 'when', 'your', 'than', 'they', 'were', 'what', 'about', 'which',
    ]);

    for (const word of words) {
        if (!stopWords.has(word)) {
            freq[word] = (freq[word] || 0) + 1;
        }
    }

    // Return top 20 keywords
    return Object.fromEntries(
        Object.entries(freq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
    );
};

const extractStructure = (text) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const lowerText = text.toLowerCase();
    
    const structure = {
        hasAddress: /[\d]+[ \w]{3,30},? [ \w]{3,20},? [A-Z]{2} \d{5}/.test(text),
        hasLinkedIn: lowerText.includes('linkedin.com'),
        hasGitHub: lowerText.includes('github.com'),
        hasBulletPoints: /[•\-\*]\s/.test(text),
        hasDates: /\b(19|20)\d{2}\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(text),
        sectionsFound: []
    };

    const commonSections = [
        'education', 'experience', 'projects', 'skills', 'summary', 
        'certifications', 'awards', 'achievements', 'languages', 'interests',
        'employment', 'work history', 'professional profile', 'objective'
    ];

    commonSections.forEach(section => {
        if (lowerText.includes(section)) {
            structure.sectionsFound.push(section);
        }
    });

    // Detect capitalization of lines (proxy for headers)
    const capitalizedLines = lines.filter(line => line === line.toUpperCase() && line.length < 40).length;
    structure.headerClarity = capitalizedLines > 3 ? 'High' : capitalizedLines > 0 ? 'Medium' : 'Low';

    return structure;
};

const calculateATSScore = (text, skills) => {
    let score = 0;
    const lowerText = text.toLowerCase();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // 1. Skill Density (max 35 points) - 3 points per skill
    score += Math.min(skills.length * 3, 35);

    // 2. Action Verbs / Impact (max 25 points)
    const actionVerbs = ['spearheaded', 'managed', 'led', 'developed', 'implemented', 'optimized', 'increased', 'reduced', 'saved', 'created', 'designed', 'orchestrated', 'automated'];
    let verbCount = 0;
    actionVerbs.forEach(verb => {
        if (lowerText.includes(verb)) verbCount += 1;
    });
    score += Math.min(verbCount * 4, 25);

    // 3. Section Completeness (max 30 points)
    if (lowerText.includes('education') || lowerText.includes('university') || lowerText.includes('college')) score += 10;
    if (lowerText.includes('experience') || lowerText.includes('employment') || lowerText.includes('internship')) score += 10;
    if (lowerText.includes('project') || lowerText.includes('portfolio')) score += 10;

    // 4. Contact & Personal Branding (max 10 points)
    if (lowerText.includes('linkedin') || lowerText.includes('github') || lowerText.includes('portfolio')) score += 5;
    if (lowerText.includes('@') || lowerText.includes('phone') || lowerText.includes('email')) score += 5;

    // Word Count Penalties & Bonuses
    if (wordCount < 100) score = Math.max(score - 30, 0); // Too short
    else if (wordCount >= 400 && wordCount <= 1000) score += 5; // Ideal length
    else if (wordCount > 1500) score -= 10; // Too long

    return Math.min(Math.round(score), 100);
};

module.exports = {
    extractTextFromPDF,
    extractTextFromDOCX,
    extractSkills,
    getKeywordFrequency,
    calculateATSScore,
    extractStructure,
};
