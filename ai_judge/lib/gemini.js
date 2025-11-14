import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_NAME = process.env.GEMINI_MODEL || 'models/gemini-2.5-pro';

export async function generateVerdict(sideAText, sideBText, sideAFiles, sideBFiles) {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `You are an AI judge analyzing a legal case. Provide a thorough analysis.

PLAINTIFF (SIDE A):
${sideAText}
${sideAFiles?.length > 0 ? `\nSupporting documents: ${sideAFiles.map(f => f.name).join(', ')}` : ''}

DEFENDANT (SIDE B):
${sideBText}
${sideBFiles?.length > 0 ? `\nSupporting documents: ${sideBFiles.map(f => f.name).join(', ')}` : ''}

Analyze this case and respond in JSON format with:
{
  "decision": "Your verdict (In favor of Plaintiff/Defendant)",
  "confidence": 75,
  "reasoning": ["reason 1", "reason 2", "reason 3"],
  "keyPoints": ["point 1", "point 2", "point 3"]
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('Failed to parse AI response');
}

export async function processArgument(conversationHistory, newArgumentA, newArgumentB) {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `You are an AI judge. Review these new arguments:

PREVIOUS CONVERSATION:
${conversationHistory.map(msg => `${msg.side}: ${msg.message}`).join('\n')}

NEW ARGUMENTS:
Plaintiff: ${newArgumentA || 'No new argument'}
Defendant: ${newArgumentB || 'No new argument'}

Respond as a judge considering these arguments. Keep response conversational and under 150 words.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateFinalVerdict(initialVerdict, argumentHistory) {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `You are an AI judge providing a final verdict.

INITIAL VERDICT:
${JSON.stringify(initialVerdict)}

ARGUMENTS PRESENTED:
${argumentHistory.map(msg => `${msg.side}: ${msg.message}`).join('\n')}

Provide final verdict in JSON format:
{
  "decision": "Final decision",
  "confidence": 80,
  "changes": ["consideration 1", "consideration 2"],
  "summary": "Final summary paragraph"
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('Failed to parse AI response');
}