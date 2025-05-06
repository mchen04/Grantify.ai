import React, { useRef, useEffect, useState, useMemo } from 'react';
import { debounce } from '@/utils/debounce';
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
 * Simplified deadline filter component
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
  const [localDeadlineMinDays, setLocalDeadlineMinDays] = useState(deadlineMinDays);
  const [localDeadlineMaxDays, setLocalDeadlineMaxDays] = useState(deadlineMaxDays);
  
  // Create debounced versions of the setters
  const debouncedSetDeadlineMinDays = useMemo(
    () => debounce((value: number) => {
      setDeadlineMinDays(value);
    }, 300),
    [setDeadlineMinDays]
  );
  
  const debouncedSetDeadlineMaxDays = useMemo(
    () => debounce((value: number) => {
      setDeadlineMaxDays(value);
    }, 300),
    [setDeadlineMaxDays]
  );
  
  // Update local state when props change (e.g., from preset buttons)
  useEffect(() => {
    setLocalDeadlineMinDays(deadlineMinDays);
  }, [deadlineMinDays]);
  
  useEffect(() => {
    setLocalDeadlineMaxDays(deadlineMaxDays);
  }, [deadlineMaxDays]);

  // Format the deadline display text
  const formatDeadlineText = (days: number) => {
    if (days === MAX_DEADLINE_DAYS) {
      return "1 year+";
    } else if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "1 day";
    } else if (days === 7) {
      return "1 week";
    } else if (days === 30) {
      return "1 month";
    } else if (days === 90) {
      return "3 months";
    } else if (days === 180) {
      return "6 months";
    } else {
      return `${days} days`;
    }
  };

  // Calculate percentage for positioning handles
  const minPercentage = ((localDeadlineMinDays - MIN_DEADLINE_DAYS) / (MAX_DEADLINE_DAYS - MIN_DEADLINE_DAYS)) * 100;
  const maxPercentage = ((localDeadlineMaxDays - MIN_DEADLINE_DAYS) / (MAX_DEADLINE_DAYS - MIN_DEADLINE_DAYS)) * 100;

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
        if (value <= localDeadlineMaxDays) {
          setLocalDeadlineMinDays(value);
          debouncedSetDeadlineMinDays(value);
        }
      } else if (isDragging === 'max') {
        if (value >= localDeadlineMinDays) {
          setLocalDeadlineMaxDays(value);
          debouncedSetDeadlineMaxDays(value);
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
  }, [isDragging, localDeadlineMinDays, localDeadlineMaxDays, debouncedSetDeadlineMinDays, debouncedSetDeadlineMaxDays]);

  // Predefined deadline ranges for quick selection
  const deadlinePresets = [
    { label: "Any", min: MIN_DEADLINE_DAYS, max: MAX_DEADLINE_DAYS },
    { label: "Next 7 days", min: MIN_DEADLINE_DAYS, max: 7 },
    { label: "Next 30 days", min: MIN_DEADLINE_DAYS, max: 30 },
    { label: "Next 90 days", min: MIN_DEADLINE_DAYS, max: 90 },
    { label: "Next 6 months", min: MIN_DEADLINE_DAYS, max: 180 },
    { label: "Today", min: 0, max: 0 },
    { label: "1 year+", min: 365, max: MAX_DEADLINE_DAYS },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Deadline Range: {formatDeadlineText(localDeadlineMinDays)} - {formatDeadlineText(localDeadlineMaxDays)}
      </label>
      
      {/* Quick deadline range selection */}
      <div className="flex flex-wrap gap-2 mb-4">
        {deadlinePresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              // Update both local and parent state immediately for preset buttons
              setLocalDeadlineMinDays(preset.min);
              setLocalDeadlineMaxDays(preset.max);
              setDeadlineMinDays(preset.min);
              setDeadlineMaxDays(preset.max);
              if (preset.label === "Any") {
                handleDeadlineOptionChange('include', true);
                handleDeadlineOptionChange('only', false);
              }
            }}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              localDeadlineMinDays === preset.min && localDeadlineMaxDays === preset.max
                ? 'bg-primary-100 text-primary-800 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={onlyNoDeadline}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      {/* Slider */}
      <div className={`mt-2 px-2 ${onlyNoDeadline ? 'opacity-50' : ''}`}>
        <div
          ref={rangeRef}
          className="relative w-full h-2 bg-gray-200 rounded-lg"
        >
          {/* Selected range highlight */}
          <div
            className="absolute h-full bg-primary-500 rounded-lg"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`
            }}
          />
          
          {/* Minimum handle */}
          <div
            className={`absolute w-4 h-4 bg-white border-2 border-primary-500 rounded-full -mt-1 -ml-2 cursor-pointer shadow-md ${onlyNoDeadline ? 'cursor-not-allowed' : ''}`}
            style={{ left: `${minPercentage}%` }}
            onMouseDown={() => !onlyNoDeadline && setIsDragging('min')}
            onTouchStart={() => !onlyNoDeadline && setIsDragging('min')}
            role="slider"
            aria-valuemin={MIN_DEADLINE_DAYS}
            aria-valuemax={MAX_DEADLINE_DAYS}
            aria-valuenow={localDeadlineMinDays}
            aria-label="Minimum deadline days"
            tabIndex={0}
          />
          
          {/* Maximum handle */}
          <div
            className={`absolute w-4 h-4 bg-white border-2 border-primary-500 rounded-full -mt-1 -ml-2 cursor-pointer shadow-md ${onlyNoDeadline ? 'cursor-not-allowed' : ''}`}
            style={{ left: `${maxPercentage}%` }}
            onMouseDown={() => !onlyNoDeadline && setIsDragging('max')}
            onTouchStart={() => !onlyNoDeadline && setIsDragging('max')}
            role="slider"
            aria-valuemin={MIN_DEADLINE_DAYS}
            aria-valuemax={MAX_DEADLINE_DAYS}
            aria-valuenow={localDeadlineMaxDays}
            aria-label="Maximum deadline days"
            tabIndex={0}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Today</span>
          <span>1 year+</span>
        </div>
      </div>
      
      {/* Checkbox */}
      <div className="mt-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="only-no-deadline"
            checked={onlyNoDeadline}
            onChange={(e) => handleDeadlineOptionChange('only', e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="only-no-deadline" className="ml-2 block text-sm text-gray-700">
            Only show grants with no deadline specified
          </label>
        </div>
      </div>
    </div>
  );
};

export default DeadlineFilter;
