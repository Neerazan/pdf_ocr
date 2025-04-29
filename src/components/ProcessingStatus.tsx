export interface ProcessingStatusProps {
  progress: number;
}

export function ProcessingStatus({ progress }: ProcessingStatusProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-medium mb-2">Processing PDF</h2>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        {progress < 100 
          ? `OCR processing... ${progress}% complete` 
          : 'Processing complete!'}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        We are analyzing each page for text, including handwritten content and text in images.
      </p>
    </div>
  );
}