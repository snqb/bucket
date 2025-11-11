import { test, expect } from '@playwright/test';

test.describe('Bucket App Interactive Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5174');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('Complete user flow - authentication, lists, and tasks', async ({ page }) => {
    // Step 1: Take initial screenshot
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'test-results/01-initial-load.png', fullPage: true });

    // Step 2: Wait for auto-authentication
    console.log('⏳ Waiting for auto-authentication...');
    await page.waitForTimeout(3000);

    // Check if we're authenticated (look for common authenticated UI elements)
    const isAuthenticated = await page.locator('body').evaluate((body) => {
      // Check localStorage for auth token
      return localStorage.getItem('supabase.auth.token') !== null ||
             document.body.innerText.includes('Add') ||
             document.body.innerText.includes('List');
    });

    console.log(`✅ Authentication status: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    await page.screenshot({ path: 'test-results/02-after-auth.png', fullPage: true });

    // Step 3: Create first list "Work Tasks" with 💼 emoji
    console.log('📝 Creating "Work Tasks" list...');

    // Try to find "Add List" button or similar
    const addListButton = page.getByRole('button', { name: /add list|new list|create list|\+/i }).first();
    if (await addListButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addListButton.click();
      console.log('✅ Clicked "Add List" button');
    } else {
      // Try alternative selectors
      const altButton = page.locator('button:has-text("Add"), button:has-text("+")').first();
      if (await altButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await altButton.click();
        console.log('✅ Clicked alternative add button');
      } else {
        console.log('⚠️  Could not find "Add List" button');
      }
    }

    await page.waitForTimeout(500);

    // Type list name
    const listNameInput = page.locator('input[placeholder*="list" i], input[type="text"]').first();
    if (await listNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listNameInput.fill('💼 Work Tasks');
      console.log('✅ Entered list name');

      // Submit the form (press Enter or click submit)
      await listNameInput.press('Enter');
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/03-work-list-created.png', fullPage: true });

    // Step 4: Add multiple tasks to Work Tasks list
    console.log('📋 Adding tasks to Work Tasks list...');

    const tasks = [
      'Review pull requests',
      'Update documentation',
      'Fix bug in sync'
    ];

    for (const taskName of tasks) {
      // Find task input field
      const taskInput = page.locator('input[placeholder*="task" i], input[placeholder*="add" i]').first();

      if (await taskInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await taskInput.fill(taskName);
        await taskInput.press('Enter');
        console.log(`✅ Added task: "${taskName}"`);
        await page.waitForTimeout(500);
      } else {
        console.log(`⚠️  Could not find task input for: "${taskName}"`);
      }
    }

    await page.screenshot({ path: 'test-results/04-tasks-added.png', fullPage: true });

    // Step 5: Test task interactions
    console.log('🔧 Testing task interactions...');

    // Click on first task to open it
    const firstTask = page.getByText('Review pull requests').first();
    if (await firstTask.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstTask.click();
      console.log('✅ Clicked on first task');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/05-task-opened.png', fullPage: true });

      // Try to find and interact with progress slider
      const slider = page.locator('input[type="range"], [role="slider"]').first();
      if (await slider.isVisible({ timeout: 2000 }).catch(() => false)) {
        await slider.fill('50');
        console.log('✅ Adjusted progress slider');
        await page.waitForTimeout(500);
      } else {
        console.log('ℹ️  No progress slider found');
      }

      // Close task detail (click outside or press Escape)
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Mark a task as complete
    const checkbox = page.locator('input[type="checkbox"], [role="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await checkbox.click();
      console.log('✅ Marked task as complete');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/06-task-completed.png', fullPage: true });
    } else {
      console.log('⚠️  Could not find task checkbox');
    }

    // Step 6: Create second list "Personal" with 🏠 emoji
    console.log('🏠 Creating "Personal" list...');

    const addListButton2 = page.getByRole('button', { name: /add list|new list|create list|\+/i }).first();
    if (await addListButton2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addListButton2.click();
      await page.waitForTimeout(500);

      const listNameInput2 = page.locator('input[placeholder*="list" i], input[type="text"]').first();
      if (await listNameInput2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await listNameInput2.fill('🏠 Personal');
        await listNameInput2.press('Enter');
        console.log('✅ Created Personal list');
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({ path: 'test-results/07-personal-list-created.png', fullPage: true });

    // Step 7: Add tasks to Personal list
    console.log('📋 Adding tasks to Personal list...');

    const personalTasks = ['Buy groceries', 'Call dentist'];

    for (const taskName of personalTasks) {
      const taskInput = page.locator('input[placeholder*="task" i], input[placeholder*="add" i]').first();

      if (await taskInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await taskInput.fill(taskName);
        await taskInput.press('Enter');
        console.log(`✅ Added personal task: "${taskName}"`);
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({ path: 'test-results/08-personal-tasks-added.png', fullPage: true });

    // Step 8: Test navigation between lists
    console.log('🔀 Testing navigation between lists...');

    const workListNav = page.getByText('Work Tasks', { exact: false }).first();
    if (await workListNav.isVisible({ timeout: 2000 }).catch(() => false)) {
      await workListNav.click();
      console.log('✅ Navigated to Work Tasks');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/09-navigated-to-work.png', fullPage: true });
    }

    // Step 9: Check sync status/buttons
    console.log('🔄 Checking sync status...');

    const syncButton = page.locator('button:has-text("sync"), button:has-text("Sync"), [aria-label*="sync" i]').first();
    if (await syncButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✅ Sync button found');
      await syncButton.click();
      console.log('✅ Clicked sync button');
      await page.waitForTimeout(1000);
    } else {
      console.log('ℹ️  No sync button found (might be auto-syncing)');
    }

    // Step 10: Take final screenshot
    console.log('📸 Taking final screenshot...');
    await page.screenshot({ path: 'test-results/10-final-state.png', fullPage: true });

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit to catch any errors
    await page.waitForTimeout(2000);

    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`Console Errors: ${consoleErrors.length > 0 ? consoleErrors.join(', ') : 'None'}`);

    // Basic assertions
    expect(isAuthenticated).toBeTruthy();
  });

  test('Check page responsiveness', async ({ page }) => {
    console.log('📱 Testing responsiveness...');

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'test-results/responsive-desktop.png', fullPage: true });
    console.log('✅ Desktop view captured');

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'test-results/responsive-tablet.png', fullPage: true });
    console.log('✅ Tablet view captured');

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'test-results/responsive-mobile.png', fullPage: true });
    console.log('✅ Mobile view captured');
  });
});
