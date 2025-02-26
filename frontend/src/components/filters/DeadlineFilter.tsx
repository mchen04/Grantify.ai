import React from 'react';
import { MIN_DEADLINE_DAYS, MAX_DEADLINE_DAYS } from '@/utils/constants';

interface DeadlineFilterProps {
  deadlineMinDays: number;
  deadlineMaxDays: number;
  includeNoDeadline: boolean;
  onlyNoDeadline: boolean;
  setDeadlineMinDays: (value: number) => void;
  setDeadlineMaxDays: (value: number) => void;
  handleDeadlineOptionChange: (option: 'include' | 'only', checked: boolean) => void;
}

/**
 * Deadline filter component with dual sliders and checkboxes
 */
const DeadlineFilter: React.FC<DeadlineFilterProps> = ({
  deadlineMinDays,
  deadlineMaxDays,
  includeNoDeadline,
  onlyNoDeadline,
  setDeadlineMinDays,
  setDeadlineMaxDays,
  handleDeadlineOptionChange
}) => {
  // Format the deadline display text
  const formatDeadlineText = (days: number) => {
    if (days === MAX_DEADLINE_DAYS) {
      return "1 year+";
    } else if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "1 day";
    } else {
      return `${days} days`;
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Deadline Range: {formatDeadlineText(deadlineMinDays)} - {formatDeadlineText(deadlineMaxDays)}
      </label>
      
      {/* Minimum days slider */}
      <div className="mt-4 px-2">
        <label className="block text-xs text-gray-600 mb-1">Minimum days:</label>
        <input
          type="range"
          min={MIN_DEADLINE_DAYS}
          max={MAX_DEADLINE_DAYS}
          step="1"
          value={deadlineMinDays}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (value <= deadlineMaxDays) {
              setDeadlineMinDays(value);
            }
          }}
          disabled={onlyNoDeadline}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${onlyNoDeadline ? 'opacity-50' : ''}`}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Today</span>
          <span>1 year+</span>
        </div>
      </div>
      
      {/* Maximum days slider */}
      <div className="mt-4 px-2">
        <label className="block text-xs text-gray-600 mb-1">Maximum days:</label>
        <input
          type="range"
          min={MIN_DEADLINE_DAYS}
          max={MAX_DEADLINE_DAYS}
          step="1"
          value={deadlineMaxDays}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (value >= deadlineMinDays) {
              setDeadlineMaxDays(value);
            }
          }}
          disabled={onlyNoDeadline}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${onlyNoDeadline ? 'opacity-50' : ''}`}
        />
      </div>
      
      <div className="mt-3 space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="include-no-deadline"
            checked={includeNoDeadline}
            onChange={(e) => handleDeadlineOptionChange('include', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="include-no-deadline" className="ml-2 block text-sm text-gray-700">
            Include grants with no deadline specified
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="only-no-deadline"
            checked={onlyNoDeadline}
            onChange={(e) => handleDeadlineOptionChange('only', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="only-no-deadline" className="ml-2 block text-sm text-gray-700">
            Only show grants with no deadline specified
          </label>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              setDeadlineMinDays(MIN_DEADLINE_DAYS);
              setDeadlineMaxDays(MAX_DEADLINE_DAYS);
            }}
            disabled={onlyNoDeadline}
            className={`text-xs text-blue-600 hover:text-blue-800 ${onlyNoDeadline ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Reset Range
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeadlineFilter;