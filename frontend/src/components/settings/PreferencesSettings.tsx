"use client";

import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { PreferenceItem } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

// Define a more specific type for the preference form if needed
interface PreferenceFormState {
  id?: string; // Present if editing
  type: string;
  value: string; // Assuming value is primarily string for form input
  label?: string;
}

export default function PreferencesSettings() {
  const { user } = useAuth();
  const {
    preferences,
    loading: preferencesLoading,
    error: preferencesError,
    fetchPreferences,
    addPreference,
    updatePreference,
    deletePreference,
  } = useUserPreferences({ userId: user?.id, enabled: !!user });

  const [isEditing, setIsEditing] = useState<PreferenceItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<PreferenceFormState>({ type: '', value: '', label: '' });
  const [componentLoading, setComponentLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user, fetchPreferences]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setMessage({ type: 'error', text: 'User not found.' });
      return;
    }
    setComponentLoading(true);
    setMessage(null);

    const preferenceData: PreferenceItem = {
      id: isEditing ? isEditing.id : `${formState.type}_${Date.now()}`, // Generate ID if new
      userId: user.id,
      type: formState.type,
      value: formState.value, // Consider type conversion if value can be non-string
      label: formState.label || undefined,
    };

    try {
      if (isEditing) {
        await updatePreference(preferenceData);
        setMessage({ type: 'success', text: 'Preference updated successfully!' });
      } else {
        await addPreference(preferenceData);
        setMessage({ type: 'success', text: 'Preference added successfully!' });
      }
      setShowForm(false);
      setIsEditing(null);
      setFormState({ type: '', value: '', label: '' }); // Reset form
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save preference.' });
    } finally {
      setComponentLoading(false);
    }
  };

  const handleEdit = (preference: PreferenceItem) => {
    setIsEditing(preference);
    setFormState({
      id: preference.id,
      type: preference.type,
      value: String(preference.value), // Ensure value is string for form
      label: preference.label || '',
    });
    setShowForm(true);
    setMessage(null);
  };

  const handleDelete = async (preferenceId: string) => {
    setComponentLoading(true);
    setMessage(null);
    try {
      await deletePreference(preferenceId);
      setMessage({ type: 'success', text: 'Preference deleted successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete preference.' });
    } finally {
      setComponentLoading(false);
    }
  };

  const openAddNewForm = () => {
    setIsEditing(null);
    setFormState({ type: '', value: '', label: '' });
    setShowForm(true);
    setMessage(null);
  };

  if (preferencesLoading) {
    return <div className="text-center py-4">Loading preferences...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Manage Preferences</h2>
        {!showForm && (
          <button
            onClick={openAddNewForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            Add New Preference
          </button>
        )}
      </div>

      <div className="p-4">
        {message && (
          <div className={`p-3 mb-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {preferencesError && (
          <div className="p-3 mb-4 rounded-md text-sm bg-red-50 text-red-700">
            Error loading preferences: {preferencesError}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-md font-semibold text-gray-700">{isEditing ? 'Edit Preference' : 'Add New Preference'}</h3>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input
                type="text"
                name="type"
                id="type"
                value={formState.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., topic, agency, funding_min"
                required
              />
            </div>
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <input
                type="text"
                name="value"
                id="value"
                value={formState.value}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., AI, NSF, 50000"
                required
              />
            </div>
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">Label (Optional)</label>
              <input
                type="text"
                name="label"
                id="label"
                value={formState.label}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Artificial Intelligence"
              />
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={componentLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm disabled:opacity-70"
              >
                {componentLoading ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Preference')}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setIsEditing(null); setMessage(null); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {(!preferences || preferences.length === 0) && !preferencesLoading && !showForm && (
          <p className="text-gray-600">No preferences set yet. Click Add New Preference to get started.</p>
        )}

        {preferences && preferences.length > 0 && (
          <div className="space-y-3">
            {preferences.map((pref) => (
              <div key={pref.id} className="p-3 border border-gray-200 rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-800">{pref.label || pref.type}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{pref.type}:</span> {String(pref.value)}
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEdit(pref)}
                    disabled={componentLoading}
                    className="px-3 py-1.5 bg-yellow-500 text-white rounded-md font-medium hover:bg-yellow-600 transition-colors text-xs disabled:opacity-70"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pref.id)}
                    disabled={componentLoading}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors text-xs disabled:opacity-70"
                  >
                    {componentLoading && isEditing?.id !== pref.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}