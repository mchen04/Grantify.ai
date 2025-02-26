import React from 'react';

interface CostSharingFilterProps {
  costSharing: string;
  setCostSharing: (value: string) => void;
}

/**
 * Cost sharing filter component
 */
const CostSharingFilter: React.FC<CostSharingFilterProps> = ({
  costSharing,
  setCostSharing
}) => {
  return (
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
  );
};

export default CostSharingFilter;