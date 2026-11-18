// Негативные проверки доступа по всем маршрутам API: без подписи, чужой, отключённый, кривой ввод
const { test, expect } = require('../../fixtures');
const { signInitData } = require('../../support/telegram');
const { QA, OTHER, DISABLED, STRANGER } = require('../../support/users');

// Все 33 маршрута Mini App (app/miniapp/api.py). {id} подставляем номером строки выдачи.
const ROUTES = [
  ['GET', '/api/state'], ['POST', '/api/titles'], ['POST', '/api/no_experience'], ['POST', '/api/titles/replace'],
  ['POST', '/api/list'], ['POST', '/api/work_format'], ['GET', '/api/place_sugg'], ['POST', '/api/places'],
  ['POST', '/api/notify'], ['POST', '/api/search'], ['GET', '/api/feed/more'], ['GET', '/api/feed'],
  ['GET', '/api/vacancy/1'], ['POST', '/api/go/1'], ['POST', '/api/vacancy/1/save'], ['GET', '/api/saved'],
  ['GET', '/api/bot'], ['GET', '/api/pro'], ['POST', '/api/pro/tribute'], ['POST', '/api/vacancy/1/apply'],
  ['POST', '/api/pay'], ['POST', '/api/pay/1/check'], ['POST', '/api/feedback'], ['POST', '/api/serbia/toggle'],
  ['POST', '/api/serbia/reset'], ['GET', '/api/sources'], ['POST', '/api/sources'], ['GET', '/api/stats'],
  ['POST', '/api/about'], ['POST', '/api/search/autosetup'], ['POST', '/api/vacancy/1/letter'],
  ['POST', '/api/about/resume'], ['POST', '/api/resume/check'],
];

// Маршруты, которые читают JSON из тела: кривое тело должно давать 400, а не 500
const JSON_BODY = ['/api/titles', '/api/titles/replace', '/api/list', '/api/work_format', '/api/places',
  '/api/notify', '/api/feedback', '/api/serbia/toggle', '/api/sources', '/api/no_experience'];

function send(request, method, path, headers = {}, data) {
  const opts = { headers, ...(method === 'POST' ? { data: data === undefined ? {} : data } : {}) };
  return method === 'GET' ? request.get(path, opts) : request.post(path, opts);
}

const asUser = (user) => ({ 'X-Telegram-Init-Data': signInitData(user) });

test.describe('Доступ к API: негативные проверки', () => {
  test('все 33 маршрута без подписи Telegram: 401', async ({ api, request }) => {
    expect(ROUTES).toHaveLength(33);
    for (const [method, path] of ROUTES) {
      const res = await send(request, method, path);
      expect.soft(res.status(), `${method} ${path}`).toBe(401);
    }
  });

  test('отключённый пользователь на всех маршрутах: 403', async ({ api, request }) => {
    for (const [method, path] of ROUTES) {
      const res = await send(request, method, path, asUser(DISABLED));
      expect.soft(res.status(), `${method} ${path}`).toBe(403);
    }
  });

  test('не нажимал /start (нет в базе) на всех маршрутах: 403', async ({ api, request }) => {
    for (const [method, path] of ROUTES) {
      const res = await send(request, method, path, asUser(STRANGER));
      expect.soft(res.status(), `${method} ${path}`).toBe(403);
    }
  });

  test('чужая строка выдачи: открыть, перейти, сохранить, отклик, письмо: 404 (IDOR)', async ({ api }) => {
    const [mine] = (await api.feed(QA)).items;
    await api.feed(OTHER);
    expect((await api.get(`/api/vacancy/${mine.id}`, OTHER)).status()).toBe(404);
    expect((await api.post(`/api/go/${mine.id}`, OTHER)).status()).toBe(404);
    expect((await api.post(`/api/vacancy/${mine.id}/save`, OTHER, { saved: true })).status()).toBe(404);
    // «Откликнуться» только пишет событие статистики от имени нажавшего: данных не отдаёт и не меняет.
    // id строки не проверяется (HK-12, информационная находка: можно засорить статистику)
    const apply = await api.post(`/api/vacancy/${mine.id}/apply`, OTHER);
    expect(await apply.json()).toEqual({ ok: true });
    expect([404, 403]).toContain((await api.post(`/api/vacancy/${mine.id}/letter`, OTHER)).status());
    // сам владелец строки её видит, то есть 404 выше именно из-за чужого id
    expect((await api.get(`/api/vacancy/${mine.id}`, QA)).status()).toBe(200);
  });

  test('чужой или несуществующий счёт: 404', async ({ api }) => {
    expect((await api.post('/api/pay/999999/check', QA)).status()).toBe(404);
    expect((await api.post('/api/pay/1/check', OTHER)).status()).toBe(404);
  });

  test('кривое JSON-тело и массив вместо объекта: 400, а не 500', async ({ api, request }) => {
    for (const path of JSON_BODY) {
      for (const raw of ['not json{', '[1,2]']) {
        const res = await request.post(path, { headers: { ...asUser(QA), 'Content-Type': 'application/json' }, data: raw });
        expect.soft(res.status(), `${path} ${raw}`).toBe(400);
      }
    }
  });

  test('недопустимые значения полей: 400', async ({ api }) => {
    expect((await api.post('/api/list', QA, { field: 'is_admin', items: ['x'] })).status()).toBe(400);
    expect((await api.post('/api/list', QA, { field: 'skills', items: 'not a list' })).status()).toBe(400);
    expect((await api.post('/api/notify', QA, { mode: 'everyone' })).status()).toBe(400);
    expect((await api.post('/api/work_format', QA, { code: 'moon', on: true })).status()).toBe(400);
    expect((await api.post('/api/titles', QA, { title: '   ', on: true })).status()).toBe(400);
    expect((await api.post('/api/feedback', QA, { kind: 'admin', text: 'x' })).status()).toBe(400);
    expect((await api.post('/api/titles/replace', QA, { titles: 'QA' })).status()).toBe(400);
  });

  test('нечисловой id в адресе не доходит до обработчика: 404', async ({ api }) => {
    expect((await api.get('/api/vacancy/abc', QA)).status()).toBe(404);
    expect((await api.get('/api/vacancy/1%20OR%201=1', QA)).status()).toBe(404);
  });

  test('HK-11: та же строка initData повторно принимается в пределах суток (известный принятый риск)', async ({ request, api }) => {
    // Подпись доказывает происхождение, но не одноразовость. Разбор и план: findings/HK-11 в hunterkitty-security-review
    const same = signInitData(QA);
    const first = await request.get('/api/state', { headers: { 'X-Telegram-Init-Data': same } });
    const replay = await request.get('/api/state', { headers: { 'X-Telegram-Init-Data': same } });
    expect(first.status()).toBe(200);
    expect(replay.status()).toBe(200);
  });
});
