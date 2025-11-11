import { test, expect } from '@playwright/test';

test('Interactive app testing with proper waits', async ({ page }) => {
  // Capture console for debugging
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });

  console.log('🌐 Navigating to app...');
  await page.goto('http://localhost:5174');

  // Wait for app to initialize
  console.log('⏳ Waiting for app initialization...');
  await page.waitForTimeout(5000);

  // Take initial screenshot
  await page.screenshot({ path: 'test-results/interactive-01-initial.png', fullPage: true });

  // Check if we're past the loading screen by looking for any interactive elements
  const hasInteractiveUI = await page.evaluate(() => {
    // Check for buttons, inputs, or any interactive elements
    const buttons = document.querySelectorAll('button');
    const inputs = document.querySelectorAll('input');
    const clickableElements = document.querySelectorAll('[role="button"], [onclick]');

    console.log(`Found: ${buttons.length} buttons, ${inputs.length} inputs`);
    return buttons.length > 0 || inputs.length > 0 || clickableElements.length > 0;
  });

  console.log(`🎯 Interactive UI detected: ${hasInteractiveUI}`);

  // Get all buttons on page
  const buttons = await page.locator('button').all();
  console.log(`\n🔘 Found ${buttons.length} buttons:`);
  for (const button of buttons) {
    const text = await button.innerText().catch(() => '');
    const ariaLabel = await button.getAttribute('aria-label').catch(() => '');
    console.log(`  - Button: "${text}" ${ariaLabel ? `(${ariaLabel})` : ''}`);
  }

  // Get all inputs on page
  const inputs = await page.locator('input').all();
  console.log(`\n📝 Found ${inputs.length} inputs:`);
  for (const input of inputs) {
    const placeholder = await input.getAttribute('placeholder').catch(() => '');
    const type = await input.getAttribute('type').catch(() => '');
    console.log(`  - Input: type="${type}" placeholder="${placeholder}"`);
  }

  // Try clicking anywhere on the page to dismiss loading
  console.log('\n🖱️  Trying to click on page body...');
  await page.locator('body').click({ position: { x: 100, y: 100 } });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/interactive-02-after-click.png', fullPage: true });

  // Check if we have any divs or main content areas
  const mainContent = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    return allDivs.map(div => ({
      className: div.className,
      id: div.id,
      text: div.innerText?.substring(0, 50)
    })).filter(d => d.text && d.text.length > 0).slice(0, 10);
  });

  console.log('\n📦 Main content areas:');
  console.log(JSON.stringify(mainContent, null, 2));

  // Try pressing Escape to close any modals
  console.log('\n⌨️  Pressing Escape to close potential modals...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/interactive-03-after-escape.png', fullPage: true });

  // Look for specific UI elements
  const uiElements = await page.evaluate(() => {
    return {
      hasLoadingText: document.body.innerText.includes('Loading'),
      hasAddButton: !!document.querySelector('button:has-text("Add"), button:has-text("+")'),
      hasListText: document.body.innerText.toLowerCase().includes('list'),
      hasBucketText: document.body.innerText.toLowerCase().includes('bucket'),
      allVisibleText: document.body.innerText
    };
  });

  console.log('\n🔍 UI Element Detection:');
  console.log(`  Loading text: ${uiElements.hasLoadingText}`);
  console.log(`  Add button: ${uiElements.hasAddButton}`);
  console.log(`  "List" in text: ${uiElements.hasListText}`);
  console.log(`  "Bucket" in text: ${uiElements.hasBucketText}`);
  console.log(`\n📄 All visible text:\n${uiElements.allVisibleText}`);

  // Try to interact with the app by finding any clickable element
  const firstButton = page.locator('button').first();
  if (await firstButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('\n✅ Found first button, clicking...');
    const buttonText = await firstButton.innerText();
    console.log(`   Button text: "${buttonText}"`);
    await firstButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/interactive-04-after-button-click.png', fullPage: true });
  }

  // Final screenshot
  await page.screenshot({ path: 'test-results/interactive-final.png', fullPage: true });
});
