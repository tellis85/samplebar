'use client';

import { useState } from 'react';
import { Search, Printer } from 'lucide-react';
import { FilterPanel } from './FilterPanel';
import { LabelGrid } from './LabelGrid';
import { PrintQueue } from './PrintQueue';
import { Label, FilterState } from '@/types';
import Image from 'next/image';

interface LabelManagementSystemProps {
  initialData: Label[];
}

export function LabelManagementSystem({ initialData }: LabelManagementSystemProps) {
  const [filters, setFilters] = useState<FilterState>({
    brand: null,
    collection: null,
    productSeries: null,
    finish: null,
    colorName: null,
    colorNumber: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [printQueue, setPrintQueue] = useState<Array<{ label: Label; quantity: number }>>([]);
  const [isPrintQueueOpen, setIsPrintQueueOpen] = useState(false);

  const filteredLabels = initialData.filter(item => {
    const searchMatches = (() => {
      if (!searchTerm) return true;
      const searchTerms = searchTerm.toLowerCase().split(' ').filter(term => term);
      
      const searchableFields = [
        item.Brand,
        item.Collection,
        item["Product Series"],
        item.Finish,
        item["Color Name"],
        item["Color Number"],
        item["File Name"]
      ].map(field => String(field || '').toLowerCase());

      return searchTerms.every(term => 
        searchableFields.some(field => field.includes(term))
      );
    })();

    const filterMatches = Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      
      switch(key) {
        case 'brand':
          return item.Brand === value;
        case 'collection':
          return item.Collection === value;
        case 'productSeries':
          return item["Product Series"] === value;
        case 'finish':
          return item.Finish === value;
        case 'colorName':
          return item["Color Name"] === value;
        case 'colorNumber':
          return item["Color Number"] === value;
        default:
          return true;
      }
    });

    return searchMatches && filterMatches;
  });

  const handleAddToQueue = (label: Label, quantity: number) => {
    setPrintQueue(prev => {
      const existingIndex = prev.findIndex(item => item.label["File Name"] === label["File Name"]);
      
      if (existingIndex >= 0) {
        const newQueue = [...prev];
        newQueue[existingIndex] = {
          ...newQueue[existingIndex],
          quantity: newQueue[existingIndex].quantity + quantity
        };
        return newQueue;
      } else {
        return [...prev, { label, quantity }];
      }
    });
  };

  // Updated to remove entire item
  const handleRemoveFromQueue = (index: number) => {
    setPrintQueue(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setPrintQueue([]);
  };

  const updateQueueItemQuantity = (index: number, newQuantity: number) => {
    setPrintQueue(prev => {
      const newQueue = [...prev];
      if (newQuantity < 1) {
        return newQueue.filter((_, i) => i !== index);
      } else {
        newQueue[index] = {
          ...newQueue[index],
          quantity: newQuantity
        };
        return newQueue;
      }
    });
  };

  const totalLabelsInQueue = printQueue.reduce((sum, item) => sum + item.quantity, 0);

  const getPdfUrl = (filename: string) => `/labels/pdfs/${filename}`;
  const getImageUrl = (filename: string) => `/labels/images/${filename}.jpg`;

  return (
    <div className="h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="h-24 w-96 flex items-center">
            <Image 
              src="/images/logo.png"
              alt="American Olean"
              width={384}
              height={96}
              className="max-h-full w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search labels..."
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => setIsPrintQueueOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Printer className="w-5 h-5" />
              <span className="font-medium">Queue ({totalLabelsInQueue})</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)] relative">
        <FilterPanel
          filters={filters}
          data={initialData}
          onFilterChange={(key, value) => {
            setFilters(prev => ({ ...prev, [key]: value }));
          }}
          onClearFilters={() => {
            setFilters({
              brand: null,
              collection: null,
              productSeries: null,
              finish: null,
              colorName: null,
              colorNumber: null
            });
          }}
        />
        
        <LabelGrid
          labels={filteredLabels}
          onAddToQueue={handleAddToQueue}
          getImageUrl={getImageUrl}
        />
        
        <PrintQueue
          queue={printQueue}
          onRemove={handleRemoveFromQueue}
          onUpdateQuantity={updateQueueItemQuantity}
          onClearAll={handleClearAll}
          getImageUrl={getImageUrl}
          getPdfUrl={getPdfUrl}
          isOpen={isPrintQueueOpen}
          onClose={() => setIsPrintQueueOpen(false)}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 text-sm text-gray-600">
        {filteredLabels.length} labels found
      </div>
    </div>
  );
}