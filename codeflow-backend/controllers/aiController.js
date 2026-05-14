const OpenAI = require('openai');

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY, // Ensure this is set in your .env
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "CodeFlow",
  },
});

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 5; // Reduced for free tier

// Available models for fallback
const AVAILABLE_MODELS = [
  "deepseek/deepseek-r1:free",
  "deepseek/deepseek-chat:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemma-2-9b-it:free"
];

exports.getAiHelp = async (req, res) => {
    const { 
        userMessage, 
        conversationHistory = [], 
        currentContext = {} 
    } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
        return res.status(400).json({ msg: 'User message is required.' });
    }

    // Rate limiting check
    const userId = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Clean old entries
    for (let [key, timestamp] of rateLimitStore.entries()) {
        if (timestamp < windowStart) {
            rateLimitStore.delete(key);
        }
    }
    
    // Check rate limit
    const userRequests = Array.from(rateLimitStore.entries())
        .filter(([key, timestamp]) => key.startsWith(userId) && timestamp > windowStart);
    
    if (userRequests.length >= MAX_REQUESTS_PER_MINUTE) {
        return res.status(429).json({ 
            msg: `Rate limit exceeded. Please wait ${Math.ceil((userRequests[0][1] + RATE_LIMIT_WINDOW - now) / 1000)} seconds before trying again.`,
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((userRequests[0][1] + RATE_LIMIT_WINDOW - now) / 1000)
        });
    }
    
    // Add current request
    rateLimitStore.set(`${userId}-${now}`, now);

    try {
        // Build conversation history with universal programming assistant context
        const messages = [
            {
                role: 'system',
                content: `
You are CodeFlow AI - a universal programming assistant and tutor. You help with ALL programming problems, algorithms, data structures, and coding concepts.

**IMPORTANT: BE CONCISE AND TO THE POINT** - You have limited response capacity, so focus on the most important information.

**RESPONSE RULES:**
1. **NEVER** provide complete corrected code solutions - give hints, pseudocode, or explain approaches
2. Keep responses under 500 words when possible
3. Use bullet points and clear formatting
4. Focus on the core concept being asked
5. If code is provided, analyze it specifically
6. Always mention time/space complexity

**Current Context:**
- Problem: ${currentContext.problemTitle || 'General programming help'}
- Language: ${currentContext.language || 'Any'}
- Code Provided: ${currentContext.code ? 'Yes' : 'No'}
${currentContext.code ? `\n**User's Current Code:**\n\`\`\`${currentContext.language}\n${currentContext.code}\n\`\`\`` : ''}
                `
            }
        ];

        // Add conversation history (limit to last 5 messages to save tokens)
        const recentHistory = conversationHistory.slice(-5);
        recentHistory.forEach(entry => {
            if (entry.role && entry.content) {
                messages.push({
                    role: entry.role,
                    content: entry.content
                });
            }
        });

        // Add current user message
        messages.push({
            role: 'user',
            content: userMessage
        });

        console.log("AI Request - User:", userId, "Models:", AVAILABLE_MODELS.length);

        // Try multiple models with fallback
        let lastError = null;
        
        for (const model of AVAILABLE_MODELS) {
            try {
                console.log("Trying model:", model);
                
                const completion = await openai.chat.completions.create({
                    model: model,
                    messages: messages,
                    max_tokens: 1500, // Reduced to save tokens
                    temperature: 0.7,
                });

                const aiResponse = completion.choices[0].message.content;
                
                console.log("Success with model:", model);
                return res.json({ 
                    help: aiResponse,
                    modelUsed: model
                });
                
            } catch (error) {
                console.log(`Model ${model} failed:`, error.message);
                lastError = error;
                
                // If it's a rate limit or server error, try next model
                if (error.status === 429 || error.status >= 500 || error.code === 'insufficient_quota') {
                    continue; // Try next model
                }
                
                // If it's a model-specific error, try next model
                if (error.status === 404) {
                    continue;
                }
                
                // For auth errors (401), break immediately as no model will work
                if (error.status === 401) {
                    break;
                }
            }
        }

        // If all models failed
        throw lastError;

    } catch (error) {
        console.error("All AI models failed:", error);
        
        // Remove the rate limit entry since request failed
        rateLimitStore.delete(`${userId}-${now}`);
        
        // --- CRITICAL FIX START ---
        // If OpenRouter returns 401 (Invalid API Key), convert it to 500.
        // This prevents the frontend from logging the user out.
        if (error.status === 401 || (error.response && error.response.status === 401)) {
            return res.status(500).json({ 
                msg: 'AI service authentication failed (Invalid API Key). Check server logs.',
                error: 'Internal Configuration Error'
            });
        }
        // --- CRITICAL FIX END ---

        if (error.status === 429 || error.code === 'insufficient_quota') {
            return res.status(429).json({ 
                msg: 'All AI services are currently busy. Please try again in a few minutes.',
                error: 'Service temporarily unavailable',
                suggestion: 'You can try refreshing the page or coming back later'
            });
        }

        res.status(500).json({ 
            msg: 'All AI services are currently unavailable. Please try again later.',
            error: 'Service unavailable'
        });
    }
};