'use client'

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, Download } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfPreviewProps {
  url: string;
  onClose: () => void;
  filename?: string;
}

export function PdfPreview({ url, onClose, filename }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Get current timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const defaultFilename = `label-${timestamp}.pdf`;
      
      // Create an input element for the filename
      const filenameInput = document.createElement('input');
      filenameInput.type = 'text';
      filenameInput.value = filename || defaultFilename;
      filenameInput.style.position = 'fixed';
      filenameInput.style.top = '50%';
      filenameInput.style.left = '50%';
      filenameInput.style.transform = 'translate(-50%, -50%)';
      filenameInput.style.padding = '10px';
      filenameInput.style.border = '1px solid #ccc';
      filenameInput.style.borderRadius = '4px';
      filenameInput.style.zIndex = '10000';

      // Create a dialog container
      const dialog = document.createElement('div');
      dialog.style.position = 'fixed';
      dialog.style.top = '0';
      dialog.style.left = '0';
      dialog.style.right = '0';
      dialog.style.bottom = '0';
      dialog.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      dialog.style.display = 'flex';
      dialog.style.flexDirection = 'column';
      dialog.style.alignItems = 'center';
      dialog.style.justifyContent = 'center';
      dialog.style.zIndex = '9999';

      // Create a dialog box
      const dialogBox = document.createElement('div');
      dialogBox.style.backgroundColor = 'white';
      dialogBox.style.padding = '20px';
      dialogBox.style.borderRadius = '8px';
      dialogBox.style.width = '300px';
      dialogBox.style.textAlign = 'center';

      // Create title
      const title = document.createElement('h3');
      title.textContent = 'Save PDF As';
      title.style.marginBottom = '15px';

      // Create buttons container
      const buttons = document.createElement('div');
      buttons.style.marginTop = '15px';
      buttons.style.display = 'flex';
      buttons.style.justifyContent = 'center';
      buttons.style.gap = '10px';

      // Create save button
      const saveButton = document.createElement('button');
      saveButton.textContent = 'Save';
      saveButton.style.padding = '8px 16px';
      saveButton.style.backgroundColor = '#2563eb';
      saveButton.style.color = 'white';
      saveButton.style.border = 'none';
      saveButton.style.borderRadius = '4px';
      saveButton.style.cursor = 'pointer';

      // Create cancel button
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.padding = '8px 16px';
      cancelButton.style.backgroundColor = '#e5e7eb';
      cancelButton.style.color = 'black';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.cursor = 'pointer';

      // Add event listeners
      saveButton.onclick = async () => {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filenameInput.value.endsWith('.pdf') 
          ? filenameInput.value 
          : `${filenameInput.value}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(dialog);
      };

      cancelButton.onclick = () => {
        document.body.removeChild(dialog);
        setIsDownloading(false);
      };

      // Assemble the dialog
      buttons.appendChild(saveButton);
      buttons.appendChild(cancelButton);
      dialogBox.appendChild(title);
      dialogBox.appendChild(filenameInput);
      dialogBox.appendChild(buttons);
      dialog.appendChild(dialogBox);

      // Show the dialog
      document.body.appendChild(dialog);

      // Focus the input
      filenameInput.focus();
      filenameInput.select();

    } catch (error) {
      console.error('Failed to download PDF:', error);
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">PDF Preview</h3>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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