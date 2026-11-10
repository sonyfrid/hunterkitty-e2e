// Первый вход нового пользователя и вход без Telegram
const { test, expect } = require('../../fixtures');
const { NEWBIE, DISABLED, STRANGER } = require('../../support/users');

test.describe('Онбординг и вход', () => {
  test('новичок выбирает профессию и формат и сразу видит подходящие вакансии', async ({ openApp, onboarding, feed }) => {
    await openApp(NEWBIE);
    await expect(onboarding.heading).toBeVisible();

    await onboarding.chooseTitle('Тестировщик');
    await onboarding.format('remote_ru').click();
    await expect(onboarding.format('remote_ru')).toHaveAttribute('aria-pressed', 'true');
    await onboarding.findButton.click();

    await feed.waitLoaded();
    await expect(feed.visibleJobs.first()).toBeVisible();
    const titles = await feed.titles();
    expect(titles.length).toBeGreaterThan(0);
    for (const t of titles) expect(t).toMatch(/QA|Тестировщ|тестирован/i);
  });

  test('без профессии кнопка поиска не ищет, а просит выбрать профессию', async ({ openApp, onboarding, page }) => {
    await openApp(NEWBIE);
    await onboarding.findButton.click();
    await expect(onboarding.heading).toBeVisible();
    await expect(page.locator('article.v3job')).toHaveCount(0);
  });

  test('открыли страницу не из Telegram: просим открыть из бота', async ({ openApp, page }) => {
    await openApp(NEWBIE, { initData: '' });
    await expect(page.getByText('Открой приложение из Telegram')).toBeVisible();
  });

  test('не нажимал /start: просим начать в боте', async ({ openApp, page }) => {
    await openApp(STRANGER);
    await expect(page.getByText('Сначала нажми /start')).toBeVisible();
  });

  test('отключённый пользователь не попадает в приложение', async ({ openApp, page }) => {
    await openApp(DISABLED);
    await expect(page.getByText('Доступ к боту пока закрыт')).toBeVisible();
    await expect(page.locator('article.v3job')).toHaveCount(0);
  });
});
