import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('1. Navigating to http://localhost:5174...');
  await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });

  console.log('2. Waiting 3 seconds for app to load...');
  await page.waitForTimeout(3000);

  console.log('3. Checking page structure...');

  // Get the text content to see what loaded
  const text = await page.innerText('body');
  const hasLoading = text.toLowerCase().includes('loading');
  const hasContent = text.length > 100;

  console.log(`   Page has content: ${hasContent ? '✅' : '❌'}`);
  console.log(`   Shows loading message: ${hasLoading ? '❌' : '✅'}`);

  console.log('\n4. Taking screenshots...');
  await page.screenshot({ path: 'bucket-screenshot-1.png', fullPage: true });
  console.log('   ✅ Screenshot 1 saved');

  // Try to find buttons to interact with
  const buttons = await page.locator('button').count();
  const inputs = await page.locator('input').count();

  console.log(`\n5. UI Elements found:`);
  console.log(`   Buttons: ${buttons}`);
  console.log(`   Inputs: ${inputs}`);

  if (buttons > 0) {
    // Try to find and click an Add button
    const addButton = page.locator('button').first();
    const buttonText = await addButton.innerText();
    console.log(`   First button: "${buttonText}"`);

    if (buttonText.toLowerCase().includes('add') || buttonText.toLowerCase().includes('new')) {
      console.log('\n6. Clicking Add button...');
      await addButton.click();
      await page.waitForTimeout(500);

      console.log('7. Taking screenshot after click...');
      await page.screenshot({ path: 'bucket-screenshot-2.png', fullPage: true });
      console.log('   ✅ Screenshot 2 saved');
    }
  }

  console.log('\n✅ Test completed successfully');
  await browser.close();
})();
