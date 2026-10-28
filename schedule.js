/*
 * Расчёт свободных дней по графику 2/2.
 * Работает и в браузере (window.DateSchedule), и в Node (module.exports) — чтобы можно было тестировать.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DateSchedule = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var MS_DAY = 86400000;

  function utcOf(date) {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function parseISO(value) {
    var parts = String(value).split('-').map(Number);
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  }

  function iso(date) {
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return date.getFullYear() + '-' + m + '-' + d;
  }

  function format(date) {
    var text = new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /** Выходной ли день по циклу «работа/отдых» от якорной даты. */
  function isOffDay(date, cfg) {
    var work = Number(cfg.workDays);
    var off = Number(cfg.offDays);
    var cycle = work + off;
    if (cycle <= 0) return true;

    var diff = Math.round((utcOf(date) - parseISO(cfg.anchorDate)) / MS_DAY);
    var pos = ((diff % cycle) + cycle) % cycle;
    return pos >= work;
  }

  /**
   * Ближайшие подходящие дни: нужный день недели + выходной по графику.
   * Сегодняшний день не предлагаем — вдруг она откроет сайт поздно вечером.
   */
  function upcoming(fromDate, cfg, limit) {
    var start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    var wanted = cfg.weekdays || [5, 6];
    var out = [];
    var max = limit || cfg.count || 8;

    for (var i = 1; i <= 200 && out.length < max; i++) {
      var day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      if (wanted.indexOf(day.getDay()) === -1) continue;
      if (!isOffDay(day, cfg)) continue;
      out.push({ iso: iso(day), date: day, label: format(day) });
    }
    return out;
  }

  return {
    isOffDay: isOffDay,
    upcoming: upcoming,
    iso: iso,
    format: format
  };
});
