/**
 * Google Apps Script для приёма ответа с сайта-приглашения.
 *
 * Как подключить — пошагово в README.md, раздел «Google Таблица».
 * Кратко: вставить этот код в Apps Script, развернуть как веб-приложение
 * («От имени: я», «Доступ: все») и вставить полученный URL в config.js → sendUrl.
 */

// Должно совпадать с secret в config.js
var SECRET = 'milena-7f3a91c2e5';

// Куда присылать письмо. Пустая строка — на почту владельца скрипта.
var NOTIFY_EMAIL = '';

// Название листа с ответами
var SHEET_NAME = 'Ответы';

var HEADERS = [
  'Когда ответила',
  'Имя',
  'Заведение',
  'Подпись',
  'Дата',
  'День',
  'Время',
  'ID'
];

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'milena-date' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (SECRET && data.secret !== SECRET) {
      return reply({ ok: false, error: 'bad secret' });
    }

    // Скрытое поле-ловушка: люди его не заполняют, боты заполняют.
    if (data.honeypot) {
      return reply({ ok: true, skipped: true });
    }

    if (!data.venue || !data.date || !data.time) {
      return reply({ ok: false, error: 'missing fields' });
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(15000);

    try {
      var sheet = getSheet();
      var answeredAt = Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        'dd.MM.yyyy HH:mm'
      );

      sheet.appendRow([
        answeredAt,
        data.name || '',
        data.venue || '',
        data.venueNote || '',
        data.date || '',
        data.dateLabel || '',
        data.time || '',
        data.id || ''
      ]);

      notify(data);
    } finally {
      lock.releaseLock();
    }

    return reply({ ok: true });
  } catch (error) {
    return reply({ ok: false, error: String(error) });
  }
}

function getSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#ffe7f2')
      .setFontColor('#6b4a57');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, HEADERS.length, 150);
  }

  return sheet;
}

function notify(data) {
  var to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail();
  if (!to) {
    console.warn('Письмо не отправлено: не задан NOTIFY_EMAIL и не удалось определить почту.');
    return;
  }

  var subject = '💕 ' + (data.name || 'Она') + ' выбрала: ' + data.venue;
  var lines = [
    (data.name || 'Она') + ' ответила на приглашение!',
    '',
    'Заведение: ' + data.venue + (data.venueNote ? ' (' + data.venueNote + ')' : ''),
    'День: ' + (data.dateLabel || data.date),
    'Время: ' + data.time,
    '',
    'Открыть таблицу: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
  ];

  var html =
    '<div style="font-family:Arial,sans-serif;background:#fff5fa;padding:24px;border-radius:16px;color:#6b4a57">' +
    '<h2 style="margin:0 0 12px">💕 ' + escapeHtml(data.name || 'Она') + ' ответила «да»!</h2>' +
    '<p style="margin:6px 0"><b>Заведение:</b> ' + escapeHtml(data.venue) +
    (data.venueNote ? ' <span style="color:#a57a8c">(' + escapeHtml(data.venueNote) + ')</span>' : '') + '</p>' +
    '<p style="margin:6px 0"><b>День:</b> ' + escapeHtml(data.dateLabel || data.date) + '</p>' +
    '<p style="margin:6px 0"><b>Время:</b> ' + escapeHtml(data.time) + '</p>' +
    '<p style="margin:18px 0 0"><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() +
    '" style="background:#f4568f;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Открыть таблицу</a></p>' +
    '</div>';

  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: lines.join('\n'),
      htmlBody: html
    });
  } catch (error) {
    // Если почтовый лимит исчерпан — ответ всё равно уже записан в таблицу.
    console.error('Письмо не отправлено: ' + error);
  }
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function reply(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Диагностика. Запускать вручную из редактора Apps Script:
 * выбрать функцию diagnose → Run → посмотреть «Журнал выполнения».
 */
function diagnose() {
  var book = SpreadsheetApp.getActiveSpreadsheet();

  console.log('=== ДИАГНОСТИКА ===');
  console.log('Активный пользователь: ' + Session.getActiveUser().getEmail());
  console.log('Эффективный пользователь: ' + Session.getEffectiveUser().getEmail());
  console.log('Часовой пояс скрипта: ' + Session.getScriptTimeZone());
  console.log('NOTIFY_EMAIL: ' + (NOTIFY_EMAIL || '(пусто)'));

  if (!book) {
    console.log('НЕТ ПРИВЯЗКИ К ТАБЛИЦЕ: скрипт создан отдельно, а не из таблицы.');
    console.log('Откройте таблицу → Расширения → Apps Script и вставьте код туда.');
    return;
  }

  console.log('Таблица: ' + book.getName());
  console.log('URL: ' + book.getUrl());
  console.log('ID: ' + book.getId());

  book.getSheets().forEach(function (sheet) {
    console.log('Лист «' + sheet.getName() + '»: строк = ' + sheet.getLastRow() +
      ', скрыт = ' + sheet.isSheetHidden());
  });

  var target = book.getSheetByName(SHEET_NAME);
  if (!target) {
    console.log('Листа «' + SHEET_NAME + '» нет — он создастся при первом ответе.');
  } else if (target.getLastRow() > 0) {
    var last = Math.min(target.getLastRow(), 6);
    var rows = target.getRange(1, 1, last, 8).getDisplayValues();
    rows.forEach(function (row, index) {
      console.log('Строка ' + (index + 1) + ': ' + row.join(' | '));
    });
  } else {
    console.log('Лист «' + SHEET_NAME + '» пуст.');
  }

  console.log('Остаток писем на сегодня: ' + MailApp.getRemainingDailyQuota());
}
