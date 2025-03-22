import * as fs from 'fs';
import * as xml2js from 'xml2js';
import { promisify } from 'util';
import { textCleaner } from './textCleaner';

// Helper function to convert date format from MMDDYYYY to ISO format
function convertDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  
  // Extract month, day, and year
  const month = dateStr.substring(0, 2);
  const day = dateStr.substring(2, 4);
  const year = dateStr.substring(4, 8);
  
  // Create ISO date string
  return `${year}-${month}-${day}`;
}

// Helper function to parse funding amounts
function parseFunding(amount?: string): number | null {
  if (!amount) return null;
  
  // Remove any non-numeric characters except decimal point
  const cleanAmount = amount.replace(/[^0-9.]/g, '');
  return cleanAmount ? parseInt(cleanAmount, 10) : null;
}

// Parse eligible applicants
function parseEligibleApplicants(eligibleApplicants?: GrantData['EligibleApplicants']): string[] {
  if (!eligibleApplicants) return [];
  
  if (typeof eligibleApplicants === 'string') {
    return [eligibleApplicants];
  }
  
  if (Array.isArray(eligibleApplicants)) {
    return eligibleApplicants;
  }
  
  if (typeof eligibleApplicants === 'object' && eligibleApplicants.ApplicantType) {
    return Array.isArray(eligibleApplicants.ApplicantType)
      ? eligibleApplicants.ApplicantType
      : [eligibleApplicants.ApplicantType];
  }
  
  return [];
}

// Promisify fs.readFile
const readFile = promisify(fs.readFile);

interface GrantData {
  OpportunityID?: string;
  OpportunityNumber?: string;
  OpportunityTitle?: string;
  OpportunityCategory?: string;
  FundingInstrumentType?: string;
  EligibleApplicants?: string | string[] | { ApplicantType: string | string[] };
  AgencyName?: string;
  AgencyCode?: string;
  PostDate?: string;
  CloseDate?: string;
  EstimatedTotalProgramFunding?: string;
  AwardCeiling?: string;
  AwardFloor?: string;
  CostSharingOrMatchingRequirement?: string;
  Description?: string;
  AdditionalInformationURL?: string;
  GrantorContactName?: string;
  GrantorContactText?: string;
  GrantorContactEmailAddress?: string;
  GrantorContactPhoneNumber?: string;
}

interface ParsedContact {
  name: string;
  email: string;
  phone: string;
}

interface TransformedGrant {
  opportunity_id: string;
  opportunity_number: string;
  title: string;
  category: string;
  funding_type: string;
  activity_category: string[];
  eligible_applicants: string[];
  agency_name: string;
  agency_code: string;
  post_date: string | null;
  close_date: string | null;
  total_funding: number | null;
  award_ceiling: number | null;
  award_floor: number | null;
  cost_sharing: boolean;
  description: string;
  additional_info_url: string;
  grantor_contact_name: string;
  grantor_contact_email: string;
  grantor_contact_phone: string;
  created_at: string;
  updated_at: string;
}

/**
 * Parse contact information from a messy string
 * @param contactText - Raw contact text that may contain name, email, and phone
 * @returns Parsed contact information
 */
