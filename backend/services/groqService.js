const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are PlacementBot, an expert AI assistant specializing in college placement and career guidance for students. You help students with:

1. **Placement Preparation**: Interview tips, aptitude tests, coding rounds, group discussions
2. **Resume Building**: How to structure a resume, what to highlight, ATS optimization tips
3. **Company Information**: Hiring patterns, package details, recruitment processes of top companies
4. **Skill Development**: Technical skills (DSA, programming languages, frameworks), soft skills
5. **Career Paths**: IT companies, core engineering, MBA, civil services, startups
6. **Internships**: How to find and convert internships to full-time offers
7. **Offer Negotiation**: Salary negotiation, comparing offers

Always be encouraging, specific, and actionable. If a student shares details about their background, tailor your advice accordingly. Keep responses clear and structured with bullet points when listing items.`;

const sendMessageToGroq = async (messages) => {
    const completion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
        ],
        temperature: 1,
        max_completion_tokens: 8192,
        top_p: 1,
    });

    return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
};

const analyzeResumeWithAI = async (resumeText, structure = {}) => {
    const PROMPT = `
    You are a highly critical ATS (Applicant Tracking System) Expert and Senior Recruiter.
    Your task is to analyze the following resume text and its detected structural landmarks to provide a Differentiated ATS Score. 
    Do NOT give average scores unless they are perfectly justified.

    ### STRUCTURAL LANDMARKS DETECTED (Pre-processed):
    - Sections Found: ${structure.sectionsFound?.join(', ') || 'None'}
    - Bullet Points: ${structure.hasBulletPoints ? 'Yes' : 'No'}
    - Dates Detected: ${structure.hasDates ? 'Yes' : 'No'}
    - Header Clarity: ${structure.headerClarity}
    - Social Links: ${structure.hasLinkedIn ? 'LinkedIn Found, ' : ''}${structure.hasGitHub ? 'GitHub Found' : 'None'}

    ### SCORING RUBRIC (Total: 100)
    1. **Quantifiable Impact (30 pts)**: Penalize heavily for lack of metrics (%, $, numbers). Reward "Action Verbs" (Spearheaded, Optimized, Increased).
    2. **Structural Professionalism (25 pts)**: Is the hierarchy clear? Are dates and locations present? Is it readable by a machine? (Use the LANDMARKS above).
    3. **Skill Match & Depth (20 pts)**: Specific stacks, frameworks, and tools. Differentiate knowledge from fluff.
    4. **Experience Progression (15 pts)**: Logical career growth or project complexity.
    5. **Parsability (10 pts)**: Wall-of-text resumes get 0 here. Bullet points and clear headers get full points.

    ### SCORE RANGES:
    - 0-30: Incomplete, garbled, or "Wall of Text" with no structure.
    - 31-50: Weak entry-level. Lacks basic structural landmarks or quantifiable impact.
    - 51-70: Standard solid resume. Good structure but lacks high-impact metrics or advanced tech depth.
    - 71-85: Professional-grade. Clear metrics, great structure, strong tech depth.
    - 86-100: Elite Tier. Massive quantifiable impact, perfect structure, high parsability.

    ### TASK:
    Provide a structured response in VALID JSON format:
    - atsScore: (Number 0-100)
    - summary: (String) Provide a brutally honest assessment of the content AND structure.
    - skills: (Array of Strings) Technical and soft skills.
    - improvementTips: (Array of Strings) 3 specific tips to reach a 90+ score.
    - industryFit: (String) Best role/industry.
    - skillRoadmap: (Array of Objects) A 3-step detailed learning path.
        - Each object MUST have: { "topic": String (e.g., 'Master AWS Deployment'), "priority": "High"|"Medium", "tip": String (a specific 1-sentence actionable advice) }

    Resume Text:
    """
    ${resumeText.slice(0, 6000)}
    """
    
    IMPORTANT: Be critical. Focus on the structure and impact. Differentiate. Respond ONLY in JSON.
    `;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are a professional ATS Resume Analyzer. Critically evaluate structure and content.' },
                { role: 'user', content: PROMPT },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.5,
        });

        return JSON.parse(completion.choices[0]?.message?.content);
    } catch (error) {
        console.error('Groq AI Analysis Error:', error);
        return null;
    }
};

module.exports = { sendMessageToGroq, analyzeResumeWithAI };
