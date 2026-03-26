require('dotenv').config();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testStreaming() {
    console.log('Testing streaming with model openai/gpt-oss-120b...');
    try {
        const stream = await groq.chat.completions.create({
            model: 'openai/gpt-oss-120b',
            messages: [
                { role: 'user', content: 'Say hello!' }
            ],
            stream: true,
            temperature: 1,
            max_completion_tokens: 8192,
            top_p: 1,
            reasoning_effort: 'medium'
        });

        console.log('Stream started:');
        for await (const chunk of stream) {
            process.stdout.write(chunk.choices[0]?.delta?.content || '');
        }
        console.log('\nStream finished');
    } catch (err) {
        console.error('\nStreaming Error:', err.message);
        if (err.status) console.error('Status:', err.status);
    }
}

testStreaming();
