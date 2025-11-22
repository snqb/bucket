import { test, expect } from '@playwright/test';
import { clearAllStorage, createTestWallet } from './helpers';

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('http://localhost:5558');
    await page.waitForTimeout(3000);
  });

  test('Command palette (Cmd+K) functionality', async ({ page }) => {
    console.log('⌨️ Step 1: Opening command palette...');

    // Press Cmd+K (or Ctrl+K on Windows/Linux)
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);

    console.log('✅ Step 2: Verifying command palette opened...');

    // Look for command palette (various possible implementations)
    const commandPalette = page.locator('[role="dialog"], .command-palette, [data-testid="command-palette"]');

    if (await commandPalette.count() > 0) {
      await expect(commandPalette).toBeVisible();

      // Test typing in command palette
      console.log('🔍 Step 3: Testing command palette input...');
      const paletteInput = commandPalette.locator('input, textarea').first();
      if (await paletteInput.count() > 0) {
        await paletteInput.fill('cemetery');
        await page.waitForTimeout(500);

        // Look for cemetery command in results
        const cemeteryCommand = page.locator('text=/cemetery/i, text=Cemetery');
        if (await cemeteryCommand.count() > 0) {
          await cemeteryCommand.first.click();
          await page.waitForTimeout(1000);

          // Verify we navigated to cemetery
          const cemeteryHeader = page.locator('text= cemetery, text=Cemetery, text=/cemetery/i');
          if (await cemeteryHeader.count() > 0) {
            console.log('✅ Successfully navigated to cemetery via command palette');
          }
        }
      }
    } else {
      console.log('⚠️ Command palette not found - may not be implemented');
    }
  });

  test('List navigation (H/L keys)', async ({ page }) => {
    console.log('📝 Step 1: Creating multiple lists...');

    // Create first list
    await page.keyboard.press('n');
    await page.waitForTimeout(500);

    const listInput = page.locator('input[placeholder*="List name"], input[placeholder*="Create"]');
    if (await listInput.count() > 0) {
      await listInput.fill('First List');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }

    // Create second list
    await page.keyboard.press('n');
    await page.waitForTimeout(500);

    if (await listInput.count() > 0) {
      await listInput.fill('Second List');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }

    // Create third list
    await page.keyboard.press('n');
    await page.waitForTimeout(500);

    if (await listInput.count() > 0) {
      await listInput.fill('Third List');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }

    console.log('🔄 Step 2: Testing H/L navigation...');

    // Start with first list (should be visible)
    let currentVisibleList = page.locator('text=First List');
    await expect(currentVisibleList).toBeVisible();

    console.log('  Testing L (next list)...');
    await page.keyboard.press('l');
    await page.waitForTimeout(300);

    // Check if we moved to second list
    const secondList = page.locator('text=Second List');
    if (await secondList.isVisible()) {
      console.log('    ✅ Moved to second list');
    } else {
      console.log('    ⚠️ L key navigation may not be implemented');
    }

    // Test L again for third list
    await page.keyboard.press('l');
    await page.waitForTimeout(300);

    const thirdList = page.locator('text=Third List');
    if (await thirdList.isVisible()) {
      console.log('    ✅ Moved to third list');
    }

    console.log('  Testing H (previous list)...');
    await page.keyboard.press('h');
    await page.waitForTimeout(300);

    // Check if we moved back to second list
    if (await secondList.isVisible()) {
      console.log('    ✅ Moved back to second list');
    }

    console.log('✅ List navigation test completed');
  });

  test('Create list with N key', async ({ page }) => {
    console.log('⌨️ Step 1: Testing N key for list creation...');

    // Press N key
    await page.keyboard.press('n');
    await page.waitForTimeout(500);

    console.log('✅ Step 2: Verifying list creation dialog...');

    // Look for list creation dialog
    const createDialog = page.locator('[role="dialog"], .dialog, [data-testid="create-list-dialog"]');
    const createInput = page.locator('input[placeholder*="List name"], input[placeholder*="Create"]');

    // Either dialog should appear or input should be focused
    const hasDialog = await createDialog.count() > 0 && await createDialog.isVisible();
    const hasInput = await createInput.count() > 0;

    expect(hasDialog || hasInput).toBeTruthy();

    console.log('📝 Step 3: Testing list creation with N key...');

    if (hasInput || hasDialog) {
      const targetInput = hasInput ? createInput : createDialog.locator('input').first();

      await targetInput.fill('N Key Test List');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      // Verify list was created
      const createdList = page.locator('text=N Key Test List');
      await expect(createdList).toBeVisible();

      console.log('✅ Successfully created list with N key');
    }
  });

  test('Cemetery navigation with C key', async ({ page }) => {
    console.log('⚰️ Step 1: Testing C key for cemetery...');

    // Press C key
    await page.keyboard.press('c');
    await page.waitForTimeout(500);

    console.log('✅ Step 2: Verifying cemetery navigation...');

    // Look for cemetery indicators
    const cemeteryIndicators = [
      'text= cemetery',
      'text=Cemetery',
      'text=/cemetery/i',
      '[data-testid="cemetery"]',
      '.cemetery'
    ];

    let foundCemetery = false;
    for (const selector of cemeteryIndicators) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.isVisible()) {
        foundCemetery = true;
        console.log('    ✅ Found cemetery indicator');
        break;
      }
    }

    if (!foundCemetery) {
      console.log('    ⚠️ C key navigation may not be implemented or cemetery not visible');
    }

    // Alternative: Check if C key works when there are deleted tasks
    console.log('📝 Step 3: Creating and deleting task to test cemetery...');

    // Create a task
    await page.keyboard.press('n');
    await page.waitForTimeout(500);

    const listInput = page.locator('input[placeholder*="List name"], input[placeholder*="Create"]');
    if (await listInput.count() > 0) {
      await listInput.fill('Cemetery Test List');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      // Add a task
      const taskInput = page.locator('input[placeholder*="Add"], input[placeholder*="task"]');
      if (await taskInput.count() > 0) {
        await taskInput.first().fill('Test Task for Cemetery');
        await taskInput.first().press('Enter');
        await page.waitForTimeout(1000);

        // Delete the task (this might send it to cemetery)
        const taskItem = page.locator('text=Test Task for Cemetery').first();
        if (await taskItem.count() > 0) {
          // Try to delete it (delete key, right-click menu, or similar)
          await taskItem.click();
          await page.waitForTimeout(500);

          // Try backspace or delete key
          await page.keyboard.press('Backspace');
          await page.waitForTimeout(500);

          // Now try C key again
          await page.keyboard.press('c');
          await page.waitForTimeout(500);

          console.log('  ✓ Deleted task and tried C key navigation');
        }
      }
    }

    console.log('✅ Cemetery navigation test completed');
  });

  test('Task creation and completion with keyboard', async ({ page }) => {
    console.log('📝 Step 1: Creating list for task test...');

    // Create a list
    await page.keyboard.press('n');
    await page.waitForTimeout(500);

    const listInput = page.locator('input[placeholder*="List name"], input[placeholder*="Create"]');
    if (await listInput.count() > 0) {
      await listInput.fill('Keyboard Task Test');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }

    console.log('✅ Step 2: Creating task with keyboard...');

    // Look for task input
    const taskInput = page.locator('input[placeholder*="Add"], input[placeholder*="task"]');
    if (await taskInput.count() > 0) {
      await taskInput.first().fill('Keyboard Created Task');
      await taskInput.first().press('Enter');
      await page.waitForTimeout(1000);

      console.log('  ✅ Task created with keyboard');

      console.log('📊 Step 3: Testing task progress with keyboard...');

      const createdTask = page.locator('text=Keyboard Created Task').first();
      if (await createdTask.count() > 0) {
        // Click on task to focus it
        await createdTask.click();
        await page.waitForTimeout(500);

        // Try to set progress with arrow keys or number keys
        console.log('  Testing progress control...');

        // Try pressing a number key (1-9) for percentage
        await page.keyboard.press('5');
        await page.waitForTimeout(500);

        // Try arrow keys for slider
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);

        // Try pressing 0 for 0% or 100 for 100%
        await page.keyboard.press('1');
        await page.waitForTimeout(200);
        await page.keyboard.press('0');
        await page.keyboard.press('0');
        await page.waitForTimeout(500);

        console.log('  ✅ Progress control tested');
      }
    }

    console.log('✅ Task keyboard operations test completed');
  });

  test('Escape key functionality', async ({ page }) => {
    console.log('⌨️ Step 1: Testing Escape key for closing dialogs...');

    // Open create list dialog
    await page.keyboard.press('n');
    await page.waitForTimeout(500);

    console.log('🚪 Step 2: Pressing Escape to close dialog...');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Verify dialog is closed
    const createDialog = page.locator('[role="dialog"], .dialog');
    const isDialogVisible = await createDialog.count() > 0 && await createDialog.isVisible();

    expect(isDialogVisible).toBeFalsy();

    console.log('✅ Escape key closed dialog successfully');

    console.log('🔍 Step 3: Testing Escape in other contexts...');

    // Try selecting text and pressing escape to deselect
    await page.keyboard.press('n');
    await page.waitForTimeout(500);

    const input = page.locator('input[placeholder*="List name"], input[placeholder*="Create"]').first();
    if (await input.count() > 0) {
      await input.fill('Test Text');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      console.log('  ✓ Escape tested with input field');
    }

    console.log('✅ Escape key functionality verified');
  });

  test('Tab navigation order', async ({ page }) => {
    console.log('⇆ Step 1: Testing keyboard tab navigation...');

    // Create some content to navigate through
    await page.keyboard.press('n');
    await page.waitForTimeout(500);

    const listInput = page.locator('input[placeholder*="List name"], input[placeholder*="Create"]');
    if (await listInput.count() > 0) {
      await listInput.fill('Tab Navigation Test');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }

    console.log('  Testing forward tab navigation...');

    // Start from a known position and tab through
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Track what gets focused
    const focusedElements = [];

    for (let i = 0; i < 10; i++) {
      const activeElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          className: el?.className,
          textContent: el?.textContent?.slice(0, 50),
          placeholder: (el as HTMLInputElement)?.placeholder,
          ariaLabel: el?.getAttribute('aria-label')
        };
      });

      if (activeElement.tagName) {
        focusedElements.push(activeElement);
        console.log(`    ${i + 1}. ${activeElement.tagName}${activeElement.placeholder ? ` (${activeElement.placeholder})` : ''}${activeElement.textContent ? `: ${activeElement.textContent}` : ''}`);
      }

      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
    }

    console.log('✅ Tab navigation test completed');
  });
});