// SQL-инъекции через все поля, которые API пишет в базу: значения сохраняются как обычный текст,
// сервер не падает, чужие данные и таблица вакансий целы. База стенда настоящая (PostgreSQL).
const { test, expect } = require('../../fixtures');
const { QA, OTHER } = require('../../support/users');

const PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE vacancies; --",
  "1) UNION SELECT tg_id, first_name FROM users --",
  "QA' AND pg_sleep(3) --",
  '" OR ""="',
  "%' OR 1=1 --",
];

async function snapshot(api, user) {
  const state = await (await api.get('/api/state', user)).json();
  const feed = await api.feed(user);
  return { state: JSON.stringify(state), total: feed.total };
}

test.describe('SQL injection: ввод через API хранится как данные', () => {
  test('профессии с SQL-символами сохраняются дословно', async ({ api }) => {
    const before = await snapshot(api, OTHER);
    for (const p of PAYLOADS.slice(0, 2)) {
      const res = await api.post('/api/titles', QA, { title: p, on: true });
      expect([200, 400]).toContain(res.status()); // 400 только «слишком много профессий», не ошибка базы
    }
    const state = JSON.stringify(await (await api.get('/api/state', QA)).json());
    expect(state).toContain("' OR '1'='1");
    expect(await snapshot(api, OTHER)).toEqual(before);
  });

  test('стоп-слова, компании и навыки: списки с инъекциями', async ({ api }) => {
    const before = await snapshot(api, OTHER);
    for (const field of ['excluded_companies', 'excluded_keywords', 'skills']) {
      const res = await api.post('/api/list', QA, { field, items: PAYLOADS });
      expect(res.status(), field).toBe(200);
    }
    const state = JSON.stringify(await (await api.get('/api/state', QA)).json());
    expect(state).toContain('DROP TABLE vacancies');
    // таблица вакансий на месте, поиск работает, чужая выдача не изменилась
    expect((await api.post('/api/search', QA)).status()).toBe(200);
    expect(await snapshot(api, OTHER)).toEqual(before);
  });

  test('города и подсказки мест', async ({ api, request }) => {
    for (const p of PAYLOADS.slice(0, 3)) {
      expect((await api.post('/api/places', QA, { code: p, on: true })).status()).toBe(200);
      expect((await api.get(`/api/place_sugg?q=${encodeURIComponent(p)}`, QA)).status()).toBe(200);
    }
  });

  test('числовые параметры: мусор вместо offset не ломает выдачу', async ({ api }) => {
    for (const p of ["0 OR 1=1", "1;DROP TABLE users", "-1", "999999999999999999999"]) {
      const res = await api.get(`/api/feed?offset=${encodeURIComponent(p)}`, QA);
      expect(res.status(), p).toBe(200);
    }
  });

  test('задержка pg_sleep не исполняется (нет time-based инъекции)', async ({ api }) => {
    const t = Date.now();
    await api.post('/api/list', QA, { field: 'excluded_keywords', items: ["x' || pg_sleep(5) || '"] });
    await api.post('/api/search', QA);
    expect(Date.now() - t).toBeLessThan(5000);
  });
});
