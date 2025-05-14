import { NextRequest, NextResponse } from 'next/server';
import supabase from '../../../lib/supabaseClient';

/**
 * Route handler for Supabase auth confirmation
 * This handles password reset confirmation links from Supabase
 * It extracts token_hash and type from the query parameters,
 * verifies the OTP with Supabase, and redirects to the reset-password page
 *
 * Note: This route mainly handles query parameter-based links.
 * For hash fragment-based links (#token_hash=XYZ&type=recovery), the reset-password page
 * handles verification directly since hash fragments are not sent to the server.
 */
export async function GET(request: NextRequest) {
  console.log('Auth confirm route accessed');
  
  // Get the token_hash and type parameters from the URL
  const searchParams = request.nextUrl.searchParams;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  
  console.log('Auth confirm parameters:', { tokenHash: tokenHash ? 'present' : 'missing', type });
  
  // Validate parameters
  if (!tokenHash || !type) {
    console.warn('Missing token_hash or type parameters');
    
    // Check if this might be a hash fragment URL that was incorrectly processed
    // Redirect to the reset-password page and let client-side JS handle the hash fragment
    return NextResponse.redirect(new URL('/reset-password', request.url));
  }
  
  // Verify the OTP token
  try {
    // For password reset, the type should be 'recovery'
    if (type === 'recovery') {
      console.log('Verifying recovery OTP token');
      
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      });
      
      if (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.redirect(
          new URL(`/reset-password?error=${encodeURIComponent(error.message)}`, request.url)
        );
      }
      
      console.log('OTP verification successful');
      
      // OTP verification was successful, redirect to reset password page
      return NextResponse.redirect(
        new URL('/reset-password?verified=true', request.url)
      );
    } else {
      console.warn(`Unsupported verification type: ${type}`);
      
      // Handle other verification types if needed (email confirmation, etc.)
      return NextResponse.redirect(
        new URL(`/reset-password?error=unsupported_verification_type&type=${type}`, request.url)
      );
    }
  } catch (err) {
    console.error('Unexpected error during OTP verification:', err);
    return NextResponse.redirect(
      new URL('/reset-password?error=verification_failed', request.url)
    );
  }
}