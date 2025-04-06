"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GRANT_CATEGORIES, GRANT_AGENCIES, DEFAULT_USER_PREFERENCES, DEADLINE_RANGES } from '@/lib/config';
import supabase from '@/lib/supabaseClient';
import SettingsLayout from '@/components/settings/SettingsLayout';

export default function Preferences() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preferences state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [fundingMin, setFundingMin] = useState<number>(0);
  const [fundingMax, setFundingMax] = useState<number>(1000000);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [deadlineRange, setDeadlineRange] = useState<string>('0');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Load user preferences from Supabase
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch user preferences from Supabase
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          throw error;
        }

        if (data) {
          // Set state from preferences
          setSelectedTopics(data.topics || []);
          setFundingMin(data.funding_min || 0);
          setFundingMax(data.funding_max || 1000000);
          setSelectedAgencies(data.agencies || []);
          setDeadlineRange(data.deadline_range || '0');
        } else {
          // If no preferences exist yet, use defaults
          setSelectedTopics(DEFAULT_USER_PREFERENCES.topics || []);
          setFundingMin(DEFAULT_USER_PREFERENCES.funding_min || 0);
          setFundingMax(DEFAULT_USER_PREFERENCES.funding_max || 1000000);
          setSelectedAgencies(DEFAULT_USER_PREFERENCES.agencies || []);
          setDeadlineRange(DEFAULT_USER_PREFERENCES.deadline_range || '0');
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setMessage({ type: 'error', text: 'Failed to load preferences' });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Handle form submission - Save to Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setSaving(true);
      setMessage(null);

      // Prepare preferences object
      const preferences = {
        user_id: user.id,
        topics: selectedTopics,
        funding_min: fundingMin,
        funding_max: fundingMax,
        agencies: selectedAgencies,
        deadline_range: deadlineRange,
        updated_at: new Date().toISOString(),
      };

      // Save preferences to Supabase using upsert
      const { error } = await supabase
        .from('user_preferences')
        .upsert(preferences, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Preferences saved successfully' });

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: `Failed to save preferences: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  // Toggle topic selection
  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  // Toggle agency selection
  const toggleAgency = (agency: string) => {
    if (selectedAgencies.includes(agency)) {
      setSelectedAgencies(selectedAgencies.filter(a => a !== agency));
    } else {
      setSelectedAgencies([...selectedAgencies, agency]);
    }
  };

  const handleDeadlineRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDeadlineRange(e.target.value);
  };

  // Show loading state while checking authentication
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  return (
    <SettingsLayout
      title="Preferences"
      description="Customize your grant recommendations and search experience"
    >
      {message && (
        <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Research Topics */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Research Topics</h2>
            <span className="text-sm text-blue-600">{selectedTopics.length} selected</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Select topics that interest you to receive relevant grant recommendations.</p>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {GRANT_CATEGORIES.map((topic) => (
                <div key={topic} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`topic-${topic}`}
                    checked={selectedTopics.includes(topic)}
                    onChange={() => toggleTopic(topic)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`topic-${topic}`} className="ml-2 text-sm text-gray-700">
                    {topic}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Funding Range */}
        <div className="mb-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Funding Range</h2>
          <p className="text-sm text-gray-600 mb-4">Specify your preferred funding range.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fundingMin" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Funding ($)
              </label>
              <input
                type="number"
                id="fundingMin"
                value={fundingMin}
                onChange={(e) => setFundingMin(parseInt(e.target.value) || 0)}
                min="0"
                step="1000"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="fundingMax" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Funding ($)
              </label>
              <input
                type="number"
                id="fundingMax"
                value={fundingMax}
                onChange={(e) => setFundingMax(parseInt(e.target.value) || 0)}
                min="0"
                step="10000"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Deadline Range */}
        <div className="mb-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deadline Range</h2>
          <p className="text-sm text-gray-600 mb-4">Select your preferred deadline timeframe for grants.</p>

          <div>
            <label htmlFor="deadlineRange" className="block text-sm font-medium text-gray-700 mb-1">
              Show grants with deadlines within:
            </label>
            <select
              id="deadlineRange"
              value={deadlineRange}
              onChange={handleDeadlineRangeChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {DEADLINE_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Funding Agencies */}
        <div className="mb-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Funding Agencies</h2>
            <span className="text-sm text-blue-600">{selectedAgencies.length} selected</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Select agencies you're interested in receiving grants from.</p>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {GRANT_AGENCIES.map((agency) => (
                <div key={agency} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`agency-${agency}`}
                    checked={selectedAgencies.includes(agency)}
                    onChange={() => toggleAgency(agency)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`agency-${agency}`} className="ml-2 text-sm text-gray-700">
                    {agency}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className={`px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium transition-colors ${
              saving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </SettingsLayout>
  );
}
