import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/gemini-retry';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { side, argument, conversationHistory, caseData, currentVerdict } = await request.json();

    console.log('Received argument from Side:', side);
    console.log('Argument content:', argument);

    //conversation history for context
    const historyText = conversationHistory
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role === 'judge' ? 'AI Judge' : `Side ${side}`}: ${msg.content}`)
      .join('\n\n');

    //the prompt for the AI Judge
    const prompt = `You are an AI Judge presiding over a legal case. You must analyze arguments from both sides objectively and provide balanced feedback.

CASE INFORMATION:
Side A Position: ${caseData?.sideA?.primaryArgument || 'Not provided'}
Side A Evidence: ${caseData?.sideA?.detailedEvidence || 'Not provided'}

Side B Position: ${caseData?.sideB?.primaryArgument || 'Not provided'}
Side B Evidence: ${caseData?.sideB?.detailedEvidence || 'Not provided'}

CURRENT INTERIM VERDICT:
${currentVerdict?.summary || 'Initial analysis pending'}

CONVERSATION HISTORY:
${historyText}

LATEST ARGUMENT FROM SIDE ${side}:
${argument}

YOUR TASK:
1. Acknowledge the argument presented by Side ${side}
2. Evaluate its strengths and weaknesses objectively
3. Ask relevant follow-up questions or point out gaps in logic/evidence
4. Maintain judicial impartiality - do not show bias toward either side
5. Keep your response concise (2-4 sentences) and professional
6. If the argument is strong, acknowledge it. If it's weak, point out why respectfully.

Respond as the AI Judge:`;

    console.log('Generating AI Judge response...');

    // Use retry helper 
    const judgeResponse = await generateContentWithFallback(prompt, {
      maxRetries: 3,
    });

    console.log('AI Judge Response generated successfully');

    return NextResponse.json({
      success: true,
      response: judgeResponse,
      updatedVerdict: null, 
      message: 'Argument processed successfully'
    });

  } catch (error) {
    console.error('Error processing argument:', error);
    
    const errorMessage = error.status === 503 
      ? 'AI Judge is temporarily overloaded. Please try again in a few moments.'
      : error.message || 'An unexpected error occurred';
    
    return NextResponse.json({
      success: false,
      message: 'Failed to process argument',
      error: errorMessage
    }, { status: error.status || 500 });
  }
}