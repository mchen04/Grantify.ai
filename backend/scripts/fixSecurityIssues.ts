/**
 * Script to fix security issues in the Supabase database
 * 
 * Usage: ts-node scripts/fixSecurityIssues.ts
 */

import 'dotenv/config';
import * as path from 'path';
import supabase from '../src/db/supabaseClient';
import { execSync } from 'child_process';

async function fixSecurityIssues() {
  try {
    console.log('Starting security fixes...');
    
    // Apply the migration using the existing applyMigration.ts script
    console.log('Applying database migration to fix function search path and extension schema issues...');
    
    execSync('ts-node scripts/applyMigration.ts --migration=fix_security_issues.sql', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('\nDatabase migration applied successfully!');
    console.log('\n-------------------------------------------------');
    console.log('IMPORTANT: Manual steps required in Supabase Dashboard');
    console.log('-------------------------------------------------');
    console.log('1. Auth OTP Long Expiry:');
    console.log('   - Go to Authentication > Email Templates');
    console.log('   - Set the OTP expiry to less than 1 hour (recommended: 30 minutes)');
    console.log('\n2. Leaked Password Protection:');
    console.log('   - Go to Authentication > Policies');
    console.log('   - Enable "Protect against leaked passwords" option');
    console.log('\n3. Password Strength Requirements:');
    console.log('   - Frontend and backend validation has been implemented');
    console.log('   - Passwords now require minimum 8 characters, uppercase, lowercase,');
    console.log('   - numbers, and special characters');
    console.log('   - Visual password strength indicator added to signup and settings pages');
    console.log('-------------------------------------------------');
    
    console.log('\nSecurity fixes completed. Please perform the manual steps in the Supabase Dashboard.');
    
  } catch (error) {
    console.error('Error fixing security issues:', error);
    process.exit(1);
  }
}

// Run the security fixes
fixSecurityIssues()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error in security fix process:', error);
    process.exit(1);
  });