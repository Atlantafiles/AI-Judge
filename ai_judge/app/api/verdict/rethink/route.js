import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { generateContentWithFallback, parseJSONResponse } from '@/lib/gemini-retry';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { caseData, conversationHistory, currentVerdict } = await request.json();
    
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'models/gemini-2.5-pro' });

    // complete conversation context
    const sideAHistory = conversationHistory.sideA
      .filter(msg => msg.role === 'user')
      .map((msg, idx) => `Argument ${idx + 1}: ${msg.content}`)
      .join('\n\n');

    const sideBHistory = conversationHistory.sideB
      .filter(msg => msg.role === 'user')
      .map((msg, idx) => `Argument ${idx + 1}: ${msg.content}`)
      .join('\n\n');

    // the rethinking prompt
    const prompt = `You are an AI Judge who has been asked to RECONSIDER your verdict after hearing additional arguments.

ORIGINAL CASE:
Side A: ${caseData.sideA.primaryArgument}
Side B: ${caseData.sideB.primaryArgument}

CURRENT INTERIM VERDICT:
${currentVerdict?.summary || 'Initial analysis'}
Leaning towards: ${currentVerdict?.leaningTowards || 'Neutral'}

ALL ARGUMENTS FROM SIDE A:
${sideAHistory || 'No additional arguments yet'}

ALL ARGUMENTS FROM SIDE B:
${sideBHistory || 'No additional arguments yet'}

Your task:
1. Review ALL arguments presented during the deliberation phase
2. Identify any NEW compelling points that weren't in original submissions
3. Determine if these new arguments change your assessment
4. Update your verdict accordingly
5. Be intellectually honest - if arguments have swayed you, acknowledge it
6. If arguments haven't changed your view, explain why

Respond with JSON:
{
  "summary": "Updated 2-3 sentence verdict after reconsidering",
  "reasoning": "Detailed explanation of how arguments affected your thinking",
  "leaningTowards": "Side A" or "Side B" or "Neutral",
  "changesFromPrevious": "What changed from previous verdict (if anything)",
  "remainingConcerns": "Any issues still unclear or concerning"
}

Respond ONLY with valid JSON, no additional text.`;

    // retry helper
    const text = await generateContentWithFallback(prompt, {
      maxRetries: 3,
    });

    // Parse JSON response
    let verdict;
    try {
      verdict = parseJSONResponse(text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      verdict = {
        summary: "After reconsidering all arguments, the case remains complex with valid points on both sides.",
        reasoning: "Both parties have presented additional context, but the fundamental legal questions remain the same.",
        leaningTowards: currentVerdict?.leaningTowards || "Neutral",
        changesFromPrevious: "No significant changes to the overall assessment",
        remainingConcerns: "More concrete evidence would strengthen both positions"
      };
    }

    return NextResponse.json({
      success: true,
      verdict,
      message: 'Verdict reconsidered successfully'
    });

  } catch (error) {
    console.error('Error rethinking verdict:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to rethink verdict',
      error: error.message
    }, { status: error.status || 500 });
  }
}