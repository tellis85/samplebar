'use client';

import { useState } from 'react';
import { Label } from '@/types';
import { X, Printer, Trash2, Plus, Minus, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [currentPreviewSheet, setCurrentPreviewSheet] = useState(0);
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
        URL.createObjectURL(pdfBlob);
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

  const PreviewContent = () => (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 p-4 bg-gray-50">
      {sheets[currentPreviewSheet]?.map((label, index) => (
        <div
          key={index}
          className="border flex items-center justify-center p-2 bg-white"
        >
          <img
            src={getImageUrl(label["File Name"])}
            alt={label["Color Name"]}
            className="max-w-full max-h-full"
          />
        </div>
      ))}
    </div>
  );

  if (!isOpen) return null;

  if (isPreviewMode) {
    return (
      <div className="fixed inset-0 bg-white z-50">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex items-center justify-between bg-white">
            <button
              onClick={() => {
                setIsPreviewMode(false);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Queue
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {PreviewContent()}

            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() =>
                  setCurrentPreviewSheet((prev) => Math.max(0, prev - 1))
                }
                disabled={currentPreviewSheet === 0}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentPreviewSheet((prev) =>
                    Math.min(sheets.length - 1, prev + 1)
                  )
                }
                disabled={currentPreviewSheet === sheets.length - 1}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 border-t bg-white">
            <div className="flex justify-between gap-4">
              <button
                onClick={() => generatePDF(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview PDF
              </button>
              <button
                onClick={() => generatePDF(false)}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          onClick={() => setIsPreviewMode(true)}
          disabled={queue.length === 0}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Preview & Print
        </button>
      </div>
    </div>
  );
}