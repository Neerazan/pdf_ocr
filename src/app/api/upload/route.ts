import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

// Separate async function for PDF processing using pdf-lib
async function getPdfPageCount(buffer:any) {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    return pdfDoc.getPageCount();
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return 0; // Return 0 if we can't determine page count
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Generate a unique identifier for this upload session
    const sessionId = randomUUID();
    
    // Create the uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Create a session directory
    const sessionDir = path.join(uploadsDir, sessionId);
    await mkdir(sessionDir, { recursive: true });
    
    // Save the file
    const filePath = path.join(sessionDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Create images directory for this session
    const imagesDir = path.join(sessionDir, 'images');
    await mkdir(imagesDir, { recursive: true });
    
    // Get page count - if it fails, we'll still return the file info
    let pageCount = 0;
    try {
      pageCount = await getPdfPageCount(buffer);
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      // Continue with upload but note that page count is unknown
    }
    
    return NextResponse.json({
      success: true,
      filePath,
      sessionId,
      pageCount
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}