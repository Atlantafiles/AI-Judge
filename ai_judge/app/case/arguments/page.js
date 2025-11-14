'use client';
import { useState, useEffect, useRef } from 'react';
import { Scale, Send, Paperclip, User, Bot, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ArgumentsPage() {
  const [caseData, setCaseData] = useState(null);
  const [interimVerdict, setInterimVerdict] = useState(null);
  const [isLoadingVerdict, setIsLoadingVerdict] = useState(true);
  const [sideAMessages, setSideAMessages] = useState([]);
  const [sideBMessages, setSideBMessages] = useState([]);
  const [sideAInput, setSideAInput] = useState('');
  const [sideBInput, setSideBInput] = useState('');
  const [argumentCount, setArgumentCount] = useState({ A: 0, B: 0 });
  const [isSubmittingA, setIsSubmittingA] = useState(false);
  const [isSubmittingB, setIsSubmittingB] = useState(false);
  const [showFinalVerdict, setShowFinalVerdict] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const sideAScrollRef = useRef(null);
  const sideBScrollRef = useRef(null);

  const MAX_ARGUMENTS = 5;

  useEffect(() => {
    // Clear any old session data 
    console.log('Component mounted - clearing old session data');
    // sessionStorage.removeItem('finalVerdict');
    // sessionStorage.removeItem('caseData');
    sessionStorage.removeItem('verdictMetadata');
    
    loadCaseAndGenerateVerdict();
  }, []);

  useEffect(() => {
    if (sideAScrollRef.current) {
      sideAScrollRef.current.scrollTop = sideAScrollRef.current.scrollHeight;
    }
    if (sideBScrollRef.current) {
      sideBScrollRef.current.scrollTop = sideBScrollRef.current.scrollHeight;
    }
  }, [sideAMessages, sideBMessages]);

    const loadCaseAndGenerateVerdict = async () => {
        try {
            setIsLoadingVerdict(true);
            setInterimVerdict(null);
            
            const sideADataStr = sessionStorage.getItem('sideAData');
            const sideBDataStr = sessionStorage.getItem('sideBData');
            
            if (!sideADataStr || !sideBDataStr) {
            alert('Case data not found. Please submit both sides first.');
            router.push('/');
            return;
            }
            
            const sideAData = JSON.parse(sideADataStr);
            const sideBData = JSON.parse(sideBDataStr);
            
            const completeCaseData = {
            sideA: {
                primaryArgument: sideAData.primaryArgument,
                detailedEvidence: sideAData.detailedEvidence,
                responseToOtherSide: sideAData.responseToOtherSide,
                files: sideAData.files || []
            },
            sideB: {
                primaryArgument: sideBData.primaryArgument,
                detailedEvidence: sideBData.detailedEvidence,
                responseToOtherSide: sideBData.responseToOtherSide,
                files: sideBData.files || []
            }
            };
            
            setCaseData(completeCaseData);
            
            // GENERATE VERDICT
            const response = await fetch('/api/verdict/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                caseData: completeCaseData,
                isInitial: true
            })
            });

            const result = await response.json();
            
            if (result.success) {
            setInterimVerdict(result.verdict);
            
            // Initialize conversations
            setSideAMessages([{
                role: 'judge',
                content: "Welcome, Side A. The court is now open for arguments.",
                timestamp: new Date().toISOString()
            }]);
            
            setSideBMessages([{
                role: 'judge',
                content: "Side B, please present your defense.",
                timestamp: new Date().toISOString()
            }]);
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Failed to load case: ${error.message}`);
        } finally {
            setIsLoadingVerdict(false);
        }
    };

  const handleSubmitArgument = async (side) => {
    const input = side === 'A' ? sideAInput : sideBInput;
    const setInput = side === 'A' ? setSideAInput : setSideBInput;
    const messages = side === 'A' ? sideAMessages : sideBMessages;
    const setMessages = side === 'A' ? setSideAMessages : setSideBMessages;
    const setIsSubmitting = side === 'A' ? setIsSubmittingA : setIsSubmittingB;

    if (!input.trim() || argumentCount[side] >= MAX_ARGUMENTS) return;

    setIsSubmitting(true);

    try {
      // user message 
      const userMessage = {
        role: 'user',
        content: input,
        timestamp: new Date().toISOString()
      };
      setMessages([...messages, userMessage]);
      setInput('');

      // argument count updation
      setArgumentCount(prev => ({ ...prev, [side]: prev[side] + 1 }));

      // AI response
      const response = await fetch('/api/argument', {  
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side,
          argument: input,
          conversationHistory: messages,
          caseData,
          currentVerdict: interimVerdict
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const result = await response.json();

      if (result.success) {
        // AI Judge response
        const judgeMessage = {
          role: 'judge',
          content: result.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, judgeMessage]);

        // Update verdict
        if (result.updatedVerdict) {
          setInterimVerdict(result.updatedVerdict);
        }

        // Check arguments count
        if (argumentCount[side] + 1 >= MAX_ARGUMENTS) {
          const maxReachedMessage = {
            role: 'system',
            content: `Side ${side} has reached the maximum number of arguments (${MAX_ARGUMENTS}). No more arguments can be submitted.`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, maxReachedMessage]);
        }
      } else {
        throw new Error(result.message || 'Failed to process argument');
      }
    } catch (error) {
      console.error('Error submitting argument:', error);
      const errorMessage = {
        role: 'system',
        content: `Failed to submit argument: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConcludeTrial = async () => {
    if (!confirm('Are you sure you want to conclude the trial? This will generate the final verdict based on all arguments presented.')) {
      return;
    }

    setIsConcluding(true);

    try {
      console.log('Requesting final verdict generation...');
      
      // final verdict
      const response = await fetch('/api/final-verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseData,
          conversationHistory: {
            sideA: sideAMessages,
            sideB: sideBMessages
          },
          allArguments: {
            sideA: sideAMessages.filter(msg => msg.role === 'user'),
            sideB: sideBMessages.filter(msg => msg.role === 'user')
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate final verdict');
      }

      const result = await response.json();
      console.log('Final verdict response:', result);
      
      if (result.success) {
        // Stores the verdict in sessionStorage
        sessionStorage.setItem('finalVerdict', JSON.stringify(result.verdict));
        sessionStorage.setItem('caseData', JSON.stringify(result.caseData));
        sessionStorage.setItem('verdictMetadata', JSON.stringify(result.metadata));
        
        console.log('Verdict stored in sessionStorage, navigating to final page...');
        
        router.push('/case/final');
      } else {
        throw new Error(result.message || 'Failed to generate final verdict');
      }
    } catch (error) {
      console.error('Error concluding trial:', error);
      alert(`Failed to conclude trial: ${error.message}. Please try again.`);
    } finally {
      setIsConcluding(false);
    }
  };

  const handleRequestRethinking = async () => {
    try {
      const response = await fetch('/api/verdict/rethink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseData,
          conversationHistory: {
            sideA: sideAMessages,
            sideB: sideBMessages
          },
          currentVerdict: interimVerdict
        })
      });

      if (!response.ok) {
        throw new Error('Failed to request rethinking');
      }

      const result = await response.json();
      
      if (result.success) {
        setInterimVerdict(result.verdict);
        alert(result.verdict.significantChange 
          ? 'The AI Judge has significantly reconsidered the case based on your arguments!' 
          : 'The AI Judge has reviewed the arguments. The interim verdict remains largely unchanged.');
      } else {
        throw new Error(result.message || 'Failed to rethink verdict');
      }
    } catch (error) {
      console.error('Error requesting rethinking:', error);
      alert(`Failed to request rethinking: ${error.message}. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="bg-linear-to-br from-blue-600 to-cyan-600 p-2 rounded-lg">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">AI Judge</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Case #12345</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Judge Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <div className="w-24 h-24 bg-linear-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Judge</h2>
              <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
                Deliberating Arguments
              </span>
            </div>

            {isLoadingVerdict ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Clock className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-600 text-center">
                  The AI Judge is actively analyzing all submitted evidence and arguments from both sides. 
                  Expect real-time feedback as the trial progresses.
                </p>
              </div>
            ) : interimVerdict ? (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Interim Verdict
                  </h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    {interimVerdict.summary || "Analyzing submitted materials..."}
                  </p>
                  
                  {showFinalVerdict && (
                    <div className="mt-4 pt-4 border-t border-slate-300 space-y-4">
                      {interimVerdict.reasoning && (
                        <div>
                          <p className="text-sm font-semibold text-slate-900 mb-2">Reasoning:</p>
                          <p className="text-sm text-slate-600">{interimVerdict.reasoning}</p>
                        </div>
                      )}
                      
                      {interimVerdict.leaningToward && (
                        <div>
                          <p className="text-sm font-semibold text-slate-900 mb-1">Current Leaning:</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            interimVerdict.leaningToward === 'Side A' ? 'bg-green-100 text-green-700' :
                            interimVerdict.leaningToward === 'Side B' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {interimVerdict.leaningToward}
                          </span>
                        </div>
                      )}

                      {interimVerdict.strengthsA && (
                        <div>
                          <p className="text-sm font-semibold text-slate-900 mb-1">Side A Strengths:</p>
                          <p className="text-sm text-slate-600">{interimVerdict.strengthsA}</p>
                        </div>
                      )}

                      {interimVerdict.strengthsB && (
                        <div>
                          <p className="text-sm font-semibold text-slate-900 mb-1">Side B Strengths:</p>
                          <p className="text-sm text-slate-600">{interimVerdict.strengthsB}</p>
                        </div>
                      )}

                      {interimVerdict.areasNeedingClarification && (
                        <div>
                          <p className="text-sm font-semibold text-slate-900 mb-1">Areas Needing Clarification:</p>
                          <p className="text-sm text-slate-600">{interimVerdict.areasNeedingClarification}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowFinalVerdict(!showFinalVerdict)}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg font-medium transition-colors border border-blue-200"
                >
                  {showFinalVerdict ? 'Hide' : 'View'} Detailed Interim Verdict
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-12 h-12 text-amber-600 mb-4" />
                <p className="text-slate-600 text-center">
                  No interim verdict available yet. Please wait for the AI Judge to analyze the case.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Arguments Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Side A */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Side A: Plaintiff/Prosecution</h3>
                  <p className="text-sm text-slate-600">Present your arguments and evidence.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-500">Arguments</span>
                  <div className="text-lg font-bold text-blue-600">
                    {argumentCount.A}/{MAX_ARGUMENTS}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={sideAScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {sideAMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${
                    msg.role === 'judge' ? 'bg-blue-100 text-blue-900' :
                    msg.role === 'user' ? 'bg-slate-700 text-white' :
                    'bg-amber-100 text-amber-900'
                  } rounded-2xl px-4 py-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.role === 'judge' ? <Bot className="w-4 h-4" /> : 
                       msg.role === 'user' ? <User className="w-4 h-4" /> :
                       <AlertCircle className="w-4 h-4" />}
                      <span className="text-xs font-semibold">
                        {msg.role === 'judge' ? 'AI Judge' : 
                         msg.role === 'user' ? 'Side A' : 'System'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <textarea
                  value={sideAInput}
                  onChange={(e) => setSideAInput(e.target.value)}
                  placeholder="Type your argument or counterpoint..."
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows={2}
                  disabled={argumentCount.A >= MAX_ARGUMENTS || isSubmittingA}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitArgument('A');
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-500">
                  {sideAInput.length}/600
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubmitArgument('A')}
                    disabled={!sideAInput.trim() || argumentCount.A >= MAX_ARGUMENTS || isSubmittingA}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                  >
                    {isSubmittingA ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side B */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Side B: Defendant/Defense</h3>
                  <p className="text-sm text-slate-600">Present your counterarguments and evidence.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-500">Arguments</span>
                  <div className="text-lg font-bold text-blue-600">
                    {argumentCount.B}/{MAX_ARGUMENTS}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={sideBScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {sideBMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${
                    msg.role === 'judge' ? 'bg-blue-100 text-blue-900' :
                    msg.role === 'user' ? 'bg-slate-700 text-white' :
                    'bg-amber-100 text-amber-900'
                  } rounded-2xl px-4 py-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.role === 'judge' ? <Bot className="w-4 h-4" /> : 
                       msg.role === 'user' ? <User className="w-4 h-4" /> :
                       <AlertCircle className="w-4 h-4" />}
                      <span className="text-xs font-semibold">
                        {msg.role === 'judge' ? 'AI Judge' : 
                         msg.role === 'user' ? 'Side B' : 'System'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <textarea
                  value={sideBInput}
                  onChange={(e) => setSideBInput(e.target.value)}
                  placeholder="Type your argument or counterpoint..."
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows={2}
                  disabled={argumentCount.B >= MAX_ARGUMENTS || isSubmittingB}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitArgument('B');
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-500">
                  {sideBInput.length}/600
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubmitArgument('B')}
                    disabled={!sideBInput.trim() || argumentCount.B >= MAX_ARGUMENTS || isSubmittingB}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                  >
                    {isSubmittingB ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRequestRethinking}
            disabled={isConcluding}
            className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 rounded-xl font-semibold transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request Rethinking
          </button>
          <button
            onClick={handleConcludeTrial}
            disabled={isConcluding}
            className="px-6 py-3 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isConcluding ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Generating Final Verdict...
              </>
            ) : (
              'Conclude Trial & View Verdict'
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-600">
          <p>© 2025 AI Judge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}