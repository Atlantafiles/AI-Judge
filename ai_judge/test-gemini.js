// Load .env.local into process.env for standalone testing (no extra deps)
const fs = require('fs');
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  envFile.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/i);
    if (m) process.env[m[1]] = process.env[m[1]] || m[2];
  });
} catch (e) {
  // ignore if file doesn't exist
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

// The SDK accepts the api key as the first constructor arg
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModels() {
  const models = [
    'gemini-2.5-pro-latest',
    'gemini-1.5-pro-latest',
    'gemini-2.5-pro',
    'gemini-pro',
    'models/gemini-2.5-pro',
    'models/gemini-2.5-pro',
    'models/gemini-2.5-flash',
    'models/gemini-2.5-flash-lite',
  ];

  for (const modelName of models) {
    try {
      console.log(`\nTesting: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello');
      const response = await result.response;
      console.log(`✅ SUCCESS: ${modelName}`);
      console.log(`Response: ${response.text()}`);
      return modelName; // Return the working model
    } catch (error) {
      console.log(`❌ FAILED: ${modelName}`);
      console.log(`Error: ${error.message.substring(0, 100)}...`);
    }
  }
  
  console.log('\n❌ No models worked!');
}

testModels();