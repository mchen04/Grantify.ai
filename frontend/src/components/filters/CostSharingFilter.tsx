import React from 'react';

interface CostSharingFilterProps {
  costSharing: string;
  setCostSharing: (value: string) => void;
}

/**
 * Cost sharing filter component with radio buttons for better UX
 */
const CostSharingFilter: React.FC<CostSharingFilterProps> = ({
  costSharing,
  setCostSharing
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Cost Sharing</label>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center">
          <input
            id="cost-sharing-any"
            type="radio"
            name="cost-sharing"
            value=""
            checked={costSharing === ""}
            onChange={() => setCostSharing("")}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
          />
          <label htmlFor="cost-sharing-any" className="ml-2 block text-sm text-gray-700">
            Any
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            id="cost-sharing-required"
            type="radio"
            name="cost-sharing"
            value="required"
            checked={costSharing === "required"}
            onChange={() => setCostSharing("required")}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
          />
          <label htmlFor="cost-sharing-required" className="ml-2 block text-sm text-gray-700">
            Required
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            id="cost-sharing-not-required"
            type="radio"
            name="cost-sharing"
            value="not-required"
            checked={costSharing === "not-required"}
            onChange={() => setCostSharing("not-required")}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
          />
          <label htmlFor="cost-sharing-not-required" className="ml-2 block text-sm text-gray-700">
            Not Required
          </label>
        </div>
      </div>
    </div>
  );
};

export default CostSharingFilter;