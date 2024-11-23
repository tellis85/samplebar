'use client';

import { Menu } from '@headlessui/react';
import { ChevronDown, X, RefreshCw } from 'lucide-react';
import { Label, FilterState } from '@/types';

interface FilterPanelProps {
  filters: FilterState;
  data: Label[];
  onFilterChange: (key: keyof FilterState, value: string | null) => void;
  onClearFilters: () => void;
}

export function FilterPanel({ filters, data, onFilterChange, onClearFilters }: FilterPanelProps) {
  const getOptions = (field: keyof Label) => {
    const filtered = data.filter(item => {
      if (filters.brand && field !== 'Brand' && item.Brand !== filters.brand) return false;
      if (filters.collection && field !== 'Collection' && item.Collection !== filters.collection) return false;
      if (filters.productSeries && field !== 'Product Series' && item["Product Series"] !== filters.productSeries) return false;
      if (filters.finish && field !== 'Finish' && item.Finish !== filters.finish) return false;
      if (filters.colorName && field !== 'Color Name' && item["Color Name"] !== filters.colorName) return false;
      if (filters.colorNumber && field !== 'Color Number' && item["Color Number"] !== filters.colorNumber) return false;
      return true;
    });

    return [...new Set(filtered.map(item => item[field]?.toString() || ''))]
      .filter(Boolean)
      .sort();
  };

  const isDisabled = (key: keyof FilterState) => {
    if (key === 'brand' || key === 'collection' || key === 'productSeries') return false;
    return !filters.productSeries;
  };

  const filterConfigs = [
    { key: 'brand' as const, label: 'Brand', field: 'Brand' as keyof Label },
    { key: 'collection' as const, label: 'Collection', field: 'Collection' as keyof Label },
    { key: 'productSeries' as const, label: 'Product Series', field: 'Product Series' as keyof Label },
    { key: 'colorName' as const, label: 'Color Name', field: 'Color Name' as keyof Label },
    { key: 'colorNumber' as const, label: 'Color Number', field: 'Color Number' as keyof Label },
    { key: 'finish' as const, label: 'Finish', field: 'Finish' as keyof Label },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Filters</h2>
        <div className="flex items-center gap-2">
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={onClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reset All
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filterConfigs.map(({ key, label, field }) => (
          <div key={key} className="relative">
            <Menu as="div" className="relative">
              <Menu.Button 
                disabled={isDisabled(key)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md
                  ${isDisabled(key) 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white hover:bg-gray-50'
                  }
                `}
              >
                <span className="truncate">
                  {filters[key] || `Select ${label}...`}
                </span>
                <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
              </Menu.Button>

              {!isDisabled(key) && (
                <Menu.Items className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  <div className="sticky top-0 bg-white border-b px-3 py-2">
                    <div className="flex justify-end items-center">
                      <button
                        className="text-xs text-blue-600 hover:text-blue-700"
                        onClick={() => onFilterChange(key, null)}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  {getOptions(field).map((option) => (
                    <Menu.Item key={option}>
                      {({ active }) => (
                        <button
                          className={`
                            w-full text-left px-3 py-2 text-sm truncate
                            ${active ? 'bg-blue-50' : ''}
                            ${filters[key] === option ? 'bg-blue-100 text-blue-700' : ''}
                          `}
                          onClick={() => onFilterChange(key, option)}
                        >
                          {option}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              )}
            </Menu>

            {filters[key] && !isDisabled(key) && (
              <button
                onClick={() => onFilterChange(key, null)}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {Object.entries(filters).map(([key, value]) => 
          value ? (
            <div 
              key={key}
              className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-md"
            >
              <span className="text-sm text-blue-700 truncate flex-1 mr-2">{value}</span>
              <button
                onClick={() => onFilterChange(key as keyof FilterState, null)}
                className="text-blue-400 hover:text-blue-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}