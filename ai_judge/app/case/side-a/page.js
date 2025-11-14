'use client';
import { useState } from 'react';
import { Scale, Upload, FileText, Trash2, CheckCircle, Clock, AlertCircle, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function SideASubmission() {
  const [files, setFiles] = useState([]);
  const [primaryArgument, setPrimaryArgument] = useState('');
  const [detailedEvidence, setDetailedEvidence] = useState('');
  const [responseToB, setResponseToB] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    const filesWithStatus = newFiles.map(file => ({
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      status: 'ready',
      id: Date.now() + Math.random()
    }));
    
    setFiles([...files, ...filesWithStatus]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      const filesWithStatus = newFiles.map(file => ({
        file,
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        status: 'ready',
        id: Date.now() + Math.random()
      }));
      
      setFiles([...files, ...filesWithStatus]);
    }
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    if (!primaryArgument.trim() || !agreed) {
      alert('Please fill in required fields and agree to the terms');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData 
      const formData = new FormData();
    
      // Append form fields
      formData.append('side', 'A');
      formData.append('primaryArgument', primaryArgument);
      formData.append('detailedEvidence', detailedEvidence);
      formData.append('responseToOtherSide', responseToB);
      
      // Append files
      files.forEach((fileObj) => {
        formData.append('files', fileObj.file);
      });

      // Update file status
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

      // Submit to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update file status 
        setFiles(prev => prev.map(f => ({ ...f, status: 'uploaded' })));
        
        console.log(`Side ${result.side} submitted successfully:`, result.data);
      
        sessionStorage.setItem('sideAData', JSON.stringify(result.data));
        
        // Check if Side B submitted
        const sideBData = sessionStorage.getItem('sideBData');
        
        if (sideBData) {
          // Both sides submitted
          alert('Side A submitted successfully! Both sides have now submitted. Proceeding to arguments...');
          window.location.href = '/case/arguments';
        } else {
          // For Side B
          alert('Side A submitted successfully! Please submit Side B arguments now.');
          const proceed = confirm('Would you like to submit for Side B now?');
          if (proceed) {
            window.location.href = '/case/side-b';
          } else {
            window.location.href = '/';
          }
        }
        
        // Reset form
        setPrimaryArgument('');
        setDetailedEvidence('');
        setResponseToB('');
        setAgreed(false);
        setFiles([]);
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert(`Failed to submit case: ${error.message}`);
      
      // Reset file status on error
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Save draft to localStorage
      const draftData = {
        side: 'A',
        primaryArgument,
        detailedEvidence,
        responseToB,
        savedAt: new Date().toISOString(),
      };
      
      localStorage.setItem('case-side-a-draft', JSON.stringify(draftData));
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft');
    }
  };
  

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50">
      {/* Header Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="bg-linear-to-br from-blue-600 to-cyan-600 p-2 rounded-lg">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">AI Judge</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-900">Side A Submission</span>
              </div>
              <Link href="/case/side-b" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                Side B Submission →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-linear-to-br from-blue-600 to-cyan-600 p-3 rounded-xl shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Case Submission for Side A</h1>
              <p className="text-slate-600 mt-1">Plaintiff / Claimant</p>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Clearly present your arguments, upload supporting documents, and detail your legal points for review. 
            All fields marked with an asterisk (<span className="text-red-500">*</span>) are required.
          </p>
        </div>

        {/* Upload Documents Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 mb-6 hover:shadow-xl transition-shadow">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Upload Supporting Documents
            </h2>
            <p className="text-sm text-slate-600">
              Drag and drop your files here, or click to browse. Supported formats: PDF, DOCX, TXT.
            </p>
          </div>

          {/* Drag and Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
            }`}
          >
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.txt"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <div className={`p-4 rounded-full mb-4 transition-colors ${
                  dragActive ? 'bg-blue-100' : 'bg-slate-200'
                }`}>
                  <Upload className={`w-10 h-10 ${dragActive ? 'text-blue-600' : 'text-slate-500'}`} />
                </div>
                <p className="text-slate-700 font-semibold mb-2">
                  Drag and drop files here
                </p>
                <p className="text-slate-500 text-sm mb-4">or click to browse</p>
                <div className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                  <Upload className="w-4 h-4" />
                  Browse Files
                </div>
              </div>
            </label>
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Uploaded Documents: ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((fileObj) => (
                  <div
                    key={fileObj.id}
                    className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-lg p-4 border border-slate-200 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {fileObj.name}
                        </p>
                        <p className="text-xs text-slate-500">{fileObj.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {fileObj.status === 'uploading' && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Clock className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-medium">Uploading...</span>
                        </div>
                      )}
                      {fileObj.status === 'uploaded' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Uploaded</span>
                        </div>
                      )}
                      {fileObj.status === 'ready' && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Ready</span>
                        </div>
                      )}
                      {fileObj.status === 'error' && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Error</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(fileObj.id)}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Case Arguments Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 mb-6 hover:shadow-xl transition-shadow">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Your Case Arguments
            </h2>
            <p className="text-sm text-slate-600">
              Elaborate on your legal position and provide detailed explanations in the fields below.
            </p>
          </div>

          {/* Primary Argument */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Primary Argument for Side A <span className="text-red-500">*</span>
            </label>
            <textarea
              value={primaryArgument}
              onChange={(e) => setPrimaryArgument(e.target.value)}
              placeholder="Summarize your core legal argument for Side A, highlighting key facts and legal precedents..."
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none text-slate-900 placeholder:text-slate-400"
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500 mt-2">
              {primaryArgument.length} characters
            </p>
          </div>

          {/* Detailed Evidence */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Detailed Supporting Evidence
            </label>
            <textarea
              value={detailedEvidence}
              onChange={(e) => setDetailedEvidence(e.target.value)}
              placeholder="Provide specific details and context for all evidence, including document references and exhibit numbers..."
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none text-slate-900 placeholder:text-slate-400"
              disabled={isSubmitting}
            />
          </div>

          {/* Response to Side B */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Response to Side B&apos;s Claims
            </label>
            <textarea
              value={responseToB}
              onChange={(e) => setResponseToB(e.target.value)}
              placeholder="Address and counter the claims made by Side B, presenting your rebuttals and alternative interpretations..."
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none text-slate-900 placeholder:text-slate-400"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="bg-linear-to-r from-amber-50 to-orange-50 rounded-2xl shadow-lg border border-amber-200 p-6 mb-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-amber-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              disabled={isSubmitting}
            />
            <div className="flex-1">
              <p className="text-sm text-slate-900 leading-relaxed">
                I agree that all information provided is accurate and complete to the best of my knowledge, 
                and I understand that submitting false information may have legal consequences.
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSaveDraft}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 px-6 py-4 rounded-xl font-semibold transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Save Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={!primaryArgument.trim() || !agreed || isSubmitting}
            className="flex-1 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-4 rounded-xl font-semibold transition-all hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Case
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Info Alert */}
        {(!primaryArgument.trim() || !agreed) && !isSubmitting && (
          <div className="mt-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              Please complete all required fields and agree to the terms before submitting.
            </p>
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