interface CleanedGrantData {
  description: string;
  contactInfo: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

class BasicTextCleaner {
  /**
   * Clean HTML and special characters from text
   */
  private cleanHtml(text: string): string {
    return text
      // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Replace question marks from encoding issues
      .replace(/\?/g, "'")
      // Remove HTML tags
      .replace(/<[^>]*>/g, ' ')
      // Fix multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract email from text
   */
  private extractEmail(text: string): string | null {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailRegex);
    return match ? match[0].toLowerCase() : null;
  }

  /**
   * Extract and format phone number
   */
  private extractPhone(text: string): string | null {
    const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/;
    const match = text.match(phoneRegex);
    if (!match) return null;

    // Extract digits only
    const digits = match[0].replace(/\D/g, '');
    
    // Extract any text in parentheses
    let additionalInfo = '';
    const parenthesesMatch = text.match(/\(([^)]+)\)/);
    if (parenthesesMatch) {
      additionalInfo = ` (${parenthesesMatch[1]})`;
    }
    
    // Format as XXX-XXX-XXXX if possible
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}${additionalInfo}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}${additionalInfo}`;
    }
    
    // Handle international numbers
    if (digits.length >= 8 && digits.length <= 15) {
      // Add country info for international numbers
      let countryInfo = '';
      if (!additionalInfo) {
        if (digits.length === 12 && digits.startsWith('44')) {
          countryInfo = ' (UK)';
        } else if (digits.length === 12 && digits.startsWith('33')) {
          countryInfo = ' (France)';
        } else if (digits.length === 13 && digits.startsWith('49')) {
          countryInfo = ' (Germany)';
        } else if (digits.length === 12 && digits.startsWith('61')) {
          countryInfo = ' (Australia)';
        } else if (digits.length === 11 && digits.startsWith('86')) {
          countryInfo = ' (China)';
        } else if (digits.length === 12 && digits.startsWith('91')) {
          countryInfo = ' (India)';
        } else if (digits.length >= 10 && digits.length <= 12) {
          countryInfo = ' (International)';
        }
      }
      
      // Format international number with + if needed
      if (match[0].startsWith('+')) {
        return `${match[0]}${additionalInfo || countryInfo}`;
      } else if (digits.length > 10) {
        return `+${digits}${additionalInfo || countryInfo}`;
      }
    }
    
    return `${match[0]}${additionalInfo}`; // Return original format with any additional info
  }

  /**
   * Clean and format contact name
   */
  private cleanName(name: string): string {
    return name
      .replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+/i, '') // Remove titles
      .replace(/\s+/g, ' ') // Fix spacing
      .trim();
  }

  /**
   * Process grant data without AI
   */
  async processGrantData(data: {
    description: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<CleanedGrantData> {
    // Clean description
    const cleanedDescription = this.cleanHtml(data.description);

    // Process contact information
    let name = null;
    let email = null;
    let phone = null;

    if (data.contactName) {
      name = this.cleanName(this.cleanHtml(data.contactName));
    }

    // Try to get email from either direct field or contact text
    email = data.contactEmail ? 
      this.extractEmail(data.contactEmail) :
      data.contactName ? 
        this.extractEmail(data.contactName) :
        null;

    // Try to get phone from either direct field or contact text
    phone = data.contactPhone ?
      this.extractPhone(data.contactPhone) :
      data.contactName ?
        this.extractPhone(data.contactName) :
        null;

    return {
      description: cleanedDescription,
      contactInfo: {
        name,
        email,
        phone
      }
    };
  }
}

export const basicTextCleaner = new BasicTextCleaner();