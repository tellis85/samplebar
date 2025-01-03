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

  const totalLabels = queue.reduce((sum, item) => sum + item.quantity, 0);
  const totalSheets = Math.ceil(totalLabels / LABEL_SPECS.labelsPerSheet);

  const sheets = (() => {
    const labels = queue.flatMap((item) =>
      Array(item.quantity).fill(item.label)
    );
    const result: Label[][] = [];
    while (labels.length > 0) {
      result.push(labels.splice(0, LABEL_SPECS.labelsPerSheet));
    }
    return result;
  })();

  const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  };

  const generatePDF = async (preview = false) => {
    try {
      setIsGenerating(true);
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'in',
        format: [8.5, 11],
      });

      for (let sheetIndex = 0; sheetIndex < sheets.length; sheetIndex++) {
        if (sheetIndex > 0) doc.addPage();

        const sheet = sheets[sheetIndex];

        for (let position = 0; position < sheet.length; position++) {
          const row = Math.floor(position / LABEL_SPECS.labelsPerRow);
          const col = position % LABEL_SPECS.labelsPerRow;

          const x =
            LABEL_SPECS.leftMargin +
            col * (LABEL_SPECS.labelWidth + LABEL_SPECS.horizontalGap);
          const y =
            LABEL_SPECS.topMargin +
            row * (LABEL_SPECS.labelHeight + LABEL_SPECS.verticalGap);

          try {
            const imageUrl = getImageUrl(sheet[position]["File Name"]);
            const base64Image = await loadImage(imageUrl);

            doc.addImage(
              base64Image,
              'JPEG',
              x,
              y,
              LABEL_SPECS.labelWidth,
              LABEL_SPECS.labelHeight
            );
          } catch {
            console.warn(
              `Skipping label ${sheet[position]["File Name"]} due to image load error.`
            );
            continue;
          }
        }
      }

      if (preview) {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.target = '_blank'; // This ensures it opens in a new tab
        link.rel = 'noopener noreferrer'; // Security best practice
        
        // Trigger the click
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object after a short delay
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 100);
      } else {
        const fileName = `labels-${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
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
        <p className="mt-2 text-red-600 font-bold text-xl text-center">
          *Use Avery Label Presta 94237*
        </p>
      </div>
    </div>
  );
}