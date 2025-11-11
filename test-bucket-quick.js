const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('1. Navigating to http://localhost:5174...');
  await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });
  
  console.log('2. Waiting 3 seconds for app to load...');
  await page.waitForTimeout(3000);
  
  console.log('3. Checking page state...');
  const content = await page.content();
  
  // Check for loading indicator
  const hasLoading = content.includes('loading') || content.includes('Loading');
  
  // Check for app main container
  const hasApp = content.includes('bucket') || content.includes('list') || content.includes('List');
  
  console.log(`   Has loading text: ${hasLoading}`);
  console.log(`   Has app content: ${hasApp}`);
  
  console.log('\n4. Taking initial screenshot...');
  await page.screenshot({ path: 'bucket-screenshot-1.png', fullPage: true });
  console.log('   ✅ Screenshot 1: /Users/sn/Projects/bucket/bucket-screenshot-1.png');
  
  await browser.close();
})();
