import React, { useRef, useEffect, useState } from 'react';
import { MAX_FUNDING } from '@/utils/constants';

interface FundingRangeFilterProps {
  fundingMin: number;
  fundingMax: number;
  includeFundingNull: boolean;
  onlyNoFunding: boolean;
  setFundingMin: (value: number) => void;
  setFundingMax: (value: number) => void;
  handleFundingOptionChange: (option: 'include' | 'only', checked: boolean) => void;
}

/**
 * Simplified funding range filter component
 */
const FundingRangeFilter: React.FC<FundingRangeFilterProps> = ({
  fundingMin,
  fundingMax,
  includeFundingNull,
  onlyNoFunding,
  setFundingMin,
  setFundingMax,
  handleFundingOptionChange
}) => {
  const rangeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    if (amount === MAX_FUNDING) {
      return "$5M+";
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate percentage for positioning handles
  const minPercentage = (fundingMin / MAX_FUNDING) * 100;
  const maxPercentage = (fundingMax / MAX_FUNDING) * 100;

  // Handle mouse/touch events for slider interaction
  useEffect(() => {
    if (!isDragging || !rangeRef.current) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!rangeRef.current) return;
      
      const rect = rangeRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const offsetX = clientX - rect.left;
      const percentage = Math.min(Math.max(0, offsetX / rect.width), 1);
      
      // Round to nearest step (100000 for better usability)
      const value = Math.round((percentage * MAX_FUNDING) / 100000) * 100000;
      
      if (isDragging === 'min') {
        if (value <= fundingMax) {
          setFundingMin(value);
        }
      } else if (isDragging === 'max') {
        if (value >= fundingMin) {
          setFundingMax(value);
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
  }, [isDragging, fundingMin, fundingMax, setFundingMin, setFundingMax]);

  // Predefined funding ranges for quick selection
  const fundingPresets = [
    { label: "Any", min: 0, max: MAX_FUNDING },
    { label: "Under $100K", min: 0, max: 100000 },
    { label: "$100K-$500K", min: 100000, max: 500000 },
    { label: "$500K-$1M", min: 500000, max: 1000000 },
    { label: "$1M-$5M", min: 1000000, max: 5000000 },
    { label: "$5M+", min: 5000000, max: MAX_FUNDING }
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Funding Range: {formatCurrency(fundingMin)} - {formatCurrency(fundingMax)}
      </label>
      
      {/* Quick funding range selection */}
      <div className="flex flex-wrap gap-2 mb-4">
        {fundingPresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setFundingMin(preset.min);
              setFundingMax(preset.max);
              if (preset.label === "Any") {
                handleFundingOptionChange('include', true);
                handleFundingOptionChange('only', false);
              }
            }}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              fundingMin === preset.min && fundingMax === preset.max
                ? 'bg-primary-100 text-primary-800 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={onlyNoFunding}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      {/* Slider */}
      <div className={`mt-2 px-2 ${onlyNoFunding ? 'opacity-50' : ''}`}>
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
            className={`absolute w-4 h-4 bg-white border-2 border-primary-500 rounded-full -mt-1 -ml-2 cursor-pointer shadow-md ${onlyNoFunding ? 'cursor-not-allowed' : ''}`}
            style={{ left: `${minPercentage}%` }}
            onMouseDown={() => !onlyNoFunding && setIsDragging('min')}
            onTouchStart={() => !onlyNoFunding && setIsDragging('min')}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={MAX_FUNDING}
            aria-valuenow={fundingMin}
            aria-label="Minimum funding amount"
            tabIndex={0}
          />
          
          {/* Maximum handle */}
          <div
            className={`absolute w-4 h-4 bg-white border-2 border-primary-500 rounded-full -mt-1 -ml-2 cursor-pointer shadow-md ${onlyNoFunding ? 'cursor-not-allowed' : ''}`}
            style={{ left: `${maxPercentage}%` }}
            onMouseDown={() => !onlyNoFunding && setIsDragging('max')}
            onTouchStart={() => !onlyNoFunding && setIsDragging('max')}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={MAX_FUNDING}
            aria-valuenow={fundingMax}
            aria-label="Maximum funding amount"
            tabIndex={0}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>$0</span>
          <span>$5M+</span>
        </div>
      </div>
      
      {/* Checkboxes */}
      <div className="mt-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="only-no-funding"
            checked={onlyNoFunding}
            onChange={(e) => handleFundingOptionChange('only', e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="only-no-funding" className="ml-2 block text-sm text-gray-700">
            Only show grants with no funding specified
          </label>
        </div>
      </div>
    </div>
  );
};

export default FundingRangeFilter;