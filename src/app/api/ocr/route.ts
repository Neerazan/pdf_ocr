import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// console.log('Received OCR request...');

export async function POST(request: NextRequest) {
  try {
    const { filePath, page } = await request.json();
    // console.log('FilePath: ', filePath);
    // console.log('Page: ', page);
    
    if (!filePath || !page) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Extract session ID and file name from file path
    const pathParts = filePath.split('/');
    const sessionId = pathParts[pathParts.length - 2];
    const fileName = pathParts[pathParts.length - 1];
    
    // Define paths
    const sessionDir = path.join(process.cwd(), 'uploads', sessionId);
    const imagesDir = path.join(sessionDir, 'images');
    const imagePath = path.join(imagesDir, `page-${page}.png`);
    const ocrCachePath = path.join(sessionDir, `ocr-page-${page}.json`);
    
    // Create directories if they don't exist
    await Promise.all([
      mkdir(sessionDir, { recursive: true }),
      mkdir(imagesDir, { recursive: true })
    ]);
    
    // Check if OCR results already exist for this page
    if (existsSync(ocrCachePath)) {
      // console.log('Using cached OCR result');
      const cachedResult = JSON.parse(await readFile(ocrCachePath, 'utf-8'));
      return NextResponse.json(cachedResult);
    }
    
    // First, try to extract text using pdftotext (from poppler-utils)
    let extractedText = '';
    try {
      // console.log('Extracting text using pdftotext...');
      const textOutputPath = path.join(sessionDir, `page-${page}.txt`);
      await execAsync(`pdftotext -f ${page} -l ${page} "${filePath}" "${textOutputPath}"`);
      
      if (existsSync(textOutputPath)) {
        extractedText = await readFile(textOutputPath, 'utf8');
        // console.log('Text extracted successfully');
      }
    } catch (textError) {
      console.error('Error extracting text with pdftotext:', textError);
    }
    
    // Convert the PDF page to an image using pdftoppm
    try {
      // console.log('Converting PDF page to image...');
      const outputPrefix = path.join(imagesDir, 'page');
      
      // Execute pdftoppm command with specified page
      await execAsync(`pdftoppm -png -f ${page} -l ${page} -r 300 "${filePath}" "${outputPrefix}"`);
      // console.log('PDF page converted to image');
      
      // pdftoppm typically outputs files with names like "page-01.png" for page 1
      const pageNumStr = page.toString().padStart(2, '0');
      const generatedImagePath = path.join(imagesDir, `page-${pageNumStr}.png`);
      
      // console.log('Looking for generated image at:', generatedImagePath);
      
      if (!existsSync(generatedImagePath)) {
        // Try alternate filename formats
        const possiblePaths = [
          path.join(imagesDir, `page-${page}.png`),
          path.join(imagesDir, `page-${pageNumStr}.png`),
          path.join(imagesDir, `page${pageNumStr}.png`),
          path.join(imagesDir, `page${page}.png`),
          path.join(imagesDir, `page-0${page}.png`)
        ];
        
        // console.log('Generated image not found at expected path. Looking for alternatives...');
        
        // List the directory contents for debugging
        const { stdout } = await execAsync(`ls -la "${imagesDir}"`);
        // console.log('Directory contents:', stdout);
        
        // Find the generated image
        let imageFound = false;
        for (const testPath of possiblePaths) {
          if (existsSync(testPath)) {
            // console.log('Found image at:', testPath);
            imageFound = true;
            
            // Read the generated image
            const imageBuffer = await readFile(testPath);
            
            // Convert buffer to base64
            const base64Image = imageBuffer.toString('base64');
            
            // console.log('Sending image to OCR service...');
            const { text: ocrText } = await generateText({
              model: google('gemini-1.5-flash-8b-001'),
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Extract all text from this image of a PDF page. Include all visible text, including text in images, charts, and handwritten content if present. Return only the extracted text without any additional explanation.',
                    },
                    {
                      type: 'image',
                      image: base64Image,
                    }
                  ]
                }
              ]
            });
          
            // console.log('OCR Result received');
            
            // Combine the text from pdftotext and the OCR result
            // If both have content, use OCR text as it's likely more complete
            const combinedText = ocrText || extractedText;
            
            // Cache the OCR result
            const result = { text: combinedText, page };
            await writeFile(ocrCachePath, JSON.stringify(result));
            // console.log('OCR result cached');
            
            return NextResponse.json(result);
          }
        }
        
        if (!imageFound) {
          throw new Error('Generated image not found after conversion');
        }
      } else {
        // Read the generated image at the expected path
        const imageBuffer = await readFile(generatedImagePath);
        
        // Convert buffer to base64
        const base64Image = imageBuffer.toString('base64');
        
        // console.log('Sending image to OCR service...');
        const { text: ocrText } = await generateText({
          model: google('gemini-1.5-flash-8b-001'),
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text from this image of a PDF page. Include all visible text, including text in images, charts, and handwritten content if present. Return only the extracted text without any additional explanation.',
                },
                {
                  type: 'image',
                  image: base64Image,
                }
              ]
            }
          ]
        });
      
        // console.log('OCR Result received');
        
        // Combine the text from pdftotext and the OCR result
        // If both have content, use OCR text as it's likely more complete
        const combinedText = ocrText || extractedText;
        
        // Cache the OCR result
        const result = { text: combinedText, page };
        await writeFile(ocrCachePath, JSON.stringify(result));
        // console.log('OCR result cached');
        
        return NextResponse.json(result);
      }
      
    } catch (imgError) {
      console.error('Error converting PDF to image:', imgError);
      
      // Fallback to returning just the extracted text if any
      if (extractedText) {
        console.log('Falling back to text-only extraction');
        const result = { text: extractedText, page };
        await writeFile(ocrCachePath, JSON.stringify(result));
        
        return NextResponse.json(result);
      } else {
        throw new Error('Failed to extract text and convert image');
      }
    }
    
  } catch (error) {
    console.error('Error processing OCR:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to process OCR', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}