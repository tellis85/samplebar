/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Label } from '@/types';
import { Eye, X } from 'lucide-react';

interface LabelGridProps {
  labels: Label[];
  onAddToQueue: (label: Label, quantity: number) => void;
  getImageUrl: (filename: string) => string;
}

export function LabelGrid({ labels, onAddToQueue, getImageUrl }: LabelGridProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [displayedLabels, setDisplayedLabels] = useState<Label[]>([]);
  const [page, setPage] = useState(1);
  const [quantities, setQuantities] = useState<{ [key: string]: string }>({});
  const loaderRef = useRef(null);
  const ITEMS_PER_PAGE = 20;
  const [isLoading, setIsLoading] = useState(false);

  // Reset pagination when labels prop changes
  useEffect(() => {
    setDisplayedLabels([]);
    setPage(1);
    setIsLoading(false);
    
    // Load initial page
    const initialLabels = labels.slice(0, ITEMS_PER_PAGE);
    setDisplayedLabels(initialLabels);
  }, [labels]); // Only reset when labels array changes

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && !isLoading && displayedLabels.length < labels.length) {
          setIsLoading(true);
          
          // Add artificial delay to prevent rapid loading
          setTimeout(() => {
            const nextPage = page + 1;
            const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            
            if (startIndex < labels.length) {
              setDisplayedLabels(prev => [
                ...prev,
                ...labels.slice(startIndex, endIndex)
              ]);
              setPage(nextPage);
            }
            setIsLoading(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [page, labels, isLoading, displayedLabels.length]);

  const getLabelKey = (label: Label) => {
    return `${label["File Name"]}`;
  };

  const getQuantity = (label: Label) => {
    return quantities[getLabelKey(label)] || '';
  };

  const updateQuantity = (label: Label, value: string) => {
    const key = getLabelKey(label);
    if (value === '' || /^\d+$/.test(value)) {
      setQuantities(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleAddToQueue = (label: Label) => {
    const quantity = parseInt(getQuantity(label)) || 0;
    if (quantity > 0) {
      onAddToQueue(label, quantity);
      // Reset quantity after adding to queue
      const key = getLabelKey(label);
      setQuantities(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, label: Label) => {
    if (e.key === 'Enter') {
      handleAddToQueue(label);
    }
  };

  return (
    <div className="flex-1 bg-white border-r overflow-y-auto">
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedLabels.map((label) => (
            <div key={getLabelKey(label)} className="flex flex-col bg-white rounded-lg border hover:border-blue-500 transition-colors overflow-hidden">
              <div className="relative aspect-square bg-gray-100 border-b">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={getImageUrl(label["File Name"])}
                    alt={`${label["Product Series"]} - ${label["Color Name"]}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
                <button
                  onClick={() => setSelectedImage(getImageUrl(label["File Name"]))}
                  className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 z-10"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{label["Product Series"]}</h3>
                    <p className="text-sm text-gray-600">{label["Color Name"]}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Color #: {label["Color Number"]}</div>
                  <div>Finish: {label.Finish}</div>
                  <div className="text-xs text-gray-500">{label["File Name"]}</div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <input
                    type="text"
                    value={getQuantity(label)}
                    onChange={(e) => updateQuantity(label, e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, label)}
                    placeholder="Qty"
                    className="w-20 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleAddToQueue(label)}
                    className={`px-3 py-1 rounded ${
                      getQuantity(label) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!getQuantity(label)}
                  >
                    Add to Queue
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div 
          ref={loaderRef} 
          className="h-20 flex items-center justify-center"
        >
          {isLoading && displayedLabels.length < labels.length && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          )}
        </div>

        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-3xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Image Preview</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative w-full h-[70vh]">
                <img
                  src={selectedImage}
                  alt="Label Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}