import 'dotenv/config';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface CleanedGrantData {
  description: string;
  contactInfo: {
    name: string | null;
    email: string | null;
    phone: string | null;
    nameSource?: 'provided' | 'inferred' | null;
    phoneValid?: boolean;
  };
}

class GeminiTextCleaner {
  private apiKey: string;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 2000; // Minimum 2 seconds between requests (to stay well under the 30 RPM limit)
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessing: boolean = false;
  private requestCount: number = 0;
  // Cache removed to prevent data corruption
  private maxDescriptionLength: number = 5000; // Maximum length for descriptions
  private maxRequestsPerMinute: number = 25; // Set to 25 to stay safely under the 30 RPM limit
  private requestsThisMinute: number = 0;
  private minuteStartTime: number = Date.now();
  private dailyRequestCount: number = 0;
  private dayStartTime: number = Date.now();
  private maxRequestsPerDay: number = 1400; // Set to 1400 to stay safely under the 1,500 RPD limit

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY not found in environment variables. Gemini text cleaning will not work.');
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    while (this.requestQueue.length > 0) {
      // Check and reset rate limit counters
      const now = Date.now();
      
      // Reset minute counter if a minute has passed
      if (now - this.minuteStartTime >= 60000) {
        this.requestsThisMinute = 0;
        this.minuteStartTime = now;
      }
      
      // Reset daily counter if a day has passed
      if (now - this.dayStartTime >= 86400000) { // 24 hours in milliseconds
        this.dailyRequestCount = 0;
        this.dayStartTime = now;
      }

      // If we've hit the daily rate limit, stop processing and log an error
      if (this.dailyRequestCount >= this.maxRequestsPerDay) {
        console.error(`Daily rate limit of ${this.maxRequestsPerDay} requests reached. No more requests will be processed until tomorrow.`);
        this.isProcessing = false;
        return;
      }

      // If we've hit the per-minute rate limit, wait until the next minute
      if (this.requestsThisMinute >= this.maxRequestsPerMinute) {
        const timeToWait = 60000 - (now - this.minuteStartTime);
        console.log(`Rate limit reached. Waiting ${timeToWait}ms before next request...`);
        await this.sleep(timeToWait);
        this.requestsThisMinute = 0;
        this.minuteStartTime = Date.now();
      }

      const request = this.requestQueue.shift();
      if (request) {
        this.requestsThisMinute++;
        this.dailyRequestCount++;
        await request();
        await this.sleep(this.minRequestInterval);
      }
    }
    this.isProcessing = false;
  }

  private async waitForRateLimit(): Promise<void> {
    return new Promise<void>((resolve) => {
      const request = async () => {
        this.lastRequestTime = Date.now();
        resolve();
      };
      this.requestQueue.push(request);
      this.processQueue().catch(console.error);
    });
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 2000
  ): Promise<T> {
    let retries = 0;
    while (true) {
      try {
        return await operation();
      } catch (error) {
        if (retries >= maxRetries) {
          throw error;
        }
        const delay = initialDelay * Math.pow(2, retries);
        console.log(`Request failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
        retries++;
      }
    }
  }

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

  // Cache key method removed to prevent data corruption

  /**
   * Determine if text is a contact name based on content analysis
   * More reliable than just using length
   */
  private isContactNameText(text: string): boolean {
    // Short text is a necessary but not sufficient condition
    if (text.length > 100) return false;
    
    // Check for common contact name patterns
    const hasNamePatterns = /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text) || // First Last format
                           /^(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)/.test(text) || // Title format
                           text.split(' ').length <= 4; // Typically names have few words
    
    // Check if it contains email-like patterns
    const hasEmailPattern = /@/.test(text);
    
    // Check if it contains phone-like patterns
    const hasPhonePattern = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
    
    // Log the detection criteria
    console.log(`Text type detection: length=${text.length}, hasNamePatterns=${hasNamePatterns}, hasEmailPattern=${hasEmailPattern}, hasPhonePattern=${hasPhonePattern}`);
    
    // If it's short and has name/contact patterns, it's likely a contact name
    const result = hasNamePatterns || hasEmailPattern || hasPhonePattern;
    console.log(`Text classified as: ${result ? 'Contact Name' : 'Description'}`);
    
    return result;
  }

  private async cleanWithGemini(text: string): Promise<string> {
    const isContactName = this.isContactNameText(text);
    console.log('\n=== Gemini Text Cleaning ===');
    console.log(`Type: ${isContactName ? 'Contact Name' : 'Description'}`);
    console.log('\nOriginal:');
    console.log(text);

    // Basic cleaning and truncation
    const basicCleaned = this.cleanHtml(text);
    const truncatedText = basicCleaned.length > this.maxDescriptionLength
      ? basicCleaned.slice(0, this.maxDescriptionLength) + '...'
      : basicCleaned;

    // Log that we're processing without cache
    console.log('Processing without cache to prevent data corruption');

    // If no API key, return basic cleaned text
    if (!this.apiKey) {
      console.log('No Gemini API key found. Using basic cleaning only.');
      return truncatedText;
    }

    this.requestCount++;
    const currentRequest = this.requestCount;
    console.log(`[Request ${currentRequest}] Queuing text cleaning request... (Queue size: ${this.requestQueue.length})`);

    // Process single text
    await this.waitForRateLimit();
    console.log(`[Request ${currentRequest}] Processing request after rate limit...`);

    try {
      const makeRequest = async () => {
        console.log(`[Request ${currentRequest}] Making Gemini API request...`);
        
        const systemPrompt = text.length > 100
          ? "You are a professional text cleaner specialized in cleaning funding-related documents. For each input text:\n- Fix formatting issues (e.g., spacing, line breaks, punctuation)\n- Remove HTML artifacts (e.g., &lt;, &gt;, <br>, etc.)\n- Ensure proper capitalization and sentence structure\n- Do not summarize, rewrite, or omit any key information\n- Return cleaned text maintaining exact meaning"
          : "You are a professional contact information cleaner. Based on the input type:\n\nFor names:\n- Return in format: 'name: [cleaned name]'\n- Remove titles (Mr., Mrs., Dr., etc.)\n- Fix capitalization (first letter of each word)\n- Ensure proper spacing\n- Keep core name exactly the same\n\nFor emails:\n- Return in format: 'email: [cleaned email]'\n- Convert to lowercase\n- Remove extra spaces\n- Keep exact email structure\n\nFor phones:\n- Return in format: 'phone: [cleaned phone]'\n- Keep only digits, spaces, and standard separators\n- Format as XXX-XXX-XXXX if possible\n- Preserve international format if present";

        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: systemPrompt },
                  { text: truncatedText }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 2048 // Reduced to be more conservative with the free tier
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Gemini API error (${response.status}): ${errorData}`);
        }

        const data = await response.json() as GeminiResponse;
        
        if (!data.candidates || data.candidates.length === 0 || 
            !data.candidates[0].content || !data.candidates[0].content.parts || 
            data.candidates[0].content.parts.length === 0) {
          throw new Error('Invalid response format from Gemini API');
        }
        
        const cleanedText = data.candidates[0].content.parts[0].text || truncatedText;
        // Cache storage removed to prevent data corruption

        console.log('\nCleaned:');
        console.log(cleanedText);
        console.log('===============================\n');

        return cleanedText;
      };

      const result = await this.retryWithBackoff(makeRequest);
      console.log(`[Request ${currentRequest}] Successfully processed text`);
      return result;
    } catch (error) {
      console.error(`[Request ${currentRequest}] Error using Gemini to clean text:`, error);
      if (error instanceof Error) {
        console.error(`[Request ${currentRequest}] Error details:`, error.message);
        console.error(`[Request ${currentRequest}] Error stack:`, error.stack);
      }
      // Fall back to basic cleaning
      console.log(`[Request ${currentRequest}] Using basic HTML cleaning`);
      return truncatedText;
    }
  }

  /**
   * Standardize phone number format
   * Returns null if the phone number is invalid
   */
  private standardizePhone(phone: string, source: 'given' | 'assumed' = 'given'): { number: string; status: string } {
    // Extract digits only
    const digits = phone.replace(/\D/g, '');
    
    // US format (10 digits)
    if (digits.length === 10) {
      return {
        number: `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`,
        status: `${source}-valid`
      };
    }
    // US with country code (11 digits starting with 1)
    else if (digits.length === 11 && digits[0] === '1') {
      return {
        number: `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`,
        status: `${source}-valid`
      };
    }
    // International format handling (preserve original format but mark as valid)
    else if (digits.length >= 8 && digits.length <= 15) {
      // Most international numbers are between 8 and 15 digits
      // Format with country code if possible
      console.log(`International phone number detected: ${phone} (${digits.length} digits)`);
      
      if (phone.startsWith('+')) {
        console.log(`Preserving international format with country code: ${phone}`);
        return {
          number: phone, // Keep original international format
          status: `${source}-valid-international`
        };
      } else {
        // Try to add + if it's missing
        const formattedNumber = phone.startsWith('00') ? '+' + phone.substring(2) : '+' + phone;
        console.log(`Reformatting international number to: ${formattedNumber}`);
        return {
          number: formattedNumber,
          status: `${source}-valid-international`
        };
      }
    }
    
    // If we can't determine a valid format, keep original but mark as invalid
    return {
      number: phone, // Keep original format
      status: `${source}-invalid`
    };
  }

  /**
   * Extract name from email if name is not provided
   */
  private inferNameFromEmail(email: string): string {
    if (!email) return '';
    
    // Get the part before @ and replace underscores/dots with spaces
    const namePart = email.split('@')[0].replace(/[._]/g, ' ');
    
    // Capitalize each word and mark as inferred
    return namePart
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Clean and process grant data
   */
  async processGrantData(data: {
    description: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<CleanedGrantData> {
    console.log('\n=== Processing Grant Data with Gemini ===');
    
    // Clean description using Gemini
    console.log('\nDescription:');
    console.log('Original:', data.description);
    const cleanedDescription = await this.cleanWithGemini(data.description);
    console.log('Cleaned:', cleanedDescription);

    // Process contact information with Gemini
    let name = null;
    let email = null;
    let phone = null;
    let nameSource: 'provided' | 'inferred' | null = null;
    let phoneValid = false;

    if (data.contactName) {
      console.log('\n=== Contact Information Processing ===');
      console.log('Raw Input:', data.contactName);

      try {
        // Use Gemini to clean and format contact information
        await this.waitForRateLimit();
        
        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: "You are a contact information parser. Extract and format contact details from the input text. Return in this exact format:\nname: [extracted name] (provided) or name: [inferred name] (assumed)\nemail: [extracted email] (provided) or email: not provided\nphone: [XXX-XXX-XXXX] (given-valid) or phone: [number] (given-invalid) or phone: [inferred number] (assumed-valid) or phone: [inferred number] (assumed-invalid) or phone: not provided\n\nRules:\n- Remove titles (Mr., Mrs., etc)\n- Fix capitalization\n- Clean HTML artifacts\n- If no name found but email exists, infer name from email and mark as (assumed)\n- Format phone as XXX-XXX-XXXX when possible\n- For phone numbers:\n  * Mark as 'given' if explicitly provided in input\n  * Mark as 'assumed' if extracted from other text\n  * Add '-valid' if matches XXX-XXX-XXXX format\n  * Add '-invalid' if in any other format\n- Keep phone numbers as strings even if they're all digits"
                  },
                  { text: data.contactName }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 512 // Reduced to be more conservative with the free tier
            }
          })
        });

        if (response.ok) {
          const result = await response.json() as GeminiResponse;
          
          if (result.candidates && result.candidates.length > 0 && 
              result.candidates[0].content && result.candidates[0].content.parts && 
              result.candidates[0].content.parts.length > 0) {
            
            const parsed = result.candidates[0].content.parts[0].text;
            console.log('\nGemini Cleaned Output:', parsed);

            // Extract the formatted fields for database storage
            const nameMatch = parsed.match(/name:\s*(.+)(?:\n|$)/);
            const emailMatch = parsed.match(/email:\s*(.+)(?:\n|$)/);
            const phoneMatch = parsed.match(/phone:\s*(.+)(?:\n|$)/);

            name = nameMatch ? nameMatch[1].trim() : null;
            email = emailMatch ? emailMatch[1].trim() : null;
            phone = phoneMatch ? phoneMatch[1].trim() : null;

            // Set name source
            if (name && name !== 'not provided') {
              nameSource = parsed.toLowerCase().includes('inferred from email') ? 'inferred' : 'provided';
            }

            // Validate phone if present
            if (phone && phone !== 'not provided') {
              const phoneResult = this.standardizePhone(phone, parsed.toLowerCase().includes('assumed') ? 'assumed' : 'given');
              phone = phoneResult.number;
              phoneValid = phoneResult.status.includes('-valid');
            }
          }
        }
      } catch (error) {
        console.error('Error processing contact information with Gemini:', error);
        
        // Fallback to basic extraction
        name = this.cleanHtml(data.contactName);
        email = data.contactEmail || this.extractEmail(data.contactName);
        phone = data.contactPhone || this.extractPhone(data.contactName);
      }
    }

    // Log what will be stored in the database
    if (data.contactName) {
      console.log('\nDatabase Storage Values:');
      console.log('name:', name || 'not provided');
      console.log('email:', email || 'not provided');
      console.log('phone:', phone || 'not provided');
      console.log('\n(These values will be stored in the database)');
    }
    console.log('\n===============================\n');

    return {
      description: cleanedDescription,
      contactInfo: {
        name,
        email,
        phone,
        nameSource,
        phoneValid
      }
    };
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
    
    // Format as XXX-XXX-XXXX if possible
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return match[0]; // Return original format if can't standardize
  }
}

export const geminiTextCleaner = new GeminiTextCleaner();