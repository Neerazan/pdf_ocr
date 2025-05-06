"use client";

import { useState } from 'react';
import PDFUploader from '@/components/PDFUploader';
import PDFViewer from '@/components/PDFViewer';
import SearchBar from '@/components/SearchBar';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { OCRResult } from '@/types';

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{page: number, text: string}>>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = ocrResults
      .filter(result => result.text.toLowerCase().includes(query.toLowerCase()))
      .map(result => ({
        page: result.page,
        text: result.text
      }));

    setSearchResults(results);

    if (results.length > 0) {
      setCurrentPage(results[0].page);
    }
  };

  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    setPdfUrl(URL.createObjectURL(file));
    setProcessing(true);
    setProgress(0);
    setOcrResults([]);
    setSearchResults([]);

    // Upload the file to our API endpoint
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const data = await response.json();
      const { pageCount, filePath } = data;

      // Process each page with OCR
      const results: OCRResult[] = [];

      for (let i = 1; i <= pageCount; i++) {
        setProgress(Math.floor((i / pageCount) * 100));

        console.log("Before calling OCR API.......")
        const ocrResponse = await fetch('/api/ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filePath: filePath,
            page: i
          }),
        });

        console.log("OCR Response response: ", ocrResponse.body)

        if (!ocrResponse.ok) {
          throw new Error(`OCR processing failed for page ${i}`);
        }

        const ocrData = await ocrResponse.json();
        console.log("OCR Response: ", ocrData)
        results.push({
          page: i,
          text: ocrData.text
        });
      }

      console.log("OCR Results: ", results);
      setOcrResults(results);
      setProcessing(false);
      setProgress(100);

    } catch (error) {
      console.error('Error processing PDF:', error);
      setProcessing(false);
      alert('Error processing PDF. Please try again.');
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">PDF OCR Search</h1>

      <div className="mb-8">
        <PDFUploader onFileUpload={handleFileUpload} />
      </div>

      {processing && (
        <div className="mb-8">
          <ProcessingStatus progress={progress} />
        </div>
      )}

      {pdfUrl && !processing && (
        <>
          <div className="mb-4">
            <SearchBar onSearch={handleSearch} />
            {searchResults.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-3/4">
              <PDFViewer
                url={pdfUrl}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                searchQuery={searchQuery}
                searchResults={searchResults}
                ocrResults={ocrResults}
              />
            </div>

            {searchResults.length > 0 && (
              <div className="w-full md:w-1/4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h2 className="font-semibold mb-2">Search Results</h2>
                  <ul className="space-y-2">
                    {searchResults.map((result, index) => (
                      <li
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                        onClick={() => setCurrentPage(result.page)}
                      >
                        <div className="font-medium">Page {result.page}</div>
                        <div className="text-sm text-gray-600">
                          {result.text.substring(0, 150)}...
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}