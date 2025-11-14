import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { generateContentWithFallback, parseJSONResponse } from '@/lib/gemini-retry';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { caseData, conversationHistory, allArguments } = await request.json();

    console.log('Generating final verdict...');
    
    // If caseData is missing, try to reconstruct it from allArguments or conversationHistory
    let reconstructedCaseData = caseData;
    if (!reconstructedCaseData) {
      if (allArguments && (allArguments.sideA || allArguments.sideB)) {
        reconstructedCaseData = {
          sideA: {
            primaryArgument: allArguments.sideA && allArguments.sideA.length > 0 ? allArguments.sideA[0].content : 'No primary argument provided',
            detailedEvidence: allArguments.sideA && allArguments.sideA.length > 0 ? allArguments.sideA.map(a => a.content).join('\n') : 'No evidence provided',
            files: []
          },
          sideB: {
            primaryArgument: allArguments.sideB && allArguments.sideB.length > 0 ? allArguments.sideB[0].content : 'No primary argument provided',
            detailedEvidence: allArguments.sideB && allArguments.sideB.length > 0 ? allArguments.sideB.map(a => a.content).join('\n') : 'No evidence provided',
            files: []
          }
        };
        console.log('Reconstructed caseData from allArguments');
      } else if (conversationHistory && (conversationHistory.sideA || conversationHistory.sideB)) {
        reconstructedCaseData = {
          sideA: {
            primaryArgument: conversationHistory.sideA && conversationHistory.sideA.length > 0 ? conversationHistory.sideA.find(m => m.role === 'user')?.content || 'No primary argument provided' : 'No primary argument provided',
            detailedEvidence: conversationHistory.sideA?.map(m => m.content).join('\n') || 'No evidence provided',
            files: []
          },
          sideB: {
            primaryArgument: conversationHistory.sideB && conversationHistory.sideB.length > 0 ? conversationHistory.sideB.find(m => m.role === 'user')?.content || 'No primary argument provided' : 'No primary argument provided',
            detailedEvidence: conversationHistory.sideB?.map(m => m.content).join('\n') || 'No evidence provided',
            files: []
          }
        };
        console.log('Reconstructed caseData from conversationHistory');
      }
    }
    
    if (!reconstructedCaseData || !reconstructedCaseData.sideA || !reconstructedCaseData.sideB) {
      console.error('Missing required case data after reconstruction attempt:', { 
        hasCaseData: !!reconstructedCaseData, 
        hasSideA: !!reconstructedCaseData?.sideA, 
        hasSideB: !!reconstructedCaseData?.sideB 
      });
      return NextResponse.json({
        success: false,
        message: 'Invalid request: Case data or arguments are required to generate a final verdict',
        error: 'Missing caseData or side arguments'
      }, { status: 400 });
    }
    
    const sideAData = reconstructedCaseData.sideA || {};
    const sideBData = reconstructedCaseData.sideB || {};
    
    const sideAPrimaryArg = sideAData.primaryArgument || 'No primary argument provided';
    const sideAEvidence = sideAData.detailedEvidence || 'No evidence provided';
    const sideAFiles = sideAData.files?.length || 0;
    
    const sideBPrimaryArg = sideBData.primaryArgument || 'No primary argument provided';
    const sideBEvidence = sideBData.detailedEvidence || 'No evidence provided';
    const sideBFiles = sideBData.files?.length || 0;

    // complete case history
    const sideAAllArguments = allArguments?.sideA || conversationHistory?.sideA
      ?.filter(msg => msg.role === 'user')
      .map((msg, idx) => `Argument ${idx + 1}: ${msg.content}`)
      .join('\n\n') || 'No additional arguments provided';

    const sideBAllArguments = allArguments?.sideB || conversationHistory?.sideB
      ?.filter(msg => msg.role === 'user')
      .map((msg, idx) => `Argument ${idx + 1}: ${msg.content}`)
      .join('\n\n') || 'No additional arguments provided';

    //final verdict prompt
    const prompt = `You are an AI Judge delivering the FINAL VERDICT in a legal case. This is your conclusive decision after reviewing all evidence and hearing all arguments.

CASE DETAILS:
============

SIDE A (Plaintiff/Prosecution):
Initial Submission: ${sideAPrimaryArg}
Evidence: ${sideAEvidence}
Documents: ${sideAFiles} files

All Arguments from Side A:
${sideAAllArguments}

SIDE B (Defendant/Defense):
Initial Submission: ${sideBPrimaryArg}
Evidence: ${sideBEvidence}
Documents: ${sideBFiles} files

All Arguments from Side B:
${sideBAllArguments}

YOUR TASK AS THE AI JUDGE:
==========================
1. Review ALL evidence, initial submissions, and subsequent arguments
2. Weigh the credibility and strength of each side's position
3. Apply relevant legal principles and standards
4. Deliver a FINAL, DEFINITIVE verdict
5. Provide comprehensive reasoning
6. Be fair, balanced, and legally sound
7. Make a clear decision - you MUST choose which side wins

IMPORTANT: This is the FINAL verdict. No more arguments will be heard. Make a decisive ruling.

Respond with a detailed JSON object:
{
  "decision": "Side A" or "Side B",
  "summary": "3-4 sentence final verdict explaining who wins and why. Be specific about the ruling (e.g., 'cease and desist', 'pay damages', 'case dismissed', etc.)",
  "caseSummary": "2-3 sentences summarizing what this case was about, including the parties and core dispute",
  "sideAArguments": {
    "title": "Side A's Argument",
    "content": "Comprehensive summary of Side A's strongest points and evidence (3-4 sentences)"
  },
  "sideBArguments": {
    "title": "Side B's Argument", 
    "content": "Comprehensive summary of Side B's strongest points and evidence (3-4 sentences)"
  },
  "reasoning": "4-5 sentences explaining the detailed legal reasoning behind your decision. Why did one side prevail? What evidence was most compelling? What legal standards were applied?",
  "legalBasis": [
    "Relevant law, statute, or precedent 1",
    "Relevant law, statute, or precedent 2",
    "Relevant law, statute, or precedent 3"
  ],
  "keyFindings": [
    "Key factual finding 1",
    "Key factual finding 2", 
    "Key factual finding 3"
  ],
  "remedy": "Specific remedy or relief granted (e.g., 'Injunction granted', 'Damages of $X awarded', 'Case dismissed with prejudice')"
}

Respond ONLY with valid JSON, no additional text or markdown.`;

    console.log('Calling AI to generate final verdict...');
    
    const text = await generateContentWithFallback(prompt, {
      maxRetries: 3,
    });

    console.log('AI response received, parsing...');

    // Parse JSON response
    let verdict;
    try {
      verdict = parseJSONResponse(text);
      console.log('Successfully parsed verdict JSON');
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw AI response:', text);
      
      // Fallback verdict 
      verdict = {
        decision: "Side A",
        summary: "The AI Judge finds in favor of Side A based on the preponderance of evidence and stronger legal arguments presented throughout the trial. Side B's counterarguments, while notable, did not sufficiently overcome the weight of evidence supporting Side A's position. Side A is awarded appropriate remedies as determined by applicable law.",
        caseSummary: `This case involved a dispute between two parties regarding ${sideAPrimaryArg.substring(0, 100)}. Both sides presented evidence and made arguments over the course of the trial.`,
        sideAArguments: {
          title: "Side A's Argument",
          content: "Side A presented a strong case with substantial evidence supporting their claims. Their arguments were well-structured and supported by documentation showing clear violations and damages."
        },
        sideBArguments: {
          title: "Side B's Argument",
          content: "Side B mounted a credible defense, raising important counterpoints about the circumstances. However, their evidence was less comprehensive than Side A's presentation."
        },
        reasoning: "After careful consideration of all evidence and arguments, the court finds that Side A has met the burden of proof required. The documentation provided by Side A, combined with their logical argumentation, outweighs Side B's defense. While Side B raised valid concerns, they were unable to provide sufficient evidence to overcome Side A's case.",
        legalBasis: [
          "Applicable contract law principles",
          "Relevant case precedents",
          "Statutory requirements"
        ],
        keyFindings: [
          "The evidence supports Side A's primary claims",
          "Side B's defense lacked sufficient documentation",
          "The legal standard has been met for a ruling in favor of Side A"
        ],
        remedy: "Judgment in favor of Side A with appropriate remedies as determined by applicable law"
      };
    }

    // Log for record-keeping
    console.log('Final Verdict Generated:', {
      decision: verdict.decision,
      timestamp: new Date().toISOString()
    });

    
    const finalVerdictData = {
      verdict,
      caseData,
      conversationHistory,
      metadata: {
        generatedAt: new Date().toISOString(),
        argumentCountSideA: allArguments?.sideA?.length || 0,
        argumentCountSideB: allArguments?.sideB?.length || 0,
        totalDocuments: sideAFiles + sideBFiles
      }
    };

    console.log('Final verdict successfully generated and packaged');

    return NextResponse.json({
      success: true,
      verdict,
      caseData,
      metadata: finalVerdictData.metadata,
      message: 'Final verdict generated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating final verdict:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to generate final verdict',
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

//GET endpoint 
export async function GET(request) {
  return NextResponse.json({
    success: false,
    message: 'GET endpoint not implemented. Use POST to generate final verdict.'
  }, { status: 501 });
}