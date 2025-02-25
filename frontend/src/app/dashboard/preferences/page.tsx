"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { GRANT_CATEGORIES, GRANT_AGENCIES, DEFAULT_USER_PREFERENCES } from '@/lib/config';
import supabase from '@/lib/supabaseClient';

type EmailFrequency = 'daily' | 'weekly' | 'never';

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
  const [eligibleTypes, setEligibleTypes] = useState<string[]>([]);
  const [emailFrequency, setEmailFrequency] = useState<EmailFrequency>('weekly');
  const [notifyNewMatches, setNotifyNewMatches] = useState<boolean>(true);
  const [notifyDeadlines, setNotifyDeadlines] = useState<boolean>(true);

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
          setEligibleTypes(data.eligible_applicant_types || []);
          
          if (data.notification_settings) {
            const frequency = data.notification_settings.email_frequency || 'weekly';
            setEmailFrequency(frequency as EmailFrequency);
            setNotifyNewMatches(data.notification_settings.notify_new_matches || true);
            setNotifyDeadlines(data.notification_settings.notify_deadlines || true);
          }
        } else {
          // If no preferences exist yet, use defaults
          setSelectedTopics(DEFAULT_USER_PREFERENCES.topics || []);
          setFundingMin(DEFAULT_USER_PREFERENCES.funding_min || 0);
          setFundingMax(DEFAULT_USER_PREFERENCES.funding_max || 1000000);
          setSelectedAgencies(DEFAULT_USER_PREFERENCES.agencies || []);
          setEligibleTypes(DEFAULT_USER_PREFERENCES.eligible_applicant_types || []);
          
          if (DEFAULT_USER_PREFERENCES.notification_settings) {
            const frequency = DEFAULT_USER_PREFERENCES.notification_settings.email_frequency || 'weekly';
            setEmailFrequency(frequency as EmailFrequency);
            setNotifyNewMatches(DEFAULT_USER_PREFERENCES.notification_settings.notify_new_matches || true);
            setNotifyDeadlines(DEFAULT_USER_PREFERENCES.notification_settings.notify_deadlines || true);
          }
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
      
      // Prepare preferences object
      const preferences = {
        user_id: user.id,
        topics: selectedTopics,
        funding_min: fundingMin,
        funding_max: fundingMax,
        agencies: selectedAgencies,
        eligible_applicant_types: eligibleTypes,
        notification_settings: {
          email_frequency: emailFrequency,
          notify_new_matches: notifyNewMatches,
          notify_deadlines: notifyDeadlines,
        },
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

  // Toggle eligible applicant type
  const toggleEligibleType = (type: string) => {
    if (eligibleTypes.includes(type)) {
      setEligibleTypes(eligibleTypes.filter(t => t !== type));
    } else {
      setEligibleTypes([...eligibleTypes, type]);
    }
  };

  // Handle email frequency change
  const handleEmailFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'daily' || value === 'weekly' || value === 'never') {
      setEmailFrequency(value);
    }
  };

  // Show loading state while checking authentication
  if (isLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Preferences</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
        
        {message && (
          <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Research Topics */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Research Topics</h2>
            <p className="text-gray-600 mb-4">Select topics that interest you to receive relevant grant recommendations.</p>
            
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
          
          {/* Funding Range */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Funding Range</h2>
            <p className="text-gray-600 mb-4">Specify your preferred funding range.</p>
            
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Funding Agencies */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Funding Agencies</h2>
            <p className="text-gray-600 mb-4">Select agencies you're interested in receiving grants from.</p>
            
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
          
          {/* Eligible Applicant Types */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Eligible Applicant Types</h2>
            <p className="text-gray-600 mb-4">Select the types of applicants you qualify as.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Public and State controlled institutions of higher education',
                'Private institutions of higher education',
                'Nonprofit organizations with 501(c)(3) status',
                'Small businesses',
                'For profit organizations other than small businesses',
                'State governments',
                'County governments',
                'City or township governments',
                'Special district governments',
                'Native American tribal governments',
                'Individuals',
              ].map((type) => (
                <div key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`type-${type}`}
                    checked={eligibleTypes.includes(type)}
                    onChange={() => toggleEligibleType(type)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`type-${type}`} className="ml-2 text-sm text-gray-700">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Notification Settings */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
            <p className="text-gray-600 mb-4">Configure how you want to receive notifications.</p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="emailFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Frequency
                </label>
                <select
                  id="emailFrequency"
                  value={emailFrequency}
                  onChange={handleEmailFrequencyChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="never">Never</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyNewMatches"
                  checked={notifyNewMatches}
                  onChange={(e) => setNotifyNewMatches(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifyNewMatches" className="ml-2 text-sm text-gray-700">
                  Notify me about new matching grants
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyDeadlines"
                  checked={notifyDeadlines}
                  onChange={(e) => setNotifyDeadlines(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifyDeadlines" className="ml-2 text-sm text-gray-700">
                  Notify me about upcoming deadlines
                </label>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors ${
                saving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}