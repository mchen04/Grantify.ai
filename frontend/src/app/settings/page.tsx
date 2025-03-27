"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { user, isLoading, updatePassword } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form states
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    if (user) {
      setCurrentEmail(user.email || '');
    }
  }, [user, isLoading, router]);

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate passwords
    if (!newPassword) {
      setMessage({ type: 'error', text: 'Please enter a new password' });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    
    // Validate current password
    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Please enter your current password' });
      return;
    }
    
    try {
      setLoading(true);
      setMessage(null);
      
      const { error } = await updatePassword(newPassword, currentPassword);
      
      if (error) {
        throw error;
      }
      
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      
    } catch (error: any) {
      console.error('Error updating password:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update password. Please try again.' 
      });
    } finally {
      setLoading(false);
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
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
        
        {message && (
          <div className={`p-3 mb-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Account Information */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">User ID</p>
                  <p className="text-base text-gray-900 truncate">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Sign In</p>
                  <p className="text-base text-gray-900">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Created</p>
                  <p className="text-base text-gray-900">
                    {user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Password Update Form */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Update Password</h2>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}