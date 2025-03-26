import React from 'react';

interface CostSharingFilterProps {
  costSharing: string;
  setCostSharing: (value: string) => void;
  showSaved: boolean;
  setShowSaved: (value: boolean) => void;
  showApplied: boolean;
  setShowApplied: (value: boolean) => void;
  showIgnored: boolean;
  setShowIgnored: (value: boolean) => void;
}

/**
 * Cost sharing filter component with interaction toggles
 */
const CostSharingFilter: React.FC<CostSharingFilterProps> = ({
  costSharing,
  setCostSharing,
  showSaved,
  setShowSaved,
  showApplied,
  setShowApplied,
  showIgnored,
  setShowIgnored
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Cost Sharing</label>
        <select
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          value={costSharing}
          onChange={(e) => setCostSharing(e.target.value)}
        >
          <option value="">Any</option>
          <option value="required">Required</option>
          <option value="not-required">Not Required</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-800 mb-1">Show Grants By Status</label>
        
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showSaved}
              onChange={(e) => setShowSaved(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
          <span className="text-sm font-medium text-gray-800">
            Saved Grants
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showApplied}
              onChange={(e) => setShowApplied(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
          <span className="text-sm font-medium text-gray-800">
            Applied Grants
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showIgnored}
              onChange={(e) => setShowIgnored(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
          <span className="text-sm font-medium text-gray-800">
            Ignored Grants
          </span>
        </div>
      </div>
    </div>
  );
};

export default CostSharingFilter;