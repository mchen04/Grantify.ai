"use client";

import React from 'react';

interface ApplyConfirmationPopupProps {
  isOpen: boolean;
  grantTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ApplyConfirmationPopup: React.FC<ApplyConfirmationPopupProps> = ({
  isOpen,
  grantTitle,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">Confirm Application</h3>
        <p className="mb-4">
          Did you apply for the grant: <span className="font-medium">{grantTitle}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyConfirmationPopup;