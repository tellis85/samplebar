'use client'

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X } from 'lucide-react';

// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfPreviewProps {
  url: string;
  onClose: () => void;
}

export function PdfPreview({ url, onClose }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">PDF Preview</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-center">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            className="border rounded"
          >
            <Page pageNumber={pageNumber} width={500} />
          </Document>
        </div>
        {numPages && numPages > 1 && (
          <div className="flex justify-center gap-4 mt-4">
            <button
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber(prev => prev - 1)}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Previous
            </button>
            <span>
              Page {pageNumber} of {numPages}
            </span>
            <button
              disabled={pageNumber >= numPages}
              onClick={() => setPageNumber(prev => prev + 1)}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}