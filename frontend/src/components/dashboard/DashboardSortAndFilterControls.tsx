"use client";

import React from 'react';
import { SelectOption } from '@/types/grant';

interface DashboardSortAndFilterControlsProps {
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOptions: SelectOption[];
  resetFilters?: () => void;
}

/**
 * Component for sort controls in dashboard tabs
 */
const DashboardSortAndFilterControls: React.FC<DashboardSortAndFilterControlsProps> = ({
  sortBy,
  setSortBy,
  sortOptions,
  resetFilters
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
      </div>
      
      {resetFilters && (
        <div>
          <button
            type="button"
            onClick={resetFilters}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardSortAndFilterControls;