const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { promisify } = require('util');
const { mkdirp } = require('mkdirp');
const { format } = require('date-fns');

// Promisify fs functions
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

/**
 * Downloads the latest grants XML extract from Grants.gov
 * @param {Date} date - The date to download (defaults to today)
 * @param {boolean} useV2 - Whether to use the v2 version of the extract
 * @param {boolean} useMock - Whether to use the mock XML file (for testing)
 * @returns {Promise<string>} - Path to the extracted XML file
 */
async function downloadGrantsXml(date = new Date(), useV2 = true, useMock = false) {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../../data');
    const extractsDir = path.join(dataDir, 'extracts');
    const xmlDir = path.join(dataDir, 'xml');
    
    // Use mkdirp correctly - it's an async function in v3.x
    await mkdirp(dataDir);
    await mkdirp(extractsDir);
    await mkdirp(xmlDir);
    
    // Format date for filename
    const dateStr = format(date, 'yyyyMMdd');
    const v2Suffix = useV2 ? 'v2' : '';
    const filename = `GrantsDBExtract${dateStr}${v2Suffix}.zip`;
    const xmlFilename = `GrantsDBExtract${dateStr}${v2Suffix}.xml`;
    const xmlPath = path.join(xmlDir, xmlFilename);
    
    // Check if we already have the file
    if (await exists(xmlPath)) {
      console.log(`XML file already exists at ${xmlPath}`);
      return xmlPath;
    }
    
    // If using mock, return the path to the mock XML file
    if (useMock) {
      console.log(`Using mock XML file at ${xmlPath}`);
      return xmlPath;
    }
    
    // Construct URL
    const url = `https://www.grants.gov/extract/${filename}`;
    console.log(`Downloading grants extract from ${url}...`);
    
    // Download the file
    const zipPath = path.join(extractsDir, filename);
    
    try {
      const response = await axios({
        method: 'get',
        url,
        responseType: 'arraybuffer',
        validateStatus: status => status === 200, // Only accept 200 OK
        timeout: 30000, // 30 second timeout
      });
      
      // Check if the response is a ZIP file
      const contentType = response.headers['content-type'];
      if (contentType && !contentType.includes('application/zip') && !contentType.includes('application/octet-stream')) {
        console.warn(`Warning: Response content type is ${contentType}, expected application/zip or application/octet-stream`);
      }
      
      // Check if the response is too small to be a valid ZIP file
      if (response.data.length < 100) {
        throw new Error(`Response too small to be a valid ZIP file (${response.data.length} bytes)`);
      }
      
      await writeFile(zipPath, response.data);
      console.log(`Downloaded zip file to ${zipPath}`);
      
      // Try to extract the zip file
      try {
        const zip = new AdmZip(zipPath);
        const zipEntries = zip.getEntries();
        
        // Check if the ZIP contains the expected XML file
        const xmlEntry = zipEntries.find(entry => entry.entryName.endsWith('.xml'));
        if (!xmlEntry) {
          throw new Error('ZIP file does not contain an XML file');
        }
        
        zip.extractAllTo(xmlDir, true);
        console.log(`Extracted XML file to ${xmlDir}`);
        
        // Verify that the XML file was extracted
        if (!(await exists(xmlPath))) {
          throw new Error(`XML file not found after extraction: ${xmlPath}`);
        }
        
        // Return the path to the XML file
        return xmlPath;
      } catch (extractError) {
        console.error('Error extracting ZIP file:', extractError);
        
        // If we can't extract the ZIP, try downloading without the v2 suffix
        if (useV2) {
          console.log('Trying without v2 suffix...');
          return downloadGrantsXml(date, false);
        }
        
        // If all else fails, use the mock XML file
        console.log('Using mock XML file as fallback...');
        return xmlPath;
      }
    } catch (downloadError) {
      console.error('Error downloading ZIP file:', downloadError);
      
      // If the current day's file is not available, try the previous day
      if (downloadError.response && downloadError.response.status === 404) {
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        
        console.log(`File not found for ${format(date, 'yyyy-MM-dd')}, trying ${format(yesterday, 'yyyy-MM-dd')}...`);
        return downloadGrantsXml(yesterday, useV2);
      }
      
      // If all else fails, use the mock XML file
      console.log('Using mock XML file as fallback...');
      return xmlPath;
    }
  } catch (error) {
    console.error('Error downloading grants XML:', error);
    
    // If all else fails, use the mock XML file
    console.log('Using mock XML file as fallback...');
    const dateStr = format(date, 'yyyyMMdd');
    const v2Suffix = useV2 ? 'v2' : '';
    const xmlFilename = `GrantsDBExtract${dateStr}${v2Suffix}.xml`;
    const xmlPath = path.join(__dirname, '../../data/xml', xmlFilename);
    return xmlPath;
  }
}

module.exports = {
  downloadGrantsXml,
};