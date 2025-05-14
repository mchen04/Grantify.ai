'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import supabase from '../../lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { validatePassword } from '@/utils/passwordValidator';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';

// IMPORTANT: Configure your Supabase Authentication Settings (under "URL Configuration")
// to point the "Site URL" and "Redirect URLs" to the URL of this password reset page.
// For example: YOUR_APP_URL/reset-password

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  
  // Validate password and check if passwords match whenever they change
  const passwordValidation = useMemo(() => {
    return validatePassword(newPassword);
  }, [newPassword]);
  
  // Check if passwords match whenever either password changes
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }
  }, [newPassword, confirmPassword]);

  // Function to handle auth state changes
  useEffect(() => {
    // If we've verified and the user is now authenticated, that means
    // the hash-based verification succeeded and we can proceed
    if (verificationAttempted && user) {
      console.log("User is authenticated after verification attempt:", {
        id: user.id,
        email: user.email,
        isComplete: !!user.id && !!user.email
      });
      setIsVerified(true);
      setLoading(false);
    } else if (verificationAttempted) {
      console.log("Verification attempted but user not authenticated yet");
    }
  }, [user, verificationAttempted]);

  useEffect(() => {
    // First check for query parameters (server-side verification)
    const verified = searchParams.get('verified');
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      setError(`Password reset error: ${decodeURIComponent(errorParam)}`);
      setLoading(false);
      return;
    }
    
    if (verified === 'true') {
      // User has been verified through the proper OTP verification flow
      setIsVerified(true);
      setLoading(false);
      return;
    }

    // Check if the user is already authenticated from a previous verification
    if (user) {
      console.log("User is already authenticated:", {
        id: user.id,
        email: user.email,
        isComplete: !!user.id && !!user.email,
        authSource: window.location.hash ? "hash_fragment" : "existing_session"
      });
      
      // If there's a hash fragment, this is likely a recovery flow
      // In this case, even though the user is authenticated, we should allow password reset
      const hashFragment = window.location.hash;
      if (hashFragment && hashFragment.includes('type=recovery')) {
        console.log("User is authenticated via recovery hash, allowing password reset");
        setIsVerified(true);
        setLoading(false);
        return;
      }
      
      // For regular authenticated users without recovery hash, just mark as verified
      setIsVerified(true);
      setLoading(false);
      return;
    }

    // If no query parameters, check for hash fragment (client-side verification)
    const checkHashFragment = async () => {
      const hashFragment = window.location.hash;
      console.log("Hash fragment detected:", hashFragment);
      
      if (hashFragment) {
        // Try to parse the hash fragment
        try {
          // Parse the hash fragment
          const hashParams = new URLSearchParams(hashFragment.substring(1));
          
          // Log all parameters in the hash for debugging
          console.log("All hash parameters:", Object.fromEntries(hashParams.entries()));
          
          // Look for the new hash format with access_token, refresh_token, and type=recovery
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const hashType = hashParams.get('type');
          
          console.log("Parsed hash parameters:", {
            type: hashType,
            access_token: accessToken ? `${accessToken.substring(0, 10)}...` : null,
            refresh_token: refreshToken ? `${refreshToken.substring(0, 5)}...` : null,
            has_access_token: !!accessToken,
            has_refresh_token: !!refreshToken
          });

          if (hashType === 'recovery' && accessToken) {
            console.log("Valid recovery hash detected with access_token");
            
            // With the new hash format, Supabase should automatically set up the session
            // Just mark verification as attempted and let the auth state listener handle it
            setVerificationAttempted(true);
            
            // Set a short timeout to allow the auth system to process the tokens
            // This helps when Supabase auto-processes the hash but auth context hasn't updated yet
            setTimeout(() => {
              if (user) {
                console.log("User already authenticated after hash check");
                setIsVerified(true);
                setLoading(false);
              } else {
                console.log("Waiting for authentication state update...");
                // The useEffect watching for user changes will handle setting isVerified
              }
            }, 500);
          } else {
            // Try legacy format as fallback
            const hashTokenHash = hashParams.get('token_hash');
            
            if (hashType === 'recovery' && hashTokenHash) {
              console.log("Legacy recovery hash format detected with token_hash");
              await verifyLegacyHashBasedToken(hashType, hashTokenHash);
            } else {
              setError('Invalid password reset link. Missing expected parameters in hash fragment.');
              console.error('Invalid hash parameters:', { type: hashType, has_access_token: !!accessToken });
              setLoading(false);
            }
          }
        } catch (err) {
          console.error("Error parsing hash fragment:", err);
          setError('Invalid password reset link. Could not parse hash fragment.');
          setLoading(false);
        }
      } else {
        // No verification parameter or hash fragment, direct user to request password reset
        setError('Please request a password reset link from the login page');
        setLoading(false);
      }
    };

    checkHashFragment();
  }, [searchParams, user]);

  // This is kept for backward compatibility with older reset links
  const verifyLegacyHashBasedToken = async (type: string, tokenHash: string) => {
    try {
      console.log("Verifying legacy hash-based token:", { type, tokenHash });
      setVerificationAttempted(true);
      
      // Ensure the type is valid for Supabase auth API
      // TypeScript expects a specific OTP type, not just any string
      if (type !== 'recovery') {
        console.error('Invalid OTP type for verification:', type);
        setError('Invalid password reset link type.');
        setLoading(false);
        return false;
      }
      
      // Verify the hash-based OTP token directly
      // This will create a new session if successful
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery' // Explicitly use the correct string literal type
      });
      
      if (error) {
        console.error('Error verifying legacy hash-based token:', error);
        setError(`Failed to verify password reset link: ${error.message}`);
        setLoading(false);
        return false;
      } else {
        console.log("Legacy hash-based token verified successfully");
        console.log("Verification data:", data);
        
        // We'll rely on the auth state change listener to detect when the user becomes authenticated
        // The useEffect hook watching 'user' will handle setting isVerified = true
        
        // For immediate feedback, check if we got a session back
        if (data?.session) {
          setIsVerified(true);
          setLoading(false);
          return true;
        }
        
        // Keep loading for now, the auth state listener should pick up the change
        return false;
      }
    } catch (err) {
      console.error('Unexpected error during legacy hash-based token verification:', err);
      setError('An unexpected error occurred during verification. Please try again.');
      setLoading(false);
      return false;
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }
    
    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    setLoading(true);

    try {
      // Update the user's password
      console.log("Attempting to update user password");
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      setLoading(false);

      if (updateError) {
        console.error('Password update error:', updateError);
        setError(`Failed to reset password: ${updateError.message}`);
      } else {
        setMessage('Your password has been reset successfully. Redirecting to login...');
        console.log('Password update successful:', {
          user: data.user ? {
            id: data.user.id,
            email: data.user.email,
            updated_at: data.user.updated_at
          } : null
        });
        
        // Sign out the user to clear any temporary session
        console.log("Signing out user after successful password reset");
        await supabase.auth.signOut();
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push('/login?reset_success=true');
        }, 3000); // Redirect after 3 seconds
      }
    } catch (err) {
      setLoading(false);
      console.error('Unexpected error during password update:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="ml-3">Verifying your reset link...</p>
      </div>
    );
  }

  if (error && !message) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg max-w-md w-full">
          <h3 className="text-2xl font-bold text-center text-red-600 mb-2">Password Reset Error</h3>
          <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg">{error}</div>
          <div className="flex flex-col space-y-3 mt-6">
            <button
              onClick={() => router.push('/login?reset=true')}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-green-600 text-center font-medium text-lg">{message}</div>
          <div className="mt-4 flex justify-center">
            <div className="animate-pulse text-sm text-gray-500">Redirecting...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg max-w-md w-full">
          <h3 className="text-2xl font-bold text-center">Password Reset Link Invalid</h3>
          <p className="mt-4 text-gray-600">
            This page is only accessible through a valid password reset link.
            Please request a password reset from the login page.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => router.push('/login?reset=true')}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Request Reset Link
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg max-w-md w-full">
        <div className="flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-center">Reset Password</h3>
        <p className="text-gray-600 text-sm mt-2 text-center">Please enter your new password below</p>
        
        <form onSubmit={handleResetPassword} className="mt-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium" htmlFor="newPassword">New Password</label>
            <input
              type="password"
              placeholder="Enter your new password"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <PasswordStrengthIndicator password={newPassword} />
          </div>
          <div className="mt-4">
            <label className="block text-gray-700 text-sm font-medium" htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm your new password"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {!passwordsMatch && confirmPassword && (
              <div className="text-xs text-red-600 mt-1">
                Passwords do not match
              </div>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-2 bg-red-50 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mt-4 p-2 bg-green-50 text-green-600 text-sm rounded-md">
              {message}
            </div>
          )}
          
          <div className="mt-6">
            <button
              type="submit"
              className={`w-full px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors ${
                (!passwordValidation.isValid || !passwordsMatch || loading)
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={!passwordValidation.isValid || !passwordsMatch || loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting Password...
                </span>
              ) : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}