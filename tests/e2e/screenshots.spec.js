// Скриншоты экранов для README (запуск: npx playwright test screenshots --project="Pixel 7")
const { test } = require('../../fixtures');
const { QA, NEWBIE } = require('../../support/users');

test.skip(!process.env.SHOTS, 'только по SHOTS=1');

test('скриншоты экранов', async ({ openApp, onboarding, filters, feed, safe, page }) => {
  await openApp(NEWBIE);
  await onboarding.heading.waitFor();
  await page.screenshot({ path: 'docs/01-onboarding.png' });

  await openApp(QA);
  await filters.showVacancies.waitFor();
  await page.screenshot({ path: 'docs/02-filters.png' });
  await filters.showVacancies.click();
  await feed.waitLoaded();
  await page.screenshot({ path: 'docs/03-feed.png' });
  await feed.save('QA Automation Engineer (Playwright)');
  await feed.open('QA Automation Engineer (Playwright)');
  await page.locator('.detail').waitFor();
  await page.screenshot({ path: 'docs/04-detail.png' });
  await safe.tab.click();
  await safe.heading.waitFor();
  await page.screenshot({ path: 'docs/05-safe.png' });
});
