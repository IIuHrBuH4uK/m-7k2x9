(function () {
  'use strict';

  var cfg = window.SITE_CONFIG || {};
  var schedule = window.DateSchedule;
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STORAGE_KEY = 'milena-date-answer-v1';
  var PENDING_KEY = 'milena-date-pending-v1';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function uid() {
    return 'a-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  var NAME = cfg.name || 'Милена';
  document.title = NAME + ', у меня к тебе вопрос 💗';
  $$('[data-name]').forEach(function (node) { node.textContent = NAME; });

  /* ---------------------------------------------------------------- данные */

  var MESSAGES = [
    { emoji: '🎀', text: 'Привет, ' + NAME + '! Это не спам и не реклама. Это кое-что поважнее.' },
    { emoji: '🌸', text: 'У меня к тебе один очень серьёзный вопрос. Я готовился к нему целый день.' },
    { emoji: '✨', text: 'Но сначала признание: мне всегда мало времени с тобой. Даже когда мы видимся долго — всё равно мало.' },
    { emoji: '🍓', text: 'Поэтому я хочу украсть у тебя один вечер. Целиком. Со всеми твоими улыбками.' },
    { emoji: '💗', text: 'Обещаю: вкусная еда, много болтовни и ни одной скучной минуты.' },
    { emoji: '🧸', text: 'Ну что, рискнёшь?' }
  ];

  var VENUES = [
    { name: 'Автосуши', note: 'роллы и уют', emoji: '🍣' },
    { name: 'Итальянское кафе', note: 'паста и свечи', emoji: '🍝' },
    { name: 'Ростикс', note: 'картошка и ролл', emoji: '🍗' },
    { name: 'БургерКинг', note: 'вредный вкусный вечер', emoji: '🍔' },
    { name: 'Кафе в парке', note: 'прогулка и вкусняшки', emoji: '🌳' },
    { name: 'Старик Хинкалыч', note: 'хинкали и тепло', emoji: '🥟' },
    { name: 'Тбиладжио', note: 'по-грузински и с вином', emoji: '🍷' },
    { name: 'Шашлычный дом', note: 'дым и шашлык', emoji: '🍢' }
  ];

  var TEASES = [
    'Кнопка немного стесняется 🙈',
    'Она очень не хочет, чтобы ты отказывалась',
    'Может, всё-таки «Да»? 💗',
    'Кнопка устала убегать...',
    'Всё, она сдалась. Твой ход 😌'
  ];

  var state = {
    messageIndex: 0,
    venue: null,
    date: null,
    time: null,
    customDate: '',
    customTime: ''
  };

  var typing = false;
  var typeTimer = null;
  var fullText = '';

  /* --------------------------------------------------------------- экраны */

  function show(screenId) {
    $$('.screen').forEach(function (screen) {
      screen.classList.toggle('is-active', screen.id === screenId);
    });
    window.scrollTo(0, 0);
    if (screenId !== 'screen-messages') stopTyping();
  }

  /* ----------------------------------------------------- сообщения (шаг 1) */

  var msgText = $('#msgText');
  var msgSticker = $('#msgSticker');
  var nextBtn = $('#nextBtn');
  var progress = $('#progress');
  var messageCard = $('#messageCard');

  function renderDots() {
    progress.textContent = '';
    MESSAGES.forEach(function () {
      progress.appendChild(document.createElement('i'));
    });
    updateDots();
  }

  function updateDots() {
    $$('i', progress).forEach(function (dot, index) {
      dot.classList.toggle('is-on', index === state.messageIndex);
    });
  }

  function placeCaret() {
    if (REDUCED) return;
    msgText.classList.add('is-typing');
  }

  function stopTyping() {
    clearTimeout(typeTimer);
    typing = false;
    msgText.classList.remove('is-typing');
  }

  function typeText(text) {
    var index = 0;
    typing = true;
    fullText = text;
    msgText.textContent = '';
    placeCaret();

    function step() {
      index += 1;
      msgText.textContent = text.slice(0, index);
      if (index < text.length) {
        typeTimer = setTimeout(step, 14 + Math.random() * 18);
      } else {
        typing = false;
        msgText.classList.remove('is-typing');
      }
    }

    if (REDUCED) {
      typing = false;
      msgText.textContent = text;
      msgText.classList.remove('is-typing');
      return;
    }
    step();
  }

  function finishTyping() {
    if (!typing) return;
    stopTyping();
    msgText.textContent = fullText;
  }

  function renderMessage(index) {
    var message = MESSAGES[index];
    state.messageIndex = index;
    msgSticker.textContent = message.emoji;
    msgSticker.style.animation = 'none';
    void msgSticker.offsetWidth;
    msgSticker.style.animation = '';
    nextBtn.textContent = index === MESSAGES.length - 1 ? 'Дальше 💌' : 'Дальше';
    updateDots();
    typeText(message.text);
  }

  function advanceMessage() {
    if (typing) {
      finishTyping();
      return;
    }
    if (state.messageIndex < MESSAGES.length - 1) {
      renderMessage(state.messageIndex + 1);
    } else {
      show('screen-invite');
      tease.textContent = '';
    }
  }

  $('#startBtn').addEventListener('click', function () {
    renderDots();
    state.messageIndex = 0;
    show('screen-messages');
    renderMessage(0);
  });

  nextBtn.addEventListener('click', function (event) {
    event.stopPropagation();
    advanceMessage();
  });

  messageCard.addEventListener('click', advanceMessage);

  messageCard.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      advanceMessage();
    }
  });

  /* --------------------------------------------------- приглашение (шаг 2) */

  var yesBtn = $('#yesBtn');
  var noBtn = $('#noBtn');
  var tease = $('#tease');
  var inviteActions = $('#inviteActions');
  var dodges = 0;
  var noBase = null;
  var noPos = null;
  var retired = false;

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function moveNoButton() {
    if (dodges >= 5) {
      retireNoButton();
      return;
    }

    var rect = noBtn.getBoundingClientRect();
    if (!noBase) {
      noBase = { left: rect.left, top: rect.top };
      noBtn.style.position = 'fixed';
      noBtn.style.left = rect.left + 'px';
      noBtn.style.top = rect.top + 'px';
      noBtn.style.zIndex = '10';
      noBtn.style.margin = '0';
      noPos = { left: rect.left, top: rect.top };
    }

    var pad = 10;
    var yesRect = yesBtn.getBoundingClientRect();
    var width = noBtn.offsetWidth;
    var height = noBtn.offsetHeight;
    var maxLeft = Math.max(pad, window.innerWidth - width - pad);
    var maxTop = Math.max(pad, window.innerHeight - height - pad);
    var target = null;

    for (var attempt = 0; attempt < 30; attempt++) {
      var candidate = {
        left: randomBetween(pad, maxLeft),
        top: randomBetween(pad, maxTop)
      };
      var safe = 24;
      var hitsYes =
        candidate.left < yesRect.right + safe &&
        candidate.left + width > yesRect.left - safe &&
        candidate.top < yesRect.bottom + safe &&
        candidate.top + height > yesRect.top - safe;
      var farFromOld = Math.hypot(candidate.left - noPos.left, candidate.top - noPos.top) > 90;
      if (!hitsYes && farFromOld) {
        target = candidate;
        break;
      }
    }
    if (!target) {
      target = {
        left: Math.random() < 0.5 ? pad : maxLeft,
        top: Math.random() < 0.5 ? pad : maxTop
      };
    }

    dodges += 1;
    noPos = target;
    var scale = Math.max(0.55, 1 - dodges * 0.1);
    noBtn.style.transform = 'translate(' + (target.left - noBase.left) + 'px,' +
      (target.top - noBase.top) + 'px) scale(' + scale + ')';

    yesBtn.style.transform = 'scale(' + (1 + dodges * 0.09) + ')';
    tease.textContent = TEASES[Math.min(dodges - 1, TEASES.length - 1)];
  }

  function retireNoButton() {
    if (retired) return;
    retired = true;
    noBtn.style.opacity = '0';
    noBtn.style.pointerEvents = 'none';
    tease.textContent = 'Кажется, кнопка «Нет» сломалась 🙈 Наверное, судьба.';

    setTimeout(function () {
      noBtn.remove();
      invitedFallback();
    }, 280);
  }

  function invitedFallback() {
    var fallback = document.createElement('button');
    fallback.type = 'button';
    fallback.className = 'btn btn--ghost';
    fallback.textContent = 'Ну ладно, да 🙈';
    fallback.addEventListener('click', acceptInvite);
    inviteActions.appendChild(fallback);
  }

  function acceptInvite() {
    show('screen-venues');
  }

  yesBtn.addEventListener('click', acceptInvite);

  ['pointerenter', 'pointerdown', 'focus'].forEach(function (eventName) {
    noBtn.addEventListener(eventName, function (event) {
      if (eventName === 'pointerdown') event.preventDefault();
      moveNoButton();
    }, { passive: eventName !== 'pointerdown' });
  });

  noBtn.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      moveNoButton();
    }
  });

  /* -------------------------------------------------------- места (шаг 3) */

  var venueGrid = $('#venueGrid');

  function renderVenues() {
    venueGrid.textContent = '';
    VENUES.forEach(function (venue) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'venue';

      var emoji = document.createElement('span');
      emoji.className = 'venue__emoji';
      emoji.setAttribute('aria-hidden', 'true');
      emoji.textContent = venue.emoji;

      var name = document.createElement('span');
      name.className = 'venue__name';
      name.textContent = venue.name;

      var note = document.createElement('span');
      note.className = 'venue__note';
      note.textContent = venue.note;

      button.append(emoji, name, note);
      button.addEventListener('click', function () { openConfirm(venue); });
      venueGrid.appendChild(button);
    });
  }

  var confirmModal = $('#confirmModal');
  var confirmEmoji = $('#confirmEmoji');
  var confirmText = $('#confirmText');
  var confirmYes = $('#confirmYes');
  var confirmNo = $('#confirmNo');

  function openConfirm(venue) {
    confirmEmoji.textContent = venue.emoji;
    confirmText.textContent = '«' + venue.name + '» — ' + venue.note + '.';
    confirmModal.hidden = false;
    confirmModal.dataset.venue = venue.name;
    confirmYes.focus();
  }

  function closeConfirm() {
    confirmModal.hidden = true;
    delete confirmModal.dataset.venue;
  }

  confirmYes.addEventListener('click', function () {
    var name = confirmModal.dataset.venue;
    var venue = VENUES.filter(function (item) { return item.name === name; })[0];
    if (!venue) return;
    state.venue = venue;
    closeConfirm();
    openWhen();
  });

  confirmNo.addEventListener('click', closeConfirm);

  confirmModal.addEventListener('click', function (event) {
    if (event.target === confirmModal) closeConfirm();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !confirmModal.hidden) closeConfirm();
  });

  /* ---------------------------------------------------- дата/время (шаг 4) */

  var dateChips = $('#dateChips');
  var timeChips = $('#timeChips');
  var sendBtn = $('#sendBtn');
  var sendStatus = $('#sendStatus');
  var customBlock = $('#customBlock');
  var customToggle = $('#customToggle');
  var customFields = $('#customFields');
  var customTitle = $('#customTitle');
  var customSub = $('#customSub');
  var customDateInput = $('#customDate');
  var customTimeInput = $('#customTime');

  var todayIso = schedule.iso(new Date());
  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 180);
  customDateInput.min = todayIso;
  customDateInput.max = schedule.iso(maxDate);

  function renderDateChips() {
    dateChips.textContent = '';
    var days = schedule.upcoming(new Date(), cfg.schedule, cfg.schedule.count);
    if (!days.length) {
      var note = document.createElement('p');
      note.className = 'status';
      note.textContent = 'Не смог посчитать дни — выбери свой вариант ниже.';
      dateChips.appendChild(note);
      return;
    }
    days.forEach(function (day) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = day.label;
      chip.setAttribute('aria-pressed', 'false');
      chip.dataset.iso = day.iso;
      chip.dataset.label = day.label;
      chip.addEventListener('click', function () {
        var already = chip.getAttribute('aria-pressed') === 'true';
        $$('.chip', dateChips).forEach(function (item) { item.setAttribute('aria-pressed', 'false'); });
        if (already) {
          state.date = null;
        } else {
          chip.setAttribute('aria-pressed', 'true');
          state.date = { iso: day.iso, label: day.label };
          state.customDate = '';
          customDateInput.value = '';
          if (!customFields.hidden) setCustomOpen(false);
        }
        refreshSendState();
      });
      dateChips.appendChild(chip);
    });
  }

  function renderTimeChips() {
    timeChips.textContent = '';
    (cfg.schedule.times || []).forEach(function (time) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = time;
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', function () {
        var already = chip.getAttribute('aria-pressed') === 'true';
        $$('.chip', timeChips).forEach(function (item) { item.setAttribute('aria-pressed', 'false'); });
        if (already) {
          state.time = null;
        } else {
          chip.setAttribute('aria-pressed', 'true');
          state.time = time;
          state.customTime = '';
          customTimeInput.value = '';
          if (!customFields.hidden) setCustomOpen(false);
        }
        refreshSendState();
      });
      timeChips.appendChild(chip);
    });
  }

  customDateInput.addEventListener('input', function () {
    state.customDate = customDateInput.value;
    if (state.customDate) {
      state.date = null;
      $$('.chip', dateChips).forEach(function (item) { item.setAttribute('aria-pressed', 'false'); });
    }
    refreshSendState();
  });

  customTimeInput.addEventListener('input', function () {
    state.customTime = customTimeInput.value;
    if (state.customTime) {
      state.time = null;
      $$('.chip', timeChips).forEach(function (item) { item.setAttribute('aria-pressed', 'false'); });
    }
    refreshSendState();
  });

  function setCustomOpen(open) {
    customToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    customFields.hidden = !open;
    customBlock.classList.toggle('is-open', open);
    customTitle.textContent = open ? 'Свои дата и время' : 'Не подходит ни один день?';
    customSub.textContent = open
      ? 'Выбери оба поля — и жми «Отправить ответ»'
      : 'Нажми, чтобы выбрать свои дату и время';

    if (open) {
      setTimeout(function () {
        customFields.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'nearest' });
      }, 120);
    }
  }

  customToggle.addEventListener('click', function () {
    setCustomOpen(customToggle.getAttribute('aria-expanded') !== 'true');
  });

  function effectiveDate() {
    if (state.date) return state.date;
    if (!state.customDate) return null;
    var parts = state.customDate.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    return { iso: state.customDate, label: schedule.format(date) };
  }

  function effectiveTime() {
    return state.time || state.customTime || null;
  }

  function refreshSendState() {
    var date = effectiveDate();
    var time = effectiveTime();
    var ready = Boolean(date && time && state.venue);

    sendBtn.disabled = !ready;
    sendStatus.classList.remove('is-error');
    customBlock.classList.toggle('has-value', Boolean(state.customDate || state.customTime));

    if (ready) {
      sendStatus.textContent = '';
    } else if (state.customDate && !state.customTime) {
      sendStatus.textContent = 'Осталось выбрать время';
    } else if (!state.customDate && state.customTime) {
      sendStatus.textContent = 'Осталось выбрать дату';
    } else {
      sendStatus.textContent = 'Выбери день и время — и можно отправлять 💌';
    }
  }

  function openWhen() {
    if (!dateChips.children.length) renderDateChips();
    if (!timeChips.children.length) renderTimeChips();
    refreshSendState();
    show('screen-when');
  }

  /* ------------------------------------------------------------ отправка */

  function buildSummary(payload) {
    return {
      venue: payload.venue,
      dateLabel: payload.dateLabel,
      time: payload.time
    };
  }

  function showDone(payload) {
    $('#summary').innerHTML = '';
    var title = document.createElement('strong');
    title.textContent = payload.venue;
    var when = document.createElement('span');
    when.textContent = payload.dateLabel + ' · ' + payload.time;
    var label = document.createElement('small');
    label.textContent = 'твой выбор';
    $('#summary').append(label, title, when);
    show('screen-done');
    burstConfetti();
  }

  function burstConfetti() {
    if (REDUCED) return;
    var box = $('#confetti');
    var emojis = ['💗', '💖', '🎀', '✨', '🌸', '🩷'];
    box.textContent = '';
    for (var i = 0; i < 22; i++) {
      var piece = document.createElement('i');
      piece.textContent = emojis[i % emojis.length];
      piece.style.setProperty('--x', (Math.random() * 100).toFixed(2) + '%');
      piece.style.setProperty('--size', (12 + Math.random() * 10).toFixed(0) + 'px');
      piece.style.setProperty('--dur', (2.1 + Math.random() * 1.6).toFixed(2) + 's');
      piece.style.setProperty('--delay', (Math.random() * 0.7).toFixed(2) + 's');
      box.appendChild(piece);
    }
    setTimeout(function () { box.textContent = ''; }, 4600);
  }

  async function sendAnswer() {
    var date = effectiveDate();
    var time = effectiveTime();
    if (!state.venue || !date || !time) {
      sendStatus.textContent = 'Выбери, пожалуйста, день и время 💗';
      sendStatus.classList.add('is-error');
      return;
    }

    var payload = {
      secret: cfg.secret || '',
      name: NAME,
      venue: state.venue.name,
      venueNote: state.venue.note,
      date: date.iso,
      dateLabel: date.label,
      time: time,
      sentAt: new Date().toISOString(),
      id: uid(),
      honeypot: ''
    };

    sendBtn.disabled = true;
    sendStatus.classList.remove('is-error');
    sendStatus.textContent = 'Отправляю...';

    try {
      if (cfg.testMode || !cfg.sendUrl) {
        console.log('[тестовый режим] ответ не отправлен:', payload);
        await sleep(650);
      } else {
        await fetch(cfg.sendUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
      }

      localStorage.removeItem(PENDING_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSummary(payload)));
      sendStatus.textContent = '';
      showDone(payload);
    } catch (error) {
      console.error(error);
      localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
      sendStatus.textContent = 'Не получилось отправить 😔 Проверь интернет и нажми ещё раз.';
      sendStatus.classList.add('is-error');
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener('click', sendAnswer);

  $('#changeBtn').addEventListener('click', function () {
    localStorage.removeItem(STORAGE_KEY);
    sendStatus.textContent = '';
    state.venue = null;
    openWhenAfterChange();
  });

  function openWhenAfterChange() {
    show('screen-venues');
  }

  /* ------------------------------------------------- восстановление ответа */

  function restoreAnswer() {
    var saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (error) {
      saved = null;
    }
    if (!saved) return false;
    showDone(saved);
    return true;
  }

  function retryPending() {
    if (!cfg.sendUrl || cfg.testMode) return;
    var pending = localStorage.getItem(PENDING_KEY);
    if (!pending) return;
    try {
      var payload = JSON.parse(pending);
      fetch(cfg.sendUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).then(function () {
        localStorage.removeItem(PENDING_KEY);
      }).catch(function () {});
    } catch (error) {
      localStorage.removeItem(PENDING_KEY);
    }
  }

  /* --------------------------------------------------------- украшательства */

  function initSparkles() {
    if (REDUCED) return;
    var layer = $('#sparkles');
    var chars = ['✨', '💗', '⭐', '🌸', '🩷'];
    var last = 0;

    function spawn(x, y) {
      if (layer.childElementCount > 14) return;
      var sparkle = document.createElement('span');
      sparkle.className = 'sparkle';
      sparkle.textContent = chars[Math.floor(Math.random() * chars.length)];
      sparkle.style.left = x + 'px';
      sparkle.style.top = y + 'px';
      sparkle.style.fontSize = (10 + Math.random() * 10).toFixed(0) + 'px';
      layer.appendChild(sparkle);
      sparkle.addEventListener('animationend', function () { sparkle.remove(); });
    }

    document.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse') return;
      var now = Date.now();
      if (now - last < 70) return;
      last = now;
      spawn(event.clientX, event.clientY);
    }, { passive: true });

    document.addEventListener('pointerdown', function (event) {
      spawn(event.clientX, event.clientY);
    }, { passive: true });
  }

  function initHearts() {
    if (REDUCED) return;
    var canvas = $('#hearts');
    var context = canvas.getContext('2d');
    if (!context) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;
    var hearts = [];

    function heartPath(ctx, x, y, size) {
      ctx.beginPath();
      ctx.moveTo(x, y + size * 0.3);
      ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
      ctx.bezierCurveTo(x - size * 0.5, y + size * 0.7, x, y + size, x, y + size * 1.15);
      ctx.bezierCurveTo(x, y + size, x + size * 0.5, y + size * 0.7, x + size * 0.5, y + size * 0.3);
      ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
      ctx.fill();
    }

    function makeHeart(seeded) {
      return {
        x: Math.random() * width,
        y: seeded ? Math.random() * height : height + 20,
        size: 5 + Math.random() * 9,
        speed: 0.16 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        sway: 8 + Math.random() * 18,
        swaySpeed: 0.006 + Math.random() * 0.012,
        alpha: 0.16 + Math.random() * 0.3,
        color: ['#FF9CC4', '#FFB3D1', '#F4568F', '#FFC2D8'][Math.floor(Math.random() * 4)]
      };
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    for (var i = 0; i < 18; i++) hearts.push(makeHeart(true));

    var lastFrame = 0;
    function frame(now) {
      if (now - lastFrame > 26) {
        lastFrame = now;
        context.clearRect(0, 0, width, height);
        hearts.forEach(function (heart, index) {
          heart.y -= heart.speed;
          heart.phase += heart.swaySpeed;
          var x = heart.x + Math.sin(heart.phase) * heart.sway;

          if (heart.y < -40) hearts[index] = makeHeart(false);

          context.globalAlpha = heart.alpha;
          context.fillStyle = heart.color;
          heartPath(context, x, heart.y, heart.size);
        });
        context.globalAlpha = 1;
      }
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
    window.addEventListener('resize', resize);
  }

  /* ---------------------------------------------------------------- старт */

  renderVenues();
  initSparkles();
  initHearts();
  retryPending();

  if (!restoreAnswer()) {
    show('screen-hello');
  }
})();
