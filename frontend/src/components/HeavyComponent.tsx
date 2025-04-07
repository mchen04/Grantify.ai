"use client";

import React from 'react';

// This is a placeholder for a component that would be heavy to load
// In a real application, this might be a complex chart, rich text editor, etc.
const HeavyComponent = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">Dynamically Loaded Component</h3>
      <p className="text-gray-600">
        This component was loaded dynamically to improve initial page load performance.
        In a real application, this could be a complex visualization, rich text editor,
        or any other component that isn't needed for the initial render.
      </p>
    </div>
  );
};

export default HeavyComponent;