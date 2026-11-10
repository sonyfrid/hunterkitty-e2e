const base = require('@playwright/test');
const { signInitData, webAppStub } = require('../support/telegram');
const { FiltersPage } = require('../pages/FiltersPage');
const { OnboardingPage } = require('../pages/OnboardingPage');
const { FeedPage } = require('../pages/FeedPage');
const { DetailPage } = require('../pages/DetailPage');
const { SafePage } = require('../pages/SafePage');

// Клиент API стенда: запросы подписаны так же, как их подписывает Telegram
class Api {
  constructor(request) { this.request = request; }

  async reset() {
    const res = await this.request.post('/__e2e/reset');
    base.expect(res.ok()).toBeTruthy();
  }

  headers(user, opts) { return { 'X-Telegram-Init-Data': signInitData(user, opts) }; }

  get(path, user, opts) { return this.request.get(path, { headers: user ? this.headers(user, opts) : {} }); }

  post(path, user, data = {}, opts) {
    return this.request.post(path, { headers: user ? this.headers(user, opts) : {}, data });
  }

  // выдача пользователя: «Найти работу» пересчитывает её и отдаёт первую страницу
  async feed(user) {
    const res = await this.post('/api/search', user);
    base.expect(res.status()).toBe(200);
    return res.json();
  }
}

exports.test = base.test.extend({
  api: async ({ request }, use) => {
    const api = new Api(request);
    await api.reset();
    await use(api);
  },

  // открыть Mini App «из Telegram» от имени пользователя: подменяем telegram-web-app.js заглушкой
  // с подписанной initData. Шрифты Google не грузим, чтобы тесты не зависели от внешней сети.
  openApp: async ({ page, api }, use) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    await use(async (user, { initData } = {}) => {
      const data = initData !== undefined ? initData : signInitData(user);
      await page.route('https://telegram.org/js/telegram-web-app.js', (route) =>
        route.fulfill({ contentType: 'text/javascript', body: webAppStub(data) }));
      await page.goto('/');
    });
  },

  onboarding: async ({ page }, use) => use(new OnboardingPage(page)),
  filters: async ({ page }, use) => use(new FiltersPage(page)),
  feed: async ({ page }, use) => use(new FeedPage(page)),
  detail: async ({ page }, use) => use(new DetailPage(page)),
  safe: async ({ page }, use) => use(new SafePage(page)),
});

exports.expect = base.expect;
