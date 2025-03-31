import React, { useState } from 'react';
import { SelectOption } from '@/types/grant';

interface MultiSelectProps {
  options: SelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  label: string;
}

/**
 * Multi-select checkbox component for filtering
 */
const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle selection in an array
  const toggleSelection = (array: string[], value: string) => {
    return array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
  };

  // Select all options
  const selectAll = (options: SelectOption[]) => {
    return options.map(option => option.value);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      
      {/* Dropdown button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full px-3 py-2 text-left border rounded-md bg-white hover:bg-gray-50"
      >
        <span className="truncate">
          {selectedValues.length === 0
            ? 'Select options'
            : selectedValues.length === 1
              ? options.find(o => o.value === selectedValues[0])?.label
              : `${selectedValues.length} selected`}
        </span>
        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center mb-2 pb-2 border-b">
              <input
                type="checkbox"
                id={`${label}-select-all`}
                checked={selectedValues.length === options.length}
                onChange={() => {
                  if (selectedValues.length === options.length) {
                    onChange([]);
                  } else {
                    onChange(selectAll(options));
                  }
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor={`${label}-select-all`} className="ml-2 block text-sm font-medium text-gray-700">
                Select All
              </label>
            </div>
            
            {options.map(option => (
              <div key={option.value} className="flex items-center py-1 px-1 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  id={`${label}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onChange={() => onChange(toggleSelection(selectedValues, option.value))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor={`${label}-${option.value}`} className="ml-2 block text-sm text-gray-700 w-full cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;