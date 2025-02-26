const fs = require('fs');
const xml2js = require('xml2js');
const { promisify } = require('util');

// Promisify fs.readFile
const readFile = promisify(fs.readFile);

/**
 * Parse the grants XML file and convert it to a structured format
 * @param {string} xmlPath - Path to the XML file
 * @returns {Promise<Array>} - Array of grant objects
 */
async function parseGrantsXml(xmlPath) {
  try {
    console.log(`Parsing XML file: ${xmlPath}`);
    
    // Read the XML file
    const xmlData = await readFile(xmlPath, 'utf8');
    
    // Parse XML to JSON
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlData);
    
    // Extract grants from the parsed data
    const grantsData = result.Grants.OpportunitySynopsisDetail_1_0;
    
    if (!grantsData || !Array.isArray(grantsData)) {
      throw new Error('Invalid XML format: OpportunitySynopsisDetail_1_0 not found or not an array');
    }
    
    console.log(`Found ${grantsData.length} grants in the XML file`);
    
    // Transform the grants data into our database schema format
    const grants = grantsData
      .map(transformGrantData)
      .filter(filterActiveGrants); // Filter out expired grants
    
    console.log(`After filtering, ${grants.length} active grants remain`);
    
    return grants;
  } catch (error) {
    console.error('Error parsing grants XML:', error);
    throw error;
  }
}

/**
 * Transform the raw grant data from XML into our database schema format
 * @param {Object} grant - Raw grant data from XML
 * @returns {Object} - Transformed grant object
 */
function transformGrantData(grant) {
  // Helper function to convert date format from MMDDYYYY to ISO format
  const convertDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Extract month, day, and year
    const month = dateStr.substring(0, 2);
    const day = dateStr.substring(2, 4);
    const year = dateStr.substring(4, 8);
    
    // Create ISO date string
    return `${year}-${month}-${day}`;
  };
  
  // Helper function to parse funding amounts
  const parseFunding = (amount) => {
    if (!amount) return null;
    
    // Remove any non-numeric characters except decimal point
    const cleanAmount = amount.replace(/[^0-9.]/g, '');
    return cleanAmount ? parseInt(cleanAmount, 10) : null;
  };
  
  // Parse eligible applicants
  const parseEligibleApplicants = (eligibleApplicants) => {
    if (!eligibleApplicants) return [];
    
    if (typeof eligibleApplicants === 'string') {
      return [eligibleApplicants];
    }
    
    if (Array.isArray(eligibleApplicants)) {
      return eligibleApplicants;
    }
    
    if (eligibleApplicants.ApplicantType) {
      return Array.isArray(eligibleApplicants.ApplicantType)
        ? eligibleApplicants.ApplicantType
        : [eligibleApplicants.ApplicantType];
    }
    
    return [];
  };
  
  // Transform the grant data
  return {
    opportunity_id: grant.OpportunityID || '',
    opportunity_number: grant.OpportunityNumber || '',
    title: grant.OpportunityTitle || '',
    category: grant.OpportunityCategory || '',
    funding_type: grant.FundingInstrumentType || '',
    activity_category: [], // Will be filled by AI categorization
    eligible_applicants: parseEligibleApplicants(grant.EligibleApplicants),
    agency_name: grant.AgencyName || '',
    agency_code: grant.AgencyCode || '',
    post_date: convertDate(grant.PostDate),
    close_date: convertDate(grant.CloseDate),
    total_funding: parseFunding(grant.EstimatedTotalProgramFunding),
    award_ceiling: parseFunding(grant.AwardCeiling),
    award_floor: parseFunding(grant.AwardFloor),
    cost_sharing: grant.CostSharingOrMatchingRequirement === 'Yes',
    description: grant.Description || '',
    additional_info_url: grant.AdditionalInformationURL || '',
    grantor_contact_name: grant.GrantorContactName || grant.GrantorContactText || '',
    grantor_contact_email: grant.GrantorContactEmailAddress || '',
    grantor_contact_phone: grant.GrantorContactPhoneNumber || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Filter out grants that have already expired
 * @param {Object} grant - Transformed grant object
 * @returns {boolean} - True if the grant is still active, false if expired
 */
function filterActiveGrants(grant) {
  // If there's no close date, consider it active
  if (!grant.close_date) return true;
  
  // Parse the close date
  const closeDate = new Date(grant.close_date);
  const today = new Date();
  
  // Keep grants that close in the future
  return closeDate >= today;
}

module.exports = {
  parseGrantsXml,
  transformGrantData,
  filterActiveGrants
};