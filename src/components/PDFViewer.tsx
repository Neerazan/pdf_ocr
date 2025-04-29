"use client";

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure worker on client side only
if (typeof window !== 'undefined') {
  // Ensure you have copied pdf.worker.min.js to your public directory
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  url: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  searchQuery?: string;
  searchResults?: Array<{page: number, text: string}>;
}

export default function PDFViewer({
  url,
  currentPage,
  onPageChange,
  searchQuery,
  searchResults = []
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setLoading(false);
  };

  const prevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < numPages) {
      onPageChange(currentPage + 1);
    }
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.6));
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <button
            className="bg-gray-200 hover:bg-gray-300 rounded p-2"
            onClick={prevPage}
            disabled={currentPage <= 1 || loading}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span>
            Page {currentPage} of {numPages}
          </span>

          <button
            className="bg-gray-200 hover:bg-gray-300 rounded p-2"
            onClick={nextPage}
            disabled={currentPage >= numPages || loading}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="bg-gray-200 hover:bg-gray-300 rounded p-2"
            onClick={zoomOut}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          <span>{Math.round(zoom * 100)}%</span>

          <button
            className="bg-gray-200 hover:bg-gray-300 rounded p-2"
            onClick={zoomIn}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-auto border rounded bg-gray-100 flex justify-center min-h-[600px]">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-[600px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-[600px] text-red-500">
              Failed to load PDF file.
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={zoom * 1.5}
            loading={
              <div className="animate-pulse bg-gray-200 h-[600px] w-full"></div>
            }
            error={
              <div className="flex items-center justify-center h-[600px] text-red-500">
                Failed to load page.
              </div>
            }
          />
        </Document>
      </div>

      {searchResults.some(result => result.page === currentPage) && searchQuery && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800">Search results on this page:</h3>
          <p className="text-sm mt-1">
            This page contains text matching your search for &quot;{searchQuery}&quot;. The OCR has detected this text
            on the page.
          </p>
        </div>
      )}
    </div>
  );
}