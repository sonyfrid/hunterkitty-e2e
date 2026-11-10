// Авторизация Mini App: API доверяет только initData, подписанной токеном бота
const { test, expect } = require('../../fixtures');
const { signInitData } = require('../../support/telegram');
const { QA, DISABLED, STRANGER } = require('../../support/users');

const now = () => Math.floor(Date.now() / 1000);

test.describe('Авторизация по initData Telegram', () => {
  test('валидная подпись: 200 и данные профиля', async ({ api }) => {
    const res = await api.get('/api/state', QA);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(JSON.stringify(body)).toContain('Тестировщик');
  });

  test('без заголовка initData: 401', async ({ api }) => {
    const res = await api.get('/api/state');
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toContain('Открой приложение из Telegram');
  });

  test('подпись чужим токеном бота: 401', async ({ api }) => {
    const res = await api.get('/api/state', QA, { token: '987654321:SOMEONE_ELSE_BOT' });
    expect(res.status()).toBe(401);
  });

  test('подменили пользователя в подписанной строке: 401', async ({ request }) => {
    // подписали как QA, а потом поменяли id в user на другой
    const forged = signInitData(QA).replace(encodeURIComponent(`"id":${QA.id}`), encodeURIComponent('"id":1003'));
    expect(forged).not.toBe(signInitData(QA));
    const res = await request.get('/api/state', { headers: { 'X-Telegram-Init-Data': forged } });
    expect(res.status()).toBe(401);
  });

  test('подпись старше суток: 401', async ({ api }) => {
    const res = await api.get('/api/state', QA, { authDate: now() - 25 * 3600 });
    expect(res.status()).toBe(401);
  });

  test('дата подписи из будущего: 401', async ({ api }) => {
    const res = await api.get('/api/state', QA, { authDate: now() + 3600 });
    expect(res.status()).toBe(401);
  });

  test('не нажимал /start: 403 с подсказкой', async ({ api }) => {
    const res = await api.get('/api/state', STRANGER);
    expect(res.status()).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'start' });
  });

  test('отключённый пользователь: 403', async ({ api }) => {
    const res = await api.get('/api/state', DISABLED);
    expect(res.status()).toBe(403);
  });
});
