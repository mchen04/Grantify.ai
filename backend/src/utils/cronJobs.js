const cron = require('node-cron');
const { downloadGrantsXml } = require('./grantsDownloader');
const { parseGrantsXml } = require('./grantsParser');
const grantsService = require('../services/grantsService');

/**
 * Initialize cron jobs
 */
function initCronJobs() {
  // Schedule the grants update job to run at 5 AM daily
  // Cron format: second(optional) minute hour day-of-month month day-of-week
  cron.schedule('0 5 * * *', async () => {
    console.log('Running grants update job...');
    await updateGrantsData();
  }, {
    scheduled: true,
    timezone: 'America/New_York' // 5 AM EST as specified
  });
  
  console.log('Cron jobs initialized. Grants update scheduled for 5 AM EST daily.');
}

/**
 * Update grants data from Grants.gov
 * @param {boolean} useMock - Whether to use the mock XML file (for testing)
 * @returns {Promise<void>}
 */
async function updateGrantsData(useMock = false) {
  try {
    console.log('Starting grants data update process...');
    
    // Step 1: Download the latest XML extract
    const xmlPath = await downloadGrantsXml(new Date(), true, useMock);
    console.log(`Using XML file at ${xmlPath}`);
    
    // Step 2: Parse the XML data
    const grants = await parseGrantsXml(xmlPath);
    console.log(`Parsed ${grants.length} grants from XML`);
    
    // Step 3: Store the grants in the database
    const result = await grantsService.storeGrants(grants);
    
    // Log the results
    console.log('Grants update completed successfully:');
    console.log(`- Total grants processed: ${result.total}`);
    console.log(`- New grants added: ${result.new}`);
    console.log(`- Existing grants updated: ${result.updated}`);
    console.log(`- Unchanged grants: ${result.unchanged}`);
    console.log(`- Failed grants: ${result.failed}`);
    console.log(`- Duration: ${(result.endTime - result.startTime) / 1000} seconds`);
  } catch (error) {
    console.error('Error updating grants data:', error);
  }
}

/**
 * Run the grants update job manually
 * @param {boolean} useMock - Whether to use the mock XML file (for testing)
 * @returns {Promise<void>}
 */
async function runGrantsUpdateJob(useMock = true) {
  console.log('Manually running grants update job...');
  await updateGrantsData(useMock);
}

module.exports = {
  initCronJobs,
  updateGrantsData,
  runGrantsUpdateJob
};