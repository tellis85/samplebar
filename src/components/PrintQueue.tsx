'use client';

import { useState } from 'react';
import { Label } from '@/types';
import { X, Printer, Trash2, Plus, Minus, Eye } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { LABEL_SPECS } from '@/constants';

interface PrintQueueProps {
  queue: Array<{
    label: Label;
    quantity: number;
  }>;
  onRemove: (index: number) => void;
  onUpdateQuantity: (index: number, newQuantity: number) => void;
  onClearAll: () => void;
  getImageUrl: (filename: string) => string;
  getPdfUrl: (filename: string) => string;
  isOpen: boolean;
  onClose: () => void;
}

// Split PDF generation into smaller chunks
const CHUNK_SIZE = 5; // Process 5 sheets at a time
const TIMEOUT_BETWEEN_CHUNKS = 200; // 200ms between chunks

export function PrintQueue({
  queue,
  onRemove,
  onUpdateQuantity,
  onClearAll,
  getImageUrl,
  isOpen,
  onClose,
}: PrintQueueProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');

  const totalLabels = queue.reduce((sum, item) => sum + item.quantity, 0);
  const totalSheets = Math.ceil(totalLabels / LABEL_SPECS.labelsPerSheet);

  // Prepare sheets with memory optimization
  const prepareSheets = () => {
    const labels = queue.flatMap((item) =>
      Array(item.quantity).fill(item.label)
    );
    const result: Label[][] = [];
    for (let i = 0; i < labels.length; i += LABEL_SPECS.labelsPerSheet) {
      result.push(labels.slice(i, i + LABEL_SPECS.labelsPerSheet));
    }
    return result;
  };

  const loadImage = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Scale down images if they're too large
        const maxDimension = 1000;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        // Reduce quality for QR codes since they're black and white
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        
        // Clean up
        canvas.width = 0;
        canvas.height = 0;
        resolve(base64);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  };

  const generatePDFChunk = async (
    doc: jsPDF,
    sheets: Label[][],
    startIndex: number,
    endIndex: number,
    preloadedImages: Record<string, string>
  ) => {
    for (let i = startIndex; i < endIndex && i < sheets.length; i++) {
      if (i > 0) doc.addPage();
      
      const sheet = sheets[i];
      for (let position = 0; position < sheet.length; position++) {
        const row = Math.floor(position / LABEL_SPECS.labelsPerRow);
        const col = position % LABEL_SPECS.labelsPerRow;

        const x = LABEL_SPECS.leftMargin + col * (LABEL_SPECS.labelWidth + LABEL_SPECS.horizontalGap);
        const y = LABEL_SPECS.topMargin + row * (LABEL_SPECS.labelHeight + LABEL_SPECS.verticalGap);

        try {
          const imageUrl = getImageUrl(sheet[position]["File Name"]);
          const base64Image = preloadedImages[imageUrl];

          if (base64Image) {
            doc.addImage(
              base64Image,
              'JPEG',
              x,
              y,
              LABEL_SPECS.labelWidth,
              LABEL_SPECS.labelHeight,
              undefined,
              'FAST'
            );
          }
        } catch (error) {
          console.error(`Error adding label to PDF:`, error);
          continue;
        }
      }
    }
    return doc;
  };

  const generatePDF = async (preview = false) => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setCurrentOperation('Preparing data...');

      const sheets = prepareSheets();
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'in',
        format: [8.5, 11],
        compress: true
      });

      // Process in smaller chunks
      const chunks = Math.ceil(sheets.length / CHUNK_SIZE);
      
      for (let chunk = 0; chunk < chunks; chunk++) {
        setCurrentOperation(`Processing chunk ${chunk + 1} of ${chunks}...`);
        
        const startIndex = chunk * CHUNK_SIZE;
        const endIndex = Math.min((chunk + 1) * CHUNK_SIZE, sheets.length);
        
        // Preload images for current chunk only
        const chunkSheets = sheets.slice(startIndex, endIndex);
        const imageUrls = [...new Set(chunkSheets.flat().map(label => getImageUrl(label["File Name"])))];
        
        setCurrentOperation(`Loading images for chunk ${chunk + 1}...`);
        const preloadedImages: Record<string, string> = {};
        
        for (const url of imageUrls) {
          try {
            preloadedImages[url] = await loadImage(url);
          } catch (error) {
            console.error(`Failed to load image: ${url}`, error);
          }
        }

        // Generate PDF for current chunk
        setCurrentOperation(`Generating PDF for chunk ${chunk + 1}...`);
        await generatePDFChunk(doc, sheets, startIndex, endIndex, preloadedImages);

        // Update progress
        setProgress(((chunk + 1) / chunks) * 100);

        // Clear memory between chunks
        Object.keys(preloadedImages).forEach(key => {
          delete preloadedImages[key];
        });

        // Give the browser time to clean up
        await new Promise(resolve => setTimeout(resolve, TIMEOUT_BETWEEN_CHUNKS));
      }

      setCurrentOperation('Finalizing PDF...');

      // Create the blob with proper mime type
      const pdfBlob = new Blob([doc.output('arraybuffer')], { 
        type: 'application/pdf'
      });

      // Create object URL
      const pdfUrl = URL.createObjectURL(pdfBlob);

      if (preview) {
        // For preview, open in new tab
        const previewWindow = window.open(pdfUrl, '_blank');
        if (!previewWindow) {
          alert('Please allow popups to preview the PDF');
        }
      } else {
        // For download, create a dummy link and click it
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `labels-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Delay URL cleanup to ensure download starts
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 5000); // Increased timeout to 5 seconds

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setCurrentOperation('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="print-queue fixed inset-y-0 right-0 w-96 bg-white shadow-xl flex flex-col z-50">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            <h2 className="font-semibold">Print Queue</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:hover:text-red-600"
              disabled={queue.length === 0}
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{queue.length} items in queue</span>
          <span>{totalLabels} total labels ({totalSheets} sheets)</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {queue.map((item, index) => (
          <div
            key={item.label["File Name"]}
            className="p-4 border-b flex items-center gap-4 hover:bg-gray-50"
          >
            <div className="label-container w-16 h-16 bg-gray-100 rounded flex-shrink-0 relative">
              <img
                src={getImageUrl(item.label["File Name"])}
                alt={item.label["Color Name"]}
                className="w-full h-full object-contain"
              />
              <button className="preview-icon absolute top-1 right-1 p-1 bg-white rounded-full shadow">
                <Eye className="w-4 h-4 text-gray-500 hover:text-gray-800" />
              </button>
            </div>
            <div className="flex-1">
              <div className="font-medium">{item.label["Product Series"]}</div>
              <div className="text-sm text-gray-600">
                {item.label["Color Name"]} ({item.label["Color Number"]})
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={() => onRemove(index)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        {isGenerating && (
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded">
              <div
                className="h-full bg-blue-600 rounded transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center mt-1">
              {currentOperation}<br />
              Progress: {Math.round(progress)}%
            </p>
          </div>
        )}
        <button
          onClick={() => generatePDF(true)}
          disabled={queue.length === 0 || isGenerating}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Generating PDF...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Preview PDF
            </>
          )}
        </button>
        <div className="mt-4 text-center">
          <a 
            href="https://www.avery.com/blank/labels/94237" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              fontSize: '15pt', 
              fontWeight: 'bold', 
              color: 'red', 
              border: '4px solid black', 
              padding: '8px', 
              borderRadius: '5px', 
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
              display: 'inline-block', 
              marginBottom: '8px' 
            }}
          >
            Click to purchase
            <br />
            Avery Label 94237
          </a>
        </div>
      </div>
    </div>
  );
}