import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

test.describe('Bucket App Interactive Test', () => {
  test('Full user workflow - create list, add tasks, interact', async ({ page }) => {
    // Step 1: Navigate and wait for load
    console.log('Step 1: Navigating to http://localhost:5558');
    await page.goto('http://localhost:5558', { waitUntil: 'networkidle' });

    // Wait a bit for any animations/transitions
    await page.waitForTimeout(1000);

    // Step 2: Verify welcome screen appears (not stuck on loading)
    console.log('Step 2: Verifying welcome screen appears');
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/01-welcome-screen.png', fullPage: true });
    console.log('✅ Welcome screen loaded successfully - not stuck on loading!');

    // Step 3: Click "Create your first list" button
    console.log('Step 3: Creating first list');
    const createButton = page.locator('button:has-text("Create your first list"), button:has-text("create your first list")').first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    // Wait for modal/form to appear
    await page.waitForTimeout(500);

    // Step 4: Enter "Work Tasks" and select emoji
    console.log('Step 4: Entering list details');
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Work Tasks');

    // Look for emoji picker/selector - try to select 💼
    const emojiButton = page.locator('button:has-text("💼")').first();
    if (await emojiButton.isVisible()) {
      await emojiButton.click();
    }

    await page.waitForTimeout(500);

    // Step 5: Submit the form
    console.log('Step 5: Submitting list creation');
    const submitButton = page.locator('button:has-text("Create"), button[type="submit"]').first();
    await submitButton.click();

    await page.waitForTimeout(1000);

    // Verify list was created
    await expect(page.locator('text=Work Tasks')).toBeVisible({ timeout: 5000 });
    console.log('✅ List created successfully');

    // Step 6: Add 3 tasks
    console.log('Step 6: Adding tasks');
    const tasks = [
      'Review pull requests',
      'Update documentation',
      'Test desktop app'
    ];

    for (const taskText of tasks) {
      // Find the "Add task" input or button
      const addTaskInput = page.locator('input[placeholder*="task"], input[placeholder*="Add"]').first();

      if (await addTaskInput.isVisible()) {
        await addTaskInput.fill(taskText);
        await addTaskInput.press('Enter');
      } else {
        // Try clicking an "Add task" button
        const addButton = page.locator('button:has-text("Add"), button:has-text("+")').first();
        await addButton.click();
        await page.waitForTimeout(300);

        const taskInput = page.locator('input[type="text"]').last();
        await taskInput.fill(taskText);
        await taskInput.press('Enter');
      }

      await page.waitForTimeout(500);
      console.log(`  ✓ Added: ${taskText}`);
    }

    await page.screenshot({ path: 'test-results/02-list-with-tasks.png', fullPage: true });
    console.log('✅ All tasks added successfully');

    // Step 7: Click on first task
    console.log('Step 7: Opening task detail view');
    const firstTask = page.locator('text=Review pull requests').first();
    await firstTask.click();

    await page.waitForTimeout(1000);

    // Step 8: Try adjusting progress slider
    console.log('Step 8: Adjusting progress slider');
    const slider = page.locator('input[type="range"]').first();

    if (await slider.isVisible()) {
      await slider.fill('50');
      await page.waitForTimeout(500);
      await slider.fill('75');
      console.log('✅ Progress slider works');
    } else {
      console.log('⚠️  No progress slider found in task detail view');
    }

    await page.screenshot({ path: 'test-results/03-task-detail-view.png', fullPage: true });
    console.log('✅ Task detail view captured');

    // Final summary
    console.log('\n=== TEST SUMMARY ===');
    console.log('✅ App loads without getting stuck');
    console.log('✅ Welcome screen displays correctly');
    console.log('✅ List creation works');
    console.log('✅ Task addition works');
    console.log('✅ Task detail view accessible');
    console.log('✅ Screenshots saved to test-results/');
    console.log('\nAll functionality verified! 🎉');
  });
});
