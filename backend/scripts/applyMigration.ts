/**
 * Script to apply database migrations
 * 
 * Usage: ts-node scripts/applyMigration.ts [--migration=migration_file_name]
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import supabase from '../src/db/supabaseClient';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let migrationFile = 'add_processing_status_and_source.sql'; // Default migration
  
  args.forEach(arg => {
    if (arg.startsWith('--migration=')) {
      migrationFile = arg.split('=')[1];
    }
  });
  
  return { migrationFile };
}

async function applyMigration() {
  try {
    const { migrationFile } = parseArgs();
    const migrationPath = path.join(__dirname, '..', 'src', 'db', 'migrations', migrationFile);
    
    console.log(`Applying migration from: ${migrationPath}`);
    
    // Check if the migration file exists
    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    // Read the migration SQL
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        throw error;
      }
    }
    
    console.log('Migration applied successfully!');
    
    // Record the migration in the database
    const { error } = await supabase
      .from('pipeline_runs')
      .insert({
        status: 'completed',
        details: {
          type: 'migration',
          migration: migrationFile,
          statements: statements.length
        },
        timestamp: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error recording migration:', error);
    }
    
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('Migration process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error in migration process:', error);
    process.exit(1);
  });