// Лента: фильтры, поиск, карточка вакансии, отклик
const { test, expect } = require('../../fixtures');
const { QA } = require('../../support/users');

test.describe('Лента вакансий', () => {
  test.beforeEach(async ({ openApp, filters, feed }) => {
    await openApp(QA);
    await filters.showVacancies.click();
    await feed.waitLoaded();
  });

  test('в ленте только вакансии по профессии и формату из фильтров', async ({ feed }) => {
    const titles = await feed.titles();
    expect(titles.length).toBeGreaterThan(0);
    for (const t of titles) expect(t).toMatch(/QA|Тестировщ|тестирован/i);
    await expect(feed.count).toContainText(String(titles.length));
    await expect(feed.job('Python-разработчик')).toHaveCount(0);
  });

  test('поиск по ленте оставляет только совпадения', async ({ feed }) => {
    await feed.search.fill('playwright');
    await expect(feed.visibleJobs).toHaveCount(1);
    await expect(feed.visibleJobs.first()).toContainText('QA Automation Engineer (Playwright)');

    await feed.search.fill('');
    expect((await feed.titles()).length).toBeGreaterThan(1);
  });

  test('карточка вакансии: название, зарплата, компания, описание', async ({ feed, detail }) => {
    await feed.open('QA Automation Engineer (Playwright)');
    await expect(detail.title).toHaveText('QA Automation Engineer (Playwright)');
    await expect(detail.money).toContainText('₽');
    await expect(detail.field('компания')).toHaveText('Облако-7');
    await expect(detail.description).toContainText('Тестовая вакансия');
  });

  test('«Откликнуться» открывает сайт вакансии через Telegram', async ({ feed, detail, page }) => {
    await feed.open('QA Engineer');
    await detail.apply.click();
    await expect.poll(() => page.evaluate(() => window.__tg.opened)).toContain('https://example.com/vacancy/1');
  });

  test('ошибка сервера при поиске: понятное сообщение, приложение не падает', async ({ page, filters }) => {
    await page.route('**/api/search', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Что-то сломалось. Попробуй ещё раз.' }) }));
    await filters.tab.click();
    await filters.showVacancies.click();
    await expect(page.locator('#log')).toContainText('Что-то сломалось');
    await expect(page.locator('nav [data-tab="saved"]')).toBeEnabled();
  });
});
