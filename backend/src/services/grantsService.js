const supabase = require('../db/supabaseClient');
const { format } = require('date-fns');
const readline = require('readline');

/**
 * Service for managing grants in the database
 */
class GrantsService {
  /**
   * Store grants in the database with delta updates
   * @param {Array} grants - Array of grant objects to store
   * @returns {Promise<Object>} - Result of the operation
   */
  async storeGrants(grants) {
    try {
      console.log(`Processing ${grants.length} grants for storage...`);
      
      // Track statistics
      const stats = {
        total: grants.length,
        new: 0,
        updated: 0,
        unchanged: 0,
        failed: 0,
        startTime: new Date(),
        endTime: null,
        failedGrants: [], // Track failed grants for reporting
      };
      
      // Process grants in batches to avoid overwhelming the database
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < grants.length; i += batchSize) {
        batches.push(grants.slice(i, i + batchSize));
      }
      
      console.log(`Split grants into ${batches.length} batches of up to ${batchSize} grants each`);
      
      // Set up progress bar
      const progressBar = this.createProgressBar(batches.length);
      
      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        // Update progress bar
        this.updateProgressBar(progressBar, i + 1, batches.length);
        
        // Process each grant in the batch
        const batchResults = await Promise.all(
          batch.map(grant => this.processGrant(grant))
        );
        
        // Update statistics
        batchResults.forEach(result => {
          if (result.status === 'new') stats.new++;
          else if (result.status === 'updated') stats.updated++;
          else if (result.status === 'unchanged') stats.unchanged++;
          else {
            stats.failed++;
            if (result.error) {
              stats.failedGrants.push({
                id: result.id,
                error: result.error
              });
            }
          }
        });
      }
      
      // Complete the progress bar
      this.updateProgressBar(progressBar, batches.length, batches.length);
      console.log(''); // Add a newline after the progress bar
      
      // Log failed grants (limited to first 10)
      if (stats.failedGrants.length > 0) {
        console.log(`Failed to process ${stats.failedGrants.length} grants. First 10 errors:`);
        stats.failedGrants.slice(0, 10).forEach(failedGrant => {
          console.log(`Error processing grant ${failedGrant.id}: ${JSON.stringify(failedGrant.error)}`);
        });
        
        if (stats.failedGrants.length > 10) {
          console.log(`... and ${stats.failedGrants.length - 10} more errors`);
        }
      }
      
      // Record the pipeline run
      stats.endTime = new Date();
      await this.recordPipelineRun(stats);
      
      return stats;
    } catch (error) {
      console.error('Error storing grants:', error);
      
      // Record the failed pipeline run
      await this.recordPipelineRun({
        total: grants.length,
        new: 0,
        updated: 0,
        unchanged: 0,
        failed: grants.length,
        startTime: new Date(),
        endTime: new Date(),
        error: error.message,
      });
      
      throw error;
    }
  }
  
  /**
   * Create a progress bar
   * @param {number} total - Total number of items
   * @returns {Object} - Progress bar object
   */
  createProgressBar(total) {
    const progressBar = {
      total,
      current: 0,
      bar: '',
      percent: 0,
    };
    
    // Initialize the progress bar
    this.updateProgressBar(progressBar, 0, total);
    
    return progressBar;
  }
  
  /**
   * Update the progress bar
   * @param {Object} progressBar - Progress bar object
   * @param {number} current - Current progress
   * @param {number} total - Total items
   */
  updateProgressBar(progressBar, current, total) {
    progressBar.current = current;
    progressBar.percent = Math.floor((current / total) * 100);
    
    const barLength = 30;
    const filledLength = Math.floor((current / total) * barLength);
    const emptyLength = barLength - filledLength;
    
    const filledBar = '='.repeat(filledLength);
    const emptyBar = ' '.repeat(emptyLength);
    progressBar.bar = `[${filledBar}>${emptyBar}]`;
    
    // Clear the current line and write the progress bar
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`Progress: ${progressBar.bar} ${progressBar.percent}% (${current}/${total} batches)`);
  }
  
  /**
   * Process a single grant (insert, update, or skip)
   * @param {Object} grant - Grant object to process
   * @returns {Promise<Object>} - Result of the operation
   */
  async processGrant(grant) {
    try {
      // Check if the grant already exists
      const { data: existingGrant, error: fetchError } = await supabase
        .from('grants')
        .select('id, updated_at, opportunity_id')
        .eq('opportunity_id', grant.opportunity_id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw fetchError;
      }
      
      // If the grant doesn't exist, insert it
      if (!existingGrant) {
        const { error: insertError } = await supabase
          .from('grants')
          .insert(grant);
        
        if (insertError) throw insertError;
        
        return { status: 'new', id: grant.opportunity_id };
      }
      
      // If the grant exists, check if it needs to be updated
      // For simplicity, we're just updating all existing grants
      // In a real implementation, you might want to compare fields to see if anything changed
      const { error: updateError } = await supabase
        .from('grants')
        .update({
          ...grant,
          id: existingGrant.id, // Preserve the original ID
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGrant.id);
      
      if (updateError) throw updateError;
      
      return { status: 'updated', id: existingGrant.id };
    } catch (error) {
      return { status: 'failed', id: grant.opportunity_id, error };
    }
  }
  
  /**
   * Record a pipeline run in the database
   * @param {Object} stats - Statistics about the pipeline run
   * @returns {Promise<void>}
   */
  async recordPipelineRun(stats) {
    try {
      const { error } = await supabase
        .from('pipeline_runs')
        .insert({
          status: stats.failed === stats.total ? 'failed' : 'completed',
          details: {
            total: stats.total,
            new: stats.new,
            updated: stats.updated,
            unchanged: stats.unchanged,
            failed: stats.failed,
            duration_ms: stats.endTime - stats.startTime,
            error: stats.error,
          },
          timestamp: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      console.log('Pipeline run recorded successfully');
    } catch (error) {
      console.error('Error recording pipeline run:', error);
    }
  }
  
  /**
   * Get the latest pipeline run
   * @returns {Promise<Object>} - Latest pipeline run
   */
  async getLatestPipelineRun() {
    try {
      const { data, error } = await supabase
        .from('pipeline_runs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting latest pipeline run:', error);
      return null;
    }
  }
  
  /**
   * Get grants with filtering
   * @param {Object} filters - Filters to apply
   * @returns {Promise<Array>} - Array of grants
   */
  async getGrants(filters = {}) {
    try {
      let query = supabase.from('grants').select('*');
      
      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.agency_name) {
        query = query.eq('agency_name', filters.agency_name);
      }
      
      if (filters.funding_min) {
        query = query.gte('award_ceiling', filters.funding_min);
      }
      
      if (filters.funding_max) {
        query = query.lte('award_floor', filters.funding_max);
      }
      
      if (filters.activity_categories && Array.isArray(filters.activity_categories)) {
        query = query.contains('activity_category', filters.activity_categories);
      }
      
      if (filters.eligible_applicant_types && Array.isArray(filters.eligible_applicant_types)) {
        query = query.contains('eligible_applicants', filters.eligible_applicant_types);
      }
      
      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      
      query = query.range(offset, offset + limit - 1);
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting grants:', error);
      throw error;
    }
  }
}

module.exports = new GrantsService();