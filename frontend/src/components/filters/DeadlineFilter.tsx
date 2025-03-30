import React, { useRef, useEffect, useState } from 'react';
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
 * Deadline filter component with a dual-handle slider and checkboxes
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
  const rangeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

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

  // Calculate percentage for positioning handles
  const minPercentage = ((deadlineMinDays - MIN_DEADLINE_DAYS) / (MAX_DEADLINE_DAYS - MIN_DEADLINE_DAYS)) * 100;
  const maxPercentage = ((deadlineMaxDays - MIN_DEADLINE_DAYS) / (MAX_DEADLINE_DAYS - MIN_DEADLINE_DAYS)) * 100;

  // Handle mouse/touch events for slider interaction
  useEffect(() => {
    if (!isDragging || !rangeRef.current) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!rangeRef.current) return;
      
      const rect = rangeRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const offsetX = clientX - rect.left;
      const percentage = Math.min(Math.max(0, offsetX / rect.width), 1);
      const value = Math.round(MIN_DEADLINE_DAYS + percentage * (MAX_DEADLINE_DAYS - MIN_DEADLINE_DAYS));
      
      if (isDragging === 'min') {
        if (value <= deadlineMaxDays) {
          setDeadlineMinDays(value);
        }
      } else if (isDragging === 'max') {
        if (value >= deadlineMinDays) {
          setDeadlineMaxDays(value);
        }
      }
    };

    const handleEnd = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, deadlineMinDays, deadlineMaxDays, setDeadlineMinDays, setDeadlineMaxDays]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Deadline Range: {formatDeadlineText(deadlineMinDays)} - {formatDeadlineText(deadlineMaxDays)}
      </label>
      
      {/* Dual-handle slider */}
      <div className="mt-4 px-2">
        <div
          ref={rangeRef}
          className={`relative w-full h-2 bg-gray-200 rounded-lg ${onlyNoDeadline ? 'opacity-50' : ''}`}
        >
          {/* Selected range highlight */}
          <div
            className="absolute h-full bg-blue-500 rounded-lg"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`
            }}
          />
          
          {/* Minimum handle */}
          <div
            className={`absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -mt-1 -ml-2 cursor-pointer shadow-md ${onlyNoDeadline ? 'cursor-not-allowed' : ''}`}
            style={{ left: `${minPercentage}%` }}
            onMouseDown={() => !onlyNoDeadline && setIsDragging('min')}
            onTouchStart={() => !onlyNoDeadline && setIsDragging('min')}
            role="slider"
            aria-valuemin={MIN_DEADLINE_DAYS}
            aria-valuemax={MAX_DEADLINE_DAYS}
            aria-valuenow={deadlineMinDays}
            aria-label="Minimum deadline days"
            tabIndex={0}
          />
          
          {/* Maximum handle */}
          <div
            className={`absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -mt-1 -ml-2 cursor-pointer shadow-md ${onlyNoDeadline ? 'cursor-not-allowed' : ''}`}
            style={{ left: `${maxPercentage}%` }}
            onMouseDown={() => !onlyNoDeadline && setIsDragging('max')}
            onTouchStart={() => !onlyNoDeadline && setIsDragging('max')}
            role="slider"
            aria-valuemin={MIN_DEADLINE_DAYS}
            aria-valuemax={MAX_DEADLINE_DAYS}
            aria-valuenow={deadlineMaxDays}
            aria-label="Maximum deadline days"
            tabIndex={0}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-3">
          <span>Today</span>
          <span>1 year+</span>
        </div>
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