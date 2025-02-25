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
    const grants = grantsData.map(transformGrantData);
    
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
  
  // Helper function to convert eligible applicants to array
  const parseEligibleApplicants = (codes) => {
    if (!codes) return [];
    
    // Split by comma if it's a string with multiple codes
    const codeArray = typeof codes === 'string' ? codes.split(',').map(c => c.trim()) : [codes];
    
    // Map codes to descriptions
    const eligibilityMap = {
      '99': 'Unrestricted',
      '00': 'State governments',
      '01': 'County governments',
      '02': 'City or township governments',
      '04': 'Special district governments',
      '05': 'Independent school districts',
      '06': 'Public and State controlled institutions of higher education',
      '07': 'Native American tribal governments (Federally recognized)',
      '08': 'Public housing authorities/Indian housing authorities',
      '11': 'Native American tribal organizations (other than Federally recognized tribal governments)',
      '12': 'Nonprofits having a 501(c)(3) status with the IRS, other than institutions of higher education',
      '13': 'Nonprofits that do not have a 501(c)(3) status with the IRS, other than institutions of higher education',
      '20': 'Private institutions of higher education',
      '21': 'Individuals',
      '22': 'For-profit organizations other than small businesses',
      '23': 'Small businesses',
      '25': 'Others'
    };
    
    return codeArray.map(code => eligibilityMap[code] || code);
  };
  
  // Helper function to determine activity categories
  const determineActivityCategories = (categoryCode, explanation) => {
    const categories = [];
    
    // Add the main category
    const categoryMap = {
      'ACA': 'Affordable Care Act',
      'AG': 'Agriculture',
      'AR': 'Arts',
      'BC': 'Business and Commerce',
      'CD': 'Community Development',
      'CP': 'Consumer Protection',
      'DPR': 'Disaster Prevention and Relief',
      'ED': 'Education',
      'ELT': 'Employment, Labor and Training',
      'EN': 'Energy',
      'ENV': 'Environment',
      'FN': 'Food and Nutrition',
      'HL': 'Health',
      'HO': 'Housing',
      'HU': 'Humanities',
      'ISS': 'Income Security and Social Services',
      'IS': 'Information and Statistics',
      'LJL': 'Law, Justice and Legal Services',
      'NR': 'Natural Resources',
      'RA': 'Recovery Act',
      'RD': 'Regional Development',
      'ST': 'Science and Technology',
      'T': 'Transportation',
      'O': 'Other'
    };
    
    if (categoryCode && categoryMap[categoryCode]) {
      categories.push(categoryMap[categoryCode]);
    }
    
    // Extract additional categories from the explanation if available
    if (explanation) {
      // This is a simple approach - in a real implementation, you might use NLP or AI
      // to extract more meaningful categories from the explanation
      const keywords = [
        'Research', 'Development', 'Innovation', 'Technology', 'Healthcare',
        'Education', 'Training', 'Infrastructure', 'Climate', 'Energy',
        'Sustainability', 'Community', 'Rural', 'Urban', 'Minority',
        'Small Business', 'Entrepreneurship', 'International', 'Security'
      ];
      
      keywords.forEach(keyword => {
        if (explanation.includes(keyword) && !categories.includes(keyword)) {
          categories.push(keyword);
        }
      });
    }
    
    return categories;
  };
  
  // Transform the grant data
  return {
    opportunity_id: grant.OpportunityID || '',
    opportunity_number: grant.OpportunityNumber || '',
    title: grant.OpportunityTitle || '',
    category: grant.OpportunityCategory || '',
    funding_type: grant.FundingInstrumentType || '',
    activity_category: determineActivityCategories(
      grant.CategoryOfFundingActivity,
      grant.CategoryExplanation
    ),
    eligible_applicants: parseEligibleApplicants(grant.EligibleApplicants),
    agency_name: grant.AgencyName || '',
    post_date: convertDate(grant.PostDate),
    close_date: convertDate(grant.CloseDate),
    total_funding: parseFunding(grant.EstimatedTotalProgramFunding),
    award_ceiling: parseFunding(grant.AwardCeiling),
    award_floor: parseFunding(grant.AwardFloor),
    cost_sharing: grant.CostSharingOrMatchingRequirement === 'Yes',
    description: grant.Description || '',
    additional_info_url: grant.AdditionalInformationURL || '',
    grantor_contact_name: grant.GrantorContactName || grant.GrantorContactText || '',
    grantor_contact_email: grant.GrantorContactEmail || '',
    grantor_contact_phone: grant.GrantorContactPhoneNumber || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

module.exports = {
  parseGrantsXml,
  transformGrantData
};