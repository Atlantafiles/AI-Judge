import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid'; 

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const side = formData.get('side'); 
    const primaryArgument = formData.get('primaryArgument');
    const detailedEvidence = formData.get('detailedEvidence');
    const responseToOtherSide = formData.get('responseToOtherSide');
    
    // Validate required fields
    if (!side || !primaryArgument) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: side and primaryArgument are mandatory',
      }, { status: 400 });
    }

    // Validate side value
    if (side !== 'A' && side !== 'B') {
      return NextResponse.json({
        success: false,
        message: 'Invalid side value. Must be "A" or "B"',
      }, { status: 400 });
    }
    
    // Get all uploaded files
    const files = formData.getAll('files');
    
    // Validate file size (10MB per file)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; 
    for (const file of files) {
      if (file && file.size > MAX_FILE_SIZE) {
        return NextResponse.json({
          success: false,
          message: `File ${file.name} exceeds 10MB limit`,
        }, { status: 400 });
      }
    }
    
    // Upload files to Vercel Blob Storage
    const uploadedFiles = [];
    
    for (const file of files) {
      if (file && file.size > 0) {
        try {
          
          const timestamp = Date.now();
          const filename = `case-${side}-${timestamp}-${file.name}`;
         
          const blob = await put(filename, file, {
            access: 'public',
            addRandomSuffix: true,
          });
          
          uploadedFiles.push({
            name: file.name,
            url: blob.url,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
          });
        } catch (uploadError) {
          console.error(`Failed to upload file ${file.name}:`, uploadError);
          
        }
      }
    }
    
    //case submission data
    const caseData = {
      side,
      primaryArgument: primaryArgument || '',
      detailedEvidence: detailedEvidence || '',
      responseToOtherSide: responseToOtherSide || '',
      files: uploadedFiles,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    };
    
    console.log(`Side ${side} case submitted successfully:`, {
      side,
      filesCount: uploadedFiles.length,
      submittedAt: caseData.submittedAt
    });
    
   
    return NextResponse.json({
      success: true,
      message: `Side ${side} case submitted successfully`,
      data: caseData,
      side: side,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error submitting case:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit case',
      error: error.message,
    }, { status: 500 });
  }
}

// GET endpoint
export async function GET(request) {
  return NextResponse.json({
    success: true,
    message: 'Upload API is operational',
    endpoint: '/api/upload',
    methods: ['POST'],
    version: '1.0.0'
  });
}