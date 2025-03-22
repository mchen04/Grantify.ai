import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { mkdirp } from 'mkdirp';
import { format } from 'date-fns';
import * as cheerio from 'cheerio';
import { IZipEntry, IAdmZip } from '../types/zip';

// Use require for AdmZip since it's a CommonJS module
const AdmZip = require('adm-zip') as (new (filePath?: string | Buffer) => IAdmZip);

// Promisify fs functions
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

interface DownloadOptions {
  date?: Date;
  useV2?: boolean;
  useMock?: boolean;
}

/**
 * Get the latest available XML extract URL from Grants.gov
 * @returns Promise<string> - URL of the latest XML extract
 */
async function getLatestXmlExtractUrl(): Promise<string> {
  try {
    // Fetch the XML extract page
    const response = await axios.get('https://www.grants.gov/xml-extract');
    const $ = cheerio.load(response.data);
    
    // Find all links to ZIP files
    const zipLinks: string[] = [];
    $('a[href$=".zip"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('GrantsDBExtract')) {
        zipLinks.push(href);
      }
    });
    
    if (zipLinks.length === 0) {
      throw new Error('No ZIP files found on the XML extract page');
    }
    
    // Sort by date (assuming the filenames contain dates)
    zipLinks.sort().reverse();
    
    // Return the latest one
    const latestZipUrl = zipLinks[0];
    console.log(`Found latest XML extract: ${latestZipUrl}`);
    
    // If the URL is relative, make it absolute
    if (latestZipUrl.startsWith('/')) {
      return `https://www.grants.gov${latestZipUrl}`;
    }
    
    return latestZipUrl;
  } catch (error) {
    console.error('Error getting latest XML extract URL:', error);
    throw error;
  }
}

/**
 * Downloads the latest grants XML extract from Grants.gov
 * @param options - Download options
 * @returns Promise<string> - Path to the extracted XML file
 */
async function downloadGrantsXml({
  date = new Date(),
  useV2 = true,
  useMock = false
}: DownloadOptions = {}): Promise<string> {
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
    
    try {
      // Get the latest XML extract URL from the Grants.gov website
      const zipUrl = await getLatestXmlExtractUrl();
      console.log(`Downloading grants extract from ${zipUrl}...`);
      
      // Extract the filename from the URL
      const urlFilename = zipUrl.split('/').pop() as string;
      const zipPath = path.join(extractsDir, urlFilename);
      const extractedXmlFilename = urlFilename.replace('.zip', '.xml');
      const extractedXmlPath = path.join(xmlDir, extractedXmlFilename);
      
      // Download the zip file
      const response = await axios({
        method: 'get',
        url: zipUrl,
        responseType: 'arraybuffer',
        timeout: 60000, // 60 second timeout for large files
      });
      
      await writeFile(zipPath, response.data);
      console.log(`Downloaded zip file to ${zipPath}`);
      
      // Try to extract the zip file
      try {
        const zip = new AdmZip(zipPath);
        const zipEntries = zip.getEntries();
        
        // Check if the ZIP contains an XML file
        const xmlEntry = zipEntries.find((entry: IZipEntry) => entry.entryName.endsWith('.xml'));
        if (!xmlEntry) {
          throw new Error('ZIP file does not contain an XML file');
        }
        
        zip.extractAllTo(xmlDir, true);
        console.log(`Extracted XML file to ${xmlDir}`);
        
        // Verify that the XML file was extracted
        if (!(await exists(extractedXmlPath))) {
          throw new Error(`XML file not found after extraction: ${extractedXmlPath}`);
        }
        
        // Return the path to the extracted XML file
        return extractedXmlPath;
      } catch (extractError) {
        console.error('Error extracting ZIP file:', extractError);
        throw extractError;
      }
    } catch (downloadError) {
      console.error('Error downloading or extracting ZIP file:', downloadError);
      
      // If using the mock file as fallback
      if (await exists(path.join(xmlDir, 'GrantsDBExtract20250225v2.xml'))) {
        console.log('Using existing mock XML file as fallback...');
        return path.join(xmlDir, 'GrantsDBExtract20250225v2.xml');
      }
      
      throw downloadError;
    }
  } catch (error) {
    console.error('Error downloading grants XML:', error);
    
    // If all else fails, use the mock XML file if it exists
    const mockXmlPath = path.join(__dirname, '../../data/xml/GrantsDBExtract20250225v2.xml');
    if (await exists(mockXmlPath)) {
      console.log('Using mock XML file as fallback...');
      return mockXmlPath;
    }
    
    throw error;
  }
}

export {
  downloadGrantsXml,
  getLatestXmlExtractUrl,
  type DownloadOptions
};