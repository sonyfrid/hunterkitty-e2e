// Лента и сейф через API: выдача по фильтрам и доступ только к своим данным
const { test, expect } = require('../../fixtures');
const { QA, OTHER, NEWBIE } = require('../../support/users');

test.describe('API ленты и сейфа', () => {
  test('выдача совпадает с фильтрами: только тестировщики на удалёнке', async ({ api }) => {
    const feed = await api.feed(QA);
    expect(feed.total).toBeGreaterThan(0);
    for (const item of feed.items) {
      expect(JSON.stringify(item)).toMatch(/QA|Тестировщ|тестирован/i);
      expect(JSON.stringify(item)).not.toMatch(/Python-разработчик|Frontend|Дизайнер/);
    }
  });

  test('без профессии поиск не запускается: 400 и код no_title', async ({ api }) => {
    const res = await api.post('/api/search', NEWBIE);
    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'no_title' });
  });

  test('сохранить в сейф и убрать из сейфа', async ({ api }) => {
    const [first] = (await api.feed(QA)).items;

    let res = await api.post(`/api/vacancy/${first.id}/save`, QA, { saved: true });
    expect(res.status()).toBe(200);
    let saved = await (await api.get('/api/saved', QA)).json();
    expect(saved.items.map((i) => i.id)).toContain(first.id);

    res = await api.post(`/api/vacancy/${first.id}/save`, QA, { saved: false });
    expect(res.status()).toBe(200);
    saved = await (await api.get('/api/saved', QA)).json();
    expect(saved.items.map((i) => i.id)).not.toContain(first.id);
  });

  test('чужую вакансию из выдачи нельзя открыть или сохранить (IDOR): 404', async ({ api }) => {
    const [mine] = (await api.feed(QA)).items;
    await api.feed(OTHER);

    expect((await api.get(`/api/vacancy/${mine.id}`, QA)).status()).toBe(200);
    expect((await api.get(`/api/vacancy/${mine.id}`, OTHER)).status()).toBe(404);
    expect((await api.post(`/api/vacancy/${mine.id}/save`, OTHER, { saved: true })).status()).toBe(404);
    const othersSafe = await (await api.get('/api/saved', OTHER)).json();
    expect(othersSafe.items.map((i) => i.id)).not.toContain(mine.id);
  });

  test('несуществующая вакансия: 404', async ({ api }) => {
    expect((await api.get('/api/vacancy/999999', QA)).status()).toBe(404);
  });
});
