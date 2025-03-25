import React from 'react';
import { SelectOption } from '@/types/grant';

interface SortAndFilterControlsProps {
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOptions: SelectOption[];
  resetFilters: () => void;
  showInteracted: boolean;
  setShowInteracted: (value: boolean) => void;
}

/**
 * Component for sort controls and filter action buttons
 */
const SortAndFilterControls: React.FC<SortAndFilterControlsProps> = ({
  sortBy,
  setSortBy,
  sortOptions,
  resetFilters,
  showInteracted,
  setShowInteracted
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-6">
        {/* Sort by */}
        <div className="w-64">
        <label className="block text-sm font-medium text-gray-800 mb-1">Sort by</label>
          <select
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showInteracted}
              onChange={(e) => setShowInteracted(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <span className="text-sm font-medium text-gray-800">
            Show interacted grants
          </span>
        </div>
      </div>
      
      <div className="flex space-x-4">
        <button 
          type="button"
          onClick={resetFilters}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          Reset Filters
        </button>
        
        <button 
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default SortAndFilterControls;