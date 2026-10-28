/*
 * Настройки сайта. Меняйте только этот файл.
 */
window.SITE_CONFIG = {
  // Имя девушки (подставляется в тексты)
  name: 'Милена',

  /*
   * URL веб-приложения Google Apps Script (см. README, шаг «Google Таблица»).
   * Пока пусто — ответы печатаются в консоль и никуда не уходят.
   * После настройки таблицы вставьте сюда ссылку вида:
   * https://script.google.com/macros/s/AKfycb.../exec
   */
  sendUrl: 'https://script.google.com/macros/s/AKfycbwdLAvOSGN1xqiL3sdb4HXbWyZFtqDOvLq_OeJ9A2sOzXgVRsQagUbpB923CVir-UUcVQ/exec',

  // true — ответы не отправляются (удобно для локальных тестов)
  testMode: false,

  // Должен совпадать с SECRET в google-apps-script/Code.gs.
  // Это не пароль, а защита от случайного спама — можно оставить как есть.
  secret: 'milena-7f3a91c2e5',

  // График 2/2: 28.10.2026 — первый рабочий день, 2 рабочих / 2 выходных.
  // Показываем только пятницы и субботы, когда свободны оба.
  schedule: {
    anchorDate: '2026-10-28',
    workDays: 2,
    offDays: 2,
    weekdays: [5, 6], // 5 — пятница, 6 — суббота
    count: 8,
    times: ['17:00', '18:00', '19:00', '20:00']
  }
};
