/**
 * Script to analyze grant data in the database
 * This helps us understand what filters would be most useful
 * 
 * Usage: node scripts/analyzeGrantData.js
 */

// Load environment variables
require('dotenv').config();

const supabase = require('../src/db/supabaseClient');

async function analyzeGrantData() {
  try {
    console.log('Starting grant data analysis...');
    
    // Get total count of grants
    const { count: totalCount, error: countError } = await supabase
      .from('grants')
      .select('*', { count: 'exact' });
    
    if (countError) {
      console.error('Error counting grants:', countError);
      return;
    }
    
    console.log(`Total grants in database: ${totalCount}`);
    
    // Get count of grants with null close_date
    const { count: nullCloseDateCount, error: nullCloseDateError } = await supabase
      .from('grants')
      .select('*', { count: 'exact' })
      .is('close_date', null);
    
    if (nullCloseDateError) {
      console.error('Error counting grants with null close_date:', nullCloseDateError);
    } else {
      console.log(`Grants with no deadline (null close_date): ${nullCloseDateCount} (${Math.round(nullCloseDateCount / totalCount * 100)}%)`);
    }
    
    // Get most common agencies (top 10)
    const { data: topAgencies, error: agencyError } = await supabase
      .from('grants')
      .select('agency_name')
      .not('agency_name', 'is', null)
      .then(result => {
        if (result.error) throw result.error;
        
        // Count occurrences of each agency
        const agencyCounts = {};
        result.data.forEach(grant => {
          const agency = grant.agency_name;
          agencyCounts[agency] = (agencyCounts[agency] || 0) + 1;
        });
        
        // Convert to array and sort
        return {
          data: Object.entries(agencyCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          error: null
        };
      });
    
    if (agencyError) {
      console.error('Error analyzing agencies:', agencyError);
    } else {
      console.log('\nTop 10 Agencies:');
      topAgencies.forEach((agency, index) => {
        console.log(`${index + 1}. ${agency.name} (${agency.count} grants, ${Math.round(agency.count / totalCount * 100)}%)`);
      });
    }
    
    // Get most common categories from the category field
    const { data: topCategories, error: categoryError } = await supabase
      .from('grants')
      .select('category')
      .not('category', 'is', null)
      .then(result => {
        if (result.error) throw result.error;
        
        // Count occurrences of each category
        const categoryCounts = {};
        result.data.forEach(grant => {
          const category = grant.category;
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
        
        // Convert to array and sort
        return {
          data: Object.entries(categoryCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          error: null
        };
      });
    
    if (categoryError) {
      console.error('Error analyzing categories:', categoryError);
    } else {
      console.log('\nTop 10 Categories:');
      topCategories.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name} (${category.count} grants, ${Math.round(category.count / totalCount * 100)}%)`);
      });
    }
    
    // Get most common funding types
    const { data: topFundingTypes, error: fundingTypeError } = await supabase
      .from('grants')
      .select('funding_type')
      .not('funding_type', 'is', null)
      .then(result => {
        if (result.error) throw result.error;
        
        // Count occurrences of each funding type
        const fundingTypeCounts = {};
        result.data.forEach(grant => {
          const fundingType = grant.funding_type;
          fundingTypeCounts[fundingType] = (fundingTypeCounts[fundingType] || 0) + 1;
        });
        
        // Convert to array and sort
        return {
          data: Object.entries(fundingTypeCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count),
          error: null
        };
      });
    
    if (fundingTypeError) {
      console.error('Error analyzing funding types:', fundingTypeError);
    } else {
      console.log('\nFunding Types:');
      topFundingTypes.forEach((type, index) => {
        console.log(`${index + 1}. ${type.name} (${type.count} grants, ${Math.round(type.count / totalCount * 100)}%)`);
      });
    }
    
    // Analyze funding amounts
    const { data: fundingStats, error: fundingError } = await supabase
      .from('grants')
      .select('award_ceiling')
      .not('award_ceiling', 'is', null)
      .then(result => {
        if (result.error) throw result.error;
        
        const amounts = result.data.map(grant => grant.award_ceiling).filter(Boolean).sort((a, b) => a - b);
        
        if (amounts.length === 0) {
          return { data: null, error: new Error('No funding amounts found') };
        }
        
        // Calculate statistics
        const min = amounts[0];
        const max = amounts[amounts.length - 1];
        const median = amounts[Math.floor(amounts.length / 2)];
        
        // Count grants in different funding ranges
        const ranges = [
          { name: 'Under $10,000', min: 0, max: 10000, count: 0 },
          { name: '$10,000 - $50,000', min: 10000, max: 50000, count: 0 },
          { name: '$50,000 - $100,000', min: 50000, max: 100000, count: 0 },
          { name: '$100,000 - $500,000', min: 100000, max: 500000, count: 0 },
          { name: '$500,000 - $1,000,000', min: 500000, max: 1000000, count: 0 },
          { name: '$1,000,000 - $5,000,000', min: 1000000, max: 5000000, count: 0 },
          { name: 'Over $5,000,000', min: 5000000, max: Infinity, count: 0 }
        ];
        
        amounts.forEach(amount => {
          for (const range of ranges) {
            if (amount >= range.min && amount < range.max) {
              range.count++;
              break;
            }
          }
        });
        
        return {
          data: {
            min,
            max,
            median,
            count: amounts.length,
            ranges: ranges.map(range => ({
              ...range,
              percentage: Math.round(range.count / amounts.length * 100)
            }))
          },
          error: null
        };
      });
    
    if (fundingError) {
      console.error('Error analyzing funding amounts:', fundingError);
    } else if (fundingStats) {
      console.log('\nFunding Amount Statistics:');
      console.log(`Grants with funding amount: ${fundingStats.count} (${Math.round(fundingStats.count / totalCount * 100)}%)`);
      console.log(`Min: $${fundingStats.min.toLocaleString()}`);
      console.log(`Max: $${fundingStats.max.toLocaleString()}`);
      console.log(`Median: $${fundingStats.median.toLocaleString()}`);
      
      console.log('\nFunding Amount Ranges:');
      fundingStats.ranges.forEach(range => {
        console.log(`${range.name}: ${range.count} grants (${range.percentage}%)`);
      });
    }
    
    // Analyze eligible applicants
    const { data: eligibilityData, error: eligibilityError } = await supabase
      .from('grants')
      .select('eligible_applicants')
      .not('eligible_applicants', 'is', null)
      .then(result => {
        if (result.error) throw result.error;
        
        // Count occurrences of each applicant type
        const applicantCounts = {};
        result.data.forEach(grant => {
          if (Array.isArray(grant.eligible_applicants)) {
            grant.eligible_applicants.forEach(type => {
              applicantCounts[type] = (applicantCounts[type] || 0) + 1;
            });
          }
        });
        
        // Convert to array and sort
        return {
          data: Object.entries(applicantCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15),
          error: null
        };
      });
    
    if (eligibilityError) {
      console.error('Error analyzing eligible applicants:', eligibilityError);
    } else {
      console.log('\nTop 15 Eligible Applicant Types:');
      eligibilityData.forEach((type, index) => {
        console.log(`${index + 1}. ${type.name} (${type.count} grants)`);
      });
    }
    
    console.log('\nGrant data analysis completed');
  } catch (error) {
    console.error('Error during grant data analysis:', error);
  }
}

// Run the analysis
analyzeGrantData()
  .then(() => {
    console.log('Analysis script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Analysis script failed:', error);
    process.exit(1);
  });