// Сейф: сохранить вакансию, увидеть её после перезапуска, убрать
const { test, expect } = require('../../fixtures');
const { QA } = require('../../support/users');

const TITLE = 'QA Automation Engineer (Playwright)';

test.describe('Сейф ♥', () => {
  test.beforeEach(async ({ openApp, filters, feed }) => {
    await openApp(QA);
    await filters.showVacancies.click();
    await feed.waitLoaded();
  });

  test('сохранённая вакансия появляется в сейфе и остаётся после перезапуска', async ({ feed, safe, page }) => {
    await feed.save(TITLE);
    await expect(feed.saveButton(TITLE)).toHaveAttribute('aria-pressed', 'true');

    await safe.tab.click();
    await expect(safe.job(TITLE)).toBeVisible();

    await page.reload();
    await safe.tab.click();
    await expect(safe.job(TITLE)).toBeVisible();
    await expect(safe.jobs).toHaveCount(1);
  });

  test('вакансию можно убрать прямо из сейфа', async ({ feed, safe }) => {
    await feed.save(TITLE);
    await safe.tab.click();
    await expect(safe.job(TITLE)).toBeVisible();
    await safe.removeButton(TITLE).click();
    await expect(safe.job(TITLE)).toHaveCount(0);
    await expect(safe.screen).toContainText('сейф пуст');
  });

  test('повторное нажатие ♥ убирает вакансию из сейфа', async ({ feed, safe }) => {
    await feed.save(TITLE);
    await expect(feed.saveButton(TITLE)).toHaveAttribute('aria-pressed', 'true');
    await feed.save(TITLE);
    await expect(feed.saveButton(TITLE)).toHaveAttribute('aria-pressed', 'false');

    await safe.tab.click();
    await expect(safe.screen).toContainText('сейф пуст');
    await expect(safe.job(TITLE)).toHaveCount(0);
  });
});
