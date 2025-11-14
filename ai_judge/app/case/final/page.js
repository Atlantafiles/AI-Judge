'use client';
import { useState, useEffect } from 'react';
import { Scale, Gavel, FileText, AlertCircle, Download, Share2, Home, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function FinalVerdictPage() {
  const [verdict, setVerdict] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadFinalVerdict();
  }, []);

  const loadFinalVerdict = () => {
    try {
      setIsLoading(true);
      
      console.log('Loading verdict from sessionStorage...');
      
      // verdict from sessionStorage 
      const storedVerdictData = sessionStorage.getItem('finalVerdict');
      const storedCaseData = sessionStorage.getItem('caseData');
      const storedMetadata = sessionStorage.getItem('verdictMetadata');
      
      console.log('StoredVerdictData exists:', !!storedVerdictData);
      console.log('StoredCaseData exists:', !!storedCaseData);
      console.log('StoredMetadata exists:', !!storedMetadata);
      
      if (storedVerdictData) {
        console.log('Loading verdict from sessionStorage');
        const parsedVerdict = JSON.parse(storedVerdictData);
        setVerdict(parsedVerdict);
        console.log('Verdict loaded:', parsedVerdict);
        
        if (storedCaseData) {
          const parsedCaseData = JSON.parse(storedCaseData);
          setCaseData(parsedCaseData);
          console.log('Case data loaded:', parsedCaseData);
        } else {
          // Set default case data
          const defaultCaseData = {
            caseNumber: "12345",
            dateFiled: new Date().toISOString(),
            plaintiff: "Side A",
            defendant: "Side B"
          };
          setCaseData(defaultCaseData);
          console.log('Using default case data');
        }

        if (storedMetadata) {
          const parsedMetadata = JSON.parse(storedMetadata);
          setMetadata(parsedMetadata);
          console.log('Metadata loaded:', parsedMetadata);
        }
      } else {
        console.warn('No verdict found in sessionStorage!');
        alert('No verdict available. Please complete the trial first.');
        router.push('/case/arguments');
        return;
      }
    } catch (error) {
      console.error('Error loading final verdict:', error);
      alert('Error loading verdict. Please try again.');
      router.push('/case/arguments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadVerdict = () => {
    if (!verdict) {
      alert('No verdict to download');
      return;
    }
    
    try {
      const verdictText = `
═══════════════════════════════════════════════════════
            AI JUDGE FINAL VERDICT
═══════════════════════════════════════════════════════

Case #${caseData?.caseNumber || '12345'}
Date: ${caseData?.dateFiled ? new Date(caseData.dateFiled).toLocaleDateString() : 'N/A'}
Generated: ${metadata?.generatedAt ? new Date(metadata.generatedAt).toLocaleString() : new Date().toLocaleString()}

═══════════════════════════════════════════════════════
DECISION: IN FAVOR OF ${verdict.decision?.toUpperCase()}
═══════════════════════════════════════════════════════

VERDICT SUMMARY:
${verdict.summary}

───────────────────────────────────────────────────────
CASE SUMMARY:
───────────────────────────────────────────────────────
${verdict.caseSummary}

───────────────────────────────────────────────────────
SIDE A ARGUMENTS:
───────────────────────────────────────────────────────
${verdict.sideAArguments?.content || 'Not available'}

───────────────────────────────────────────────────────
SIDE B ARGUMENTS:
───────────────────────────────────────────────────────
${verdict.sideBArguments?.content || 'Not available'}

───────────────────────────────────────────────────────
DETAILED REASONING:
───────────────────────────────────────────────────────
${verdict.reasoning}

───────────────────────────────────────────────────────
LEGAL BASIS:
───────────────────────────────────────────────────────
${verdict.legalBasis?.map((basis, i) => `${i + 1}. ${basis}`).join('\n') || 'Not specified'}

───────────────────────────────────────────────────────
KEY FINDINGS:
───────────────────────────────────────────────────────
${verdict.keyFindings?.map((finding, i) => `${i + 1}. ${finding}`).join('\n') || 'Not specified'}

───────────────────────────────────────────────────────
REMEDY:
───────────────────────────────────────────────────────
${verdict.remedy || 'Not specified'}

═══════════════════════════════════════════════════════
TRIAL STATISTICS:
═══════════════════════════════════════════════════════
Arguments Side A: ${metadata?.argumentCountSideA || 0}
Arguments Side B: ${metadata?.argumentCountSideB || 0}
Total Documents: ${metadata?.totalDocuments || 0}

═══════════════════════════════════════════════════════
Generated by AI Judge System
© 2025 AI Judge. All rights reserved.

DISCLAIMER: This verdict is generated by an AI system for 
mock trial and educational purposes only. It does not 
constitute legal advice.
═══════════════════════════════════════════════════════
      `.trim();

      // Create a blob 
      const blob = new Blob([verdictText], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AI-Judge-Verdict-${caseData?.caseNumber || Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Verdict downloaded successfully');
    } catch (error) {
      console.error('Error downloading verdict:', error);
      alert('Failed to download verdict. Please try again.');
    }
  };

  const handleShareVerdict = () => {
    if (!verdict) return;
    
    const shareData = {
      title: 'AI Judge Final Verdict',
      text: `Case #${caseData?.caseNumber || 'N/A'}: Decision in favor of ${verdict?.decision}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare(shareData)) {
      navigator.share(shareData)
        .then(() => console.log('Shared successfully'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          alert('Link copied to clipboard!');
        })
        .catch(() => {
          // Final fallback: Show the URL
          const url = window.location.href;
          prompt('Copy this link:', url);
        });
    }
  };

  const handleStartNewCase = () => {
    try {
      console.log('Starting new case - clearing all session data...');
      
      // Clear all session storage
      sessionStorage.removeItem('finalVerdict');
      sessionStorage.removeItem('caseData');
      sessionStorage.removeItem('verdictMetadata');
      sessionStorage.removeItem('currentCase');
      sessionStorage.removeItem('interimVerdict');
      sessionStorage.removeItem('sideAMessages');
      sessionStorage.removeItem('sideBMessages');
      sessionStorage.removeItem('argumentCountA');
      sessionStorage.removeItem('argumentCountB');
      
      // clear localStorage 
      localStorage.removeItem('case-side-a-draft');
      localStorage.removeItem('case-side-b-draft');
      localStorage.removeItem('sideAData');
      localStorage.removeItem('sideBData');
      localStorage.removeItem('currentCase');
      
      console.log('Session data cleared successfully');
     
      alert('Session cleared! Starting fresh case.');
      
      router.push('/');
    } catch (error) {
      console.error('Error clearing session:', error);
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium text-lg">Loading final verdict...</p>
        </div>
      </div>
    );
  }

  if (!verdict) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Verdict Found</h2>
          <p className="text-slate-600 mb-6">Please complete the trial first to generate a verdict.</p>
          <Link 
            href="/case/arguments"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Go to Arguments
          </Link>
        </div>
      </div>
    );
  }

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
              <button
                onClick={handleShareVerdict}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={handleDownloadVerdict}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Verdict Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-blue-600 to-cyan-600 rounded-full shadow-xl mb-4 sm:mb-6">
            <Gavel className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            AI Judge's Final Verdict
          </h1>
          {caseData && (
            <p className="text-slate-600">
              Case #{caseData.caseNumber} • {new Date(caseData.dateFiled).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Decision Card */}
        <div className={`bg-white rounded-2xl shadow-xl border-2 ${
          verdict.decision === 'Side A' ? 'border-green-200' : 'border-blue-200'
        } p-6 sm:p-8 mb-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`shrink-0 w-10 h-10 ${
              verdict.decision === 'Side A' ? 'bg-green-100' : 'bg-blue-100'
            } rounded-full flex items-center justify-center`}>
              <Gavel className={`w-6 h-6 ${
                verdict.decision === 'Side A' ? 'text-green-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Verdict: In Favor of {verdict.decision}
              </h2>
            </div>
          </div>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed text-base sm:text-lg">
              {verdict.summary}
            </p>
          </div>
        </div>

        {/* Case Summary */}
        {verdict.caseSummary && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Case Summary
            </h2>
            <p className="text-slate-700 leading-relaxed">
              {verdict.caseSummary}
            </p>
          </div>
        )}

        {/* Key Arguments Review*/}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
            Key Arguments Reviewed
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Side A Arguments */}
            <div className="border-l-4 border-blue-500 pl-4 sm:pl-6">
              <h3 className="text-lg font-bold text-blue-700 mb-3">
                {verdict.sideAArguments?.title || "Side A's Argument"}
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                {verdict.sideAArguments?.content || 'Not available'}
              </p>
            </div>

            {/* Side B Arguments */}
            <div className="border-l-4 border-orange-500 pl-4 sm:pl-6">
              <h3 className="text-lg font-bold text-orange-700 mb-3">
                {verdict.sideBArguments?.title || "Side B's Argument"}
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                {verdict.sideBArguments?.content || 'Not available'}
              </p>
            </div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-linear-to-br from-slate-50 to-blue-50 rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
            Detailed Reasoning
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            {verdict.reasoning}
          </p>
          
          {verdict.legalBasis && verdict.legalBasis.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-300">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Legal Basis:
              </h3>
              <ul className="space-y-2">
                {verdict.legalBasis.map((basis, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <span className="shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                    <span className="text-sm sm:text-base">{basis}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verdict.keyFindings && verdict.keyFindings.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-300">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Key Findings:
              </h3>
              <ul className="space-y-2">
                {verdict.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <span className="shrink-0 w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    <span className="text-sm sm:text-base">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verdict.remedy && (
            <div className="mt-6 pt-6 border-t border-slate-300">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Remedy:
              </h3>
              <p className="text-slate-700 text-sm sm:text-base bg-white p-4 rounded-lg border border-slate-200">
                {verdict.remedy}
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-1">
                Important Disclaimer
              </h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                This verdict is generated by an AI system for mock trial and educational purposes only. 
                It does not constitute legal advice and should not be used as a substitute for consultation 
                with a qualified legal professional. Real legal proceedings may have different outcomes 
                based on jurisdiction-specific laws and additional evidence.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/case/arguments"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 rounded-xl font-semibold transition-all hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Arguments
          </Link>
          <button
            onClick={handleStartNewCase}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg">
            <Home className="w-5 h-5" />
            Start New Case
          </button>
        </div>

        {/* Case Statistics */}
        {metadata && (
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-md p-4 text-center border border-slate-200">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {metadata.argumentCountSideA || 0}
              </div>
              <div className="text-xs text-slate-600">Arguments Side A</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 text-center border border-slate-200">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {metadata.argumentCountSideB || 0}
              </div>
              <div className="text-xs text-slate-600">Arguments Side B</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 text-center border border-slate-200">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {metadata.totalDocuments || 0}
              </div>
              <div className="text-xs text-slate-600">Documents Reviewed</div>
            </div>
          </div>
        )}
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