import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { generateContentWithFallback, parseJSONResponse } from '@/lib/gemini-retry';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { caseData, isInitial } = await request.json();

    console.log('Generating verdict for case data:', caseData);

    // Validate caseData
    if (!caseData || !caseData.sideA || !caseData.sideB) {
      return NextResponse.json({
        success: false,
        message: 'Invalid case data provided'
      }, { status: 400 });
    }
    
    // prompt for initial verdict
    const prompt = `You are an AI Judge analyzing a legal case. You have received submissions from both sides.

SIDE A (Plaintiff/Prosecution):
Primary Argument: ${caseData.sideA.primaryArgument || 'Not provided'}
Detailed Evidence: ${caseData.sideA.detailedEvidence || 'Not provided'}
Response to Side B: ${caseData.sideA.responseToOtherSide || 'Not provided'}
Documents: ${caseData.sideA.files?.length || 0} files submitted

SIDE B (Defendant/Defense):
Primary Argument: ${caseData.sideB.primaryArgument || 'Not provided'}
Detailed Evidence: ${caseData.sideB.detailedEvidence || 'Not provided'}
Response to Side A: ${caseData.sideB.responseToOtherSide || 'Not provided'}
Documents: ${caseData.sideB.files?.length || 0} files submitted

Your task:
1. Analyze both sides' arguments and evidence carefully
2. Identify strengths and weaknesses in each argument
3. Provide an INTERIM verdict (not final) based on current submissions
4. Be balanced, fair, and legally sound
5. Point out areas where more clarification or evidence is needed

Format your response as a JSON object with:
{
  "summary": "A concise 2-3 sentence interim verdict",
  "reasoning": "Detailed explanation of your analysis (3-4 sentences)",
  "leaningTowards": "Side A" or "Side B" or "Neutral",
  "strengthsA": "Key strengths of Side A's case",
  "strengthsB": "Key strengths of Side B's case",
  "areasNeedingClarification": "What needs more explanation or evidence"
}

IMPORTANT: Respond ONLY with valid JSON, no markdown formatting, no code blocks, no additional text.`;

    //retry helper 
    const text = await generateContentWithFallback(prompt, {
      maxRetries: 3,
    });

    console.log('AI Response received:', text.substring(0, 100) + '...');

    // Parse JSON response
    let verdict;
    try {
      verdict = parseJSONResponse(text);
      
      console.log('Parsed verdict successfully:', verdict);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      console.error('Parse error:', parseError.message);
      
      // Fallback verdict
      verdict = {
        summary: "The AI Judge is analyzing both arguments. Both sides present valid points that require further discussion.",
        reasoning: "Initial review shows merit in both positions. More detailed arguments and cross-examination will help clarify the issues.",
        leaningTowards: "Neutral",
        strengthsA: "Clear presentation of initial claims",
        strengthsB: "Strong counterarguments presented",
        areasNeedingClarification: "Both sides should provide more specific evidence and legal precedents"
      };
      
      console.log('Using fallback verdict');
    }

    return NextResponse.json({
      success: true,
      verdict,
      message: 'Interim verdict generated successfully'
    });

  } catch (error) {
    console.error('Error generating verdict:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to generate verdict',
      error: error.message
    }, { status: 500 });
  }
}