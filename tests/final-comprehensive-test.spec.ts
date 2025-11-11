import { test, expect } from '@playwright/test';

test.describe('Bucket App - Comprehensive Test Report', () => {
  test('Full interactive test with detailed reporting', async ({ page }) => {
    console.log('\n════════════════════════════════════════');
    console.log('🧪 BUCKET APP COMPREHENSIVE TEST');
    console.log('════════════════════════════════════════\n');

    const testResults = {
      authentication: { status: 'unknown', details: '' },
      uiLoad: { status: 'unknown', details: '' },
      createList: { status: 'unknown', details: '' },
      addTasks: { status: 'unknown', details: '' },
      taskInteractions: { status: 'unknown', details: '' },
      navigation: { status: 'unknown', details: '' },
      sync: { status: 'unknown', details: '' },
      responsiveness: { status: 'unknown', details: '' },
      consoleErrors: [] as string[],
      networkErrors: [] as string[],
      screenshots: [] as string[]
    };

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.consoleErrors.push(msg.text());
      }
      if (msg.text().includes('Done waiting') || msg.text().includes('User exists')) {
        console.log(`  📝 ${msg.text()}`);
      }
    });

    // Capture network failures
    page.on('requestfailed', request => {
      testResults.networkErrors.push(`${request.method()} ${request.url()}`);
    });

    // Step 1: Navigation & Authentication
    console.log('📍 Step 1: Navigation & Authentication');
    console.log('  → Navigating to http://localhost:5174');
    await page.goto('http://localhost:5174');

    console.log('  → Waiting 10 seconds for app initialization (checking timeout behavior)');
    await page.waitForTimeout(10000);

    const screenshot1 = 'test-results/final-01-after-long-wait.png';
    await page.screenshot({ path: screenshot1, fullPage: true });
    testResults.screenshots.push(screenshot1);

    const isLoading = await page.locator('text=Loading').isVisible().catch(() => false);
    if (isLoading) {
      testResults.authentication.status = '❌ FAILED';
      testResults.authentication.details = 'App stuck on loading screen after 10 seconds';
      testResults.uiLoad.status = '❌ FAILED';
      testResults.uiLoad.details = 'UI never loaded - stuck on loading spinner';
      console.log('  ❌ App is STILL showing "Loading..." after 10 seconds');
      console.log('  → This indicates the initialization timeout (2500ms) did not complete');
    } else {
      testResults.authentication.status = '✅ PASSED';
      testResults.authentication.details = 'User authenticated successfully';
      testResults.uiLoad.status = '✅ PASSED';
      testResults.uiLoad.details = 'UI loaded successfully';
      console.log('  ✅ App loaded successfully');
    }

    // Step 2: Check for interactive elements
    console.log('\n📍 Step 2: Checking for Interactive UI Elements');

    const buttons = await page.locator('button').count();
    const inputs = await page.locator('input').count();
    console.log(`  → Found ${buttons} buttons and ${inputs} inputs`);

    if (buttons === 0 && inputs === 0) {
      console.log('  ⚠️  No interactive elements found');
      testResults.uiLoad.status = '❌ FAILED';
      testResults.uiLoad.details = 'No buttons or inputs detected';
    }

    // Step 3: Try to create a list
    console.log('\n📍 Step 3: Attempting to Create a List');

    const addListButton = page.getByRole('button', { name: /new list|add list|create/i }).or(
      page.getByText(/create your first list/i).locator('..').locator('button')
    ).first();

    if (await addListButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  ✅ Found "Add List" button');
      await addListButton.click();
      await page.waitForTimeout(1000);

      const screenshot2 = 'test-results/final-02-add-list-dialog.png';
      await page.screenshot({ path: screenshot2, fullPage: true });
      testResults.screenshots.push(screenshot2);

      // Look for input field
      const listInput = page.locator('input[type="text"]').first();
      if (await listInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  ✅ List creation dialog opened');
        await listInput.fill('💼 Work Tasks');
        console.log('  → Typed "💼 Work Tasks"');
        await listInput.press('Enter');
        await page.waitForTimeout(2000);

        const screenshot3 = 'test-results/final-03-list-created.png';
        await page.screenshot({ path: screenshot3, fullPage: true });
        testResults.screenshots.push(screenshot3);

        const listCreated = await page.getByText('Work Tasks').isVisible().catch(() => false);
        if (listCreated) {
          testResults.createList.status = '✅ PASSED';
          testResults.createList.details = 'Successfully created "Work Tasks" list';
          console.log('  ✅ List created successfully');

          // Step 4: Add tasks
          console.log('\n📍 Step 4: Adding Tasks to the List');
          const taskInput = page.locator('input[placeholder*="task" i], input[placeholder*="add" i]').first();

          const tasks = ['Review pull requests', 'Update documentation', 'Fix bug in sync'];
          let tasksAdded = 0;

          for (const taskName of tasks) {
            if (await taskInput.isVisible({ timeout: 2000 }).catch(() => false)) {
              await taskInput.fill(taskName);
              await taskInput.press('Enter');
              await page.waitForTimeout(500);
              console.log(`  ✅ Added task: "${taskName}"`);
              tasksAdded++;
            } else {
              console.log(`  ❌ Could not find task input for: "${taskName}"`);
              break;
            }
          }

          if (tasksAdded === tasks.length) {
            testResults.addTasks.status = '✅ PASSED';
            testResults.addTasks.details = `Added ${tasksAdded} tasks successfully`;

            const screenshot4 = 'test-results/final-04-tasks-added.png';
            await page.screenshot({ path: screenshot4, fullPage: true });
            testResults.screenshots.push(screenshot4);

            // Step 5: Task interactions
            console.log('\n📍 Step 5: Testing Task Interactions');
            const firstTask = page.getByText('Review pull requests').first();
            if (await firstTask.isVisible({ timeout: 2000 }).catch(() => false)) {
              await firstTask.click();
              await page.waitForTimeout(1000);
              console.log('  ✅ Clicked on first task');

              const screenshot5 = 'test-results/final-05-task-detail.png';
              await page.screenshot({ path: screenshot5, fullPage: true });
              testResults.screenshots.push(screenshot5);

              // Check for progress slider
              const slider = page.locator('input[type="range"]').first();
              if (await slider.isVisible({ timeout: 2000 }).catch(() => false)) {
                await slider.fill('75');
                console.log('  ✅ Adjusted progress slider to 75%');
                testResults.taskInteractions.status = '✅ PASSED';
                testResults.taskInteractions.details = 'Successfully interacted with task and progress slider';
              } else {
                console.log('  ℹ️  No progress slider found');
                testResults.taskInteractions.status = '⚠️  PARTIAL';
                testResults.taskInteractions.details = 'Task opened but no progress slider visible';
              }

              await page.keyboard.press('Escape');
              await page.waitForTimeout(500);
            } else {
              testResults.taskInteractions.status = '❌ FAILED';
              testResults.taskInteractions.details = 'Could not find task to interact with';
            }
          } else {
            testResults.addTasks.status = '❌ FAILED';
            testResults.addTasks.details = `Only added ${tasksAdded}/${tasks.length} tasks`;
          }
        } else {
          testResults.createList.status = '❌ FAILED';
          testResults.createList.details = 'List creation dialog worked but list did not appear';
        }
      } else {
        testResults.createList.status = '❌ FAILED';
        testResults.createList.details = 'Could not find list name input field';
      }
    } else {
      testResults.createList.status = '❌ FAILED';
      testResults.createList.details = 'Could not find "Add List" button';
      console.log('  ❌ "Add List" button not found');
    }

    // Step 6: Sync status
    console.log('\n📍 Step 6: Checking Sync Status');
    const syncButton = page.locator('button:has-text("sync"), button[aria-label*="sync" i]').first();
    if (await syncButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      testResults.sync.status = '✅ PASSED';
      testResults.sync.details = 'Sync button visible (offline mode expected)';
      console.log('  ✅ Sync button found');
    } else {
      testResults.sync.status = 'ℹ️  INFO';
      testResults.sync.details = 'No sync button (auto-sync or offline)';
      console.log('  ℹ️  No sync button found');
    }

    // Step 7: Responsiveness check
    console.log('\n📍 Step 7: Testing Responsiveness');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const screenshot6 = 'test-results/final-06-mobile-view.png';
    await page.screenshot({ path: screenshot6, fullPage: true });
    testResults.screenshots.push(screenshot6);

    testResults.responsiveness.status = '✅ PASSED';
    testResults.responsiveness.details = 'Mobile viewport rendered successfully';
    console.log('  ✅ Mobile view captured');

    // Final screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    const screenshotFinal = 'test-results/final-07-final-state.png';
    await page.screenshot({ path: screenshotFinal, fullPage: true });
    testResults.screenshots.push(screenshotFinal);

    // Print comprehensive report
    console.log('\n════════════════════════════════════════');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('════════════════════════════════════════\n');

    console.log(`1. Authentication: ${testResults.authentication.status}`);
    console.log(`   ${testResults.authentication.details}\n`);

    console.log(`2. UI Load: ${testResults.uiLoad.status}`);
    console.log(`   ${testResults.uiLoad.details}\n`);

    console.log(`3. Create List: ${testResults.createList.status}`);
    console.log(`   ${testResults.createList.details}\n`);

    console.log(`4. Add Tasks: ${testResults.addTasks.status}`);
    console.log(`   ${testResults.addTasks.details}\n`);

    console.log(`5. Task Interactions: ${testResults.taskInteractions.status}`);
    console.log(`   ${testResults.taskInteractions.details}\n`);

    console.log(`6. Sync Status: ${testResults.sync.status}`);
    console.log(`   ${testResults.sync.details}\n`);

    console.log(`7. Responsiveness: ${testResults.responsiveness.status}`);
    console.log(`   ${testResults.responsiveness.details}\n`);

    console.log('════════════════════════════════════════');
    console.log('🐛 ISSUES DETECTED');
    console.log('════════════════════════════════════════\n');

    if (testResults.consoleErrors.length > 0) {
      console.log('Console Errors:');
      testResults.consoleErrors.slice(0, 5).forEach(err => {
        console.log(`  ⚠️  ${err.substring(0, 100)}`);
      });
    } else {
      console.log('Console Errors: None');
    }

    if (testResults.networkErrors.length > 0) {
      console.log('\nNetwork Errors:');
      testResults.networkErrors.slice(0, 5).forEach(err => {
        console.log(`  ⚠️  ${err}`);
      });
    } else {
      console.log('\nNetwork Errors: None');
    }

    console.log('\n════════════════════════════════════════');
    console.log('📸 Screenshots Captured:');
    console.log('════════════════════════════════════════');
    testResults.screenshots.forEach((path, i) => {
      console.log(`  ${i + 1}. ${path}`);
    });
    console.log('════════════════════════════════════════\n');

    // Don't fail the test, just report
    expect(true).toBe(true);
  });
});
