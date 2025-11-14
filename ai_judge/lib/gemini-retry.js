import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// List of models to try, in order of preference
const FALLBACK_MODELS = [
  process.env.GEMINI_MODEL || 'models/gemini-2.5-pro',
  'models/gemini-2.5-flash',
  'models/gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

/**
 * Retry logic with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Max number of retry attempts
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise<any>} Result of the function
 */
async function withRetry(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable 
      const isRetryable = 
        error.status === 503 || // Service Unavailable
        error.status === 429 || // Too Many Requests
        error.status === 500 || // Internal Server Error
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET';
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate exponential backoff with jitter
      const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(
        `[Attempt ${attempt + 1}/${maxRetries + 1}] Retrying after ${Math.round(delay)}ms...`,
        `Error: ${error.statusText || error.message}`
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Generating content with retry and model fallback
 * @param {string} prompt - The prompt to send to the model
 * @param {object} options - Additional options 
 * @returns {Promise<string>} The generated content text
 */
export async function generateContentWithFallback(prompt, options = {}) {
  const {
    maxRetries = 3,
    models = FALLBACK_MODELS,
  } = options;
  
  let lastError;
  
  // Trying each model in sequence
  for (let modelIdx = 0; modelIdx < models.length; modelIdx++) {
    const modelName = models[modelIdx];
    
    try {
      console.log(`[Model ${modelIdx + 1}/${models.length}] Attempting with: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Attempt with retry logic
      const result = await withRetry(
        () => model.generateContent(prompt),
        maxRetries
      );
      
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ Success with model: ${modelName}`);
      return text;
      
    } catch (error) {
      lastError = error;
      console.error(
        `❌ Failed with model: ${modelName}`,
        `Status: ${error.status || 'unknown'}`,
        `Message: ${error.message}`
      );
      
      //  try the next one
      if (modelIdx < models.length - 1) {
        console.log(`Trying next model...`);
        continue;
      }
    }
  }
  
  // All models failed
  throw new Error(
    `Failed to generate content after trying ${models.length} model(s) with ${maxRetries} retries each. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Parse JSON from AI response, handling markdown code blocks
 * @param {string} text - The response text
 * @returns {object} Parsed JSON object
 */
export function parseJSONResponse(text) {
  try {
    // Remove markdown code blocks if present
    let cleanText = text.trim();
    cleanText = cleanText.replace(/^```json\s*/i, '');
    cleanText = cleanText.replace(/^```\s*/, '');
    cleanText = cleanText.replace(/\s*```$/, '');
    cleanText = cleanText.trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error.message}\nResponse text: ${text.substring(0, 200)}`);
  }
}
