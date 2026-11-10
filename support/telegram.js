// Подпись initData так же, как её делает Telegram: HMAC-SHA256 с ключом от токена бота.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
const crypto = require('crypto');

const BOT_TOKEN = process.env.E2E_BOT_TOKEN || '123456789:E2E_TEST_TOKEN_not_real';

function signInitData(user, { authDate = Math.floor(Date.now() / 1000), token = BOT_TOKEN } = {}) {
  const fields = { auth_date: String(authDate), query_id: 'e2e', user: JSON.stringify(user) };
  const check = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const hash = crypto.createHmac('sha256', secret).update(check).digest('hex');
  return new URLSearchParams({ ...fields, hash }).toString();
}

// Заглушка telegram-web-app.js: тот же интерфейс window.Telegram.WebApp, что даёт клиент Telegram.
// Вызовы openLink / HapticFeedback пишем в window.__tg, чтобы тест мог их проверить.
function webAppStub(initData, { colorScheme = 'dark' } = {}) {
  return `
  window.__tg = { opened: [], haptics: 0, cloud: {} };
  const noop = () => {};
  const btn = { show: noop, hide: noop, onClick: noop, offClick: noop, setText: noop, enable: noop, disable: noop, isVisible: false };
  window.Telegram = { WebApp: {
    initData: ${JSON.stringify(initData)},
    initDataUnsafe: {}, version: '8.0', platform: 'android', colorScheme: ${JSON.stringify(colorScheme)},
    themeParams: {}, isExpanded: true, viewportHeight: innerHeight, viewportStableHeight: innerHeight,
    ready: noop, expand: noop, close: () => { window.__tg.closed = true; },
    isVersionAtLeast: () => true, disableVerticalSwipes: noop, enableClosingConfirmation: noop,
    setHeaderColor: noop, setBackgroundColor: noop, setBottomBarColor: noop,
    onEvent: noop, offEvent: noop, sendData: noop,
    openLink: (u) => window.__tg.opened.push(u), openTelegramLink: (u) => window.__tg.opened.push(u),
    showAlert: (m, cb) => cb && cb(), showConfirm: (m, cb) => cb && cb(true), showPopup: (p, cb) => cb && cb('ok'),
    BackButton: btn, MainButton: btn, SecondaryButton: btn, SettingsButton: btn,
    HapticFeedback: { impactOccurred: () => window.__tg.haptics++, notificationOccurred: () => window.__tg.haptics++, selectionChanged: noop },
    CloudStorage: {
      getItem: (k, cb) => cb(null, window.__tg.cloud[k] || ''),
      getItems: (ks, cb) => cb(null, Object.fromEntries(ks.map((k) => [k, window.__tg.cloud[k] || '']))),
      setItem: (k, v, cb) => { window.__tg.cloud[k] = v; cb && cb(null, true); },
      removeItem: (k, cb) => { delete window.__tg.cloud[k]; cb && cb(null, true); },
      getKeys: (cb) => cb(null, Object.keys(window.__tg.cloud)),
    },
    checkHomeScreenStatus: (cb) => cb && cb('unsupported'), addToHomeScreen: noop,
  } };`;
}

module.exports = { signInitData, webAppStub, BOT_TOKEN };
