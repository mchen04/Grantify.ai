import React from 'react';
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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="max-h-48 overflow-y-auto border rounded-md p-2">
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
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={`${label}-select-all`} className="ml-2 block text-sm font-medium text-gray-700">
            Select All
          </label>
        </div>
        
        {options.map(option => (
          <div key={option.value} className="flex items-center mb-1">
            <input
              type="checkbox"
              id={`${label}-${option.value}`}
              checked={selectedValues.includes(option.value)}
              onChange={() => onChange(toggleSelection(selectedValues, option.value))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`${label}-${option.value}`} className="ml-2 block text-sm text-gray-700">
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {selectedValues.length > 0 && (
        <div className="mt-1 text-xs text-blue-600">
          {selectedValues.length} of {options.length} selected
        </div>
      )}
    </div>
  );
};

export default MultiSelect;