function parseContactInfo(contactText: string): ParsedContact {
  if (!contactText) {
    return {
      name: '',
      email: '',
      phone: ''
    };
  }

  // Split by HTML-encoded line breaks and clean up
  const parts = contactText.split('&lt;br/&gt;').map(part => part.trim()).filter(Boolean);
  
  let name = '';
  let email = '';
  let phone = '';

  // Regular expressions for matching
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/;

  // Process each part
  parts.forEach(part => {
    // Check for email
    const emailMatch = part.match(emailRegex);
    if (emailMatch && !email) {
      email = emailMatch[0];
      return;
    }

    // Check for phone number
    const phoneMatch = part.match(phoneRegex);
    if (phoneMatch && !phone) {
      // Standardize phone format
      phone = phoneMatch[0].replace(/[-.\s]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      return;
    }

    // If part doesn't contain email or phone and name is empty, it's likely the name
    if (!name && !emailRegex.test(part) && !phoneRegex.test(part)) {
      // Clean up the name (remove titles, extra spaces, etc)
      name = part.replace(/\.$/, '').trim(); // Remove trailing period
      if (name.toLowerCase().includes('grantor')) {
        name = name.replace(/grantor/i, '').trim();
      }
    }
  });

  return { name, email, phone };
}

/**
 * Parse the grants XML file and convert it to a structured format
 * @param xmlPath - Path to the XML file
 * @param existingGrantIds - Optional array of existing grant IDs to skip text cleaning for
 * @returns Array of grant objects
 */
async function parseGrantsXml(xmlPath: string, existingGrantIds: string[] = []): Promise<TransformedGrant[]> {
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

    // First filter out expired grants using raw dates
    const today = new Date();
    const activeGrants = grantsData.filter(grant => {
      if (!grant.CloseDate) return true;
      const closeDate = new Date(
        grant.CloseDate.substring(4, 8), // year
        parseInt(grant.CloseDate.substring(0, 2)) - 1, // month (0-based)
        grant.CloseDate.substring(2, 4) // day
      );
      return closeDate >= today;
    });

    console.log(`Found ${activeGrants.length} active grants out of ${grantsData.length} total`);

    // Transform and clean only the new active grants
    const transformedGrants = await Promise.all(activeGrants.map(async (grant) => {
      const isExisting = existingGrantIds.includes(grant.OpportunityID || '');
      let cleanedData;

      if (!isExisting) {
        console.log(`Processing new grant: ${grant.OpportunityID}`);
        cleanedData = await textCleaner.processGrantData({
          description: grant.Description || '',
          contactName: grant.GrantorContactName || grant.GrantorContactText || '',
          contactEmail: grant.GrantorContactEmailAddress || '',
          contactPhone: grant.GrantorContactPhoneNumber || ''
        });
      } else {
        console.log(`Skipping text cleaning for existing grant: ${grant.OpportunityID}`);
        cleanedData = {
          description: grant.Description || '',
          contactInfo: {
            name: grant.GrantorContactName || grant.GrantorContactText || '',
            email: grant.GrantorContactEmailAddress || '',
            phone: grant.GrantorContactPhoneNumber || ''
          }
        };
      }

      return {
        opportunity_id: grant.OpportunityID || '',
        opportunity_number: grant.OpportunityNumber || '',
        title: grant.OpportunityTitle || '',
        category: grant.OpportunityCategory || '',
        funding_type: grant.FundingInstrumentType || '',
        activity_category: [],
        eligible_applicants: parseEligibleApplicants(grant.EligibleApplicants),
        agency_name: grant.AgencyName || '',
        agency_code: grant.AgencyCode || '',
        post_date: convertDate(grant.PostDate),
        close_date: convertDate(grant.CloseDate),
        total_funding: parseFunding(grant.EstimatedTotalProgramFunding),
        award_ceiling: parseFunding(grant.AwardCeiling),
        award_floor: parseFunding(grant.AwardFloor),
        cost_sharing: grant.CostSharingOrMatchingRequirement === 'Yes',
        description: cleanedData.description,
        additional_info_url: grant.AdditionalInformationURL || '',
        grantor_contact_name: cleanedData.contactInfo.name || '',
        grantor_contact_email: cleanedData.contactInfo.email || '',
        grantor_contact_phone: cleanedData.contactInfo.phone || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }));

    console.log(`Successfully processed ${transformedGrants.length} active grants`);
    return transformedGrants;
  } catch (error) {
    console.error('Error parsing grants XML:', error);
    throw error;
  }
}

export {
  parseGrantsXml,
  type GrantData,
  type TransformedGrant,
  type ParsedContact
};