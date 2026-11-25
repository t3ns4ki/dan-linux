/* Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
(function (root) {
  'use strict';
  const app = root.DanV2, $ = app.$, h = app.escape;
  const groups = ['владелец', 'группа', 'остальные'];
  const cached = app.store.read('dan-permissions-v1', {});
  let mode = /^[0-7]{3}$/.test(cached.mode) ? cached.mode : '644';
  let filename = typeof cached.filename === 'string' ? cached.filename : 'notes.txt';
  try { app.permissionCommand(mode, filename); } catch { filename = 'notes.txt'; }
  $('#permission-grid').innerHTML = groups.map((name, index) => `<fieldset><legend>${name}</legend>${app.permissionBits.map(([bit, letter, word]) => `<label><input type="checkbox" data-permission-group="${index}" data-permission-bit="${bit}" aria-label="${name}: ${word}"><code>${letter}</code><span>${word}</span></label>`).join('')}</fieldset>`).join('');
  $('#permission-mode').value = mode;
  $('#permission-file').value = filename;
  let command = '';
  function permissionStatus(text, error = false) {
    $('#permission-status').textContent = text;
    $('#permission-status').classList.toggle('error', error);
  }
  function renderPermission() {
    const parsed = app.permissionMode(mode);
    app.$$('[data-permission-bit]').forEach(input => { input.checked = !!(parsed[Number(input.dataset.permissionGroup)].value & Number(input.dataset.permissionBit)); });
    $('#permission-symbolic').textContent = '-' + parsed.map(group => group.symbolic).join('');
    $('#permission-preview-file').textContent = filename || 'имя файла';
    $('#permission-explanation').innerHTML = parsed.map((group, index) => `<dt>${groups[index]} · ${group.value}</dt><dd>${group.rights.length ? group.rights.join(', ') : 'нет разрешений'}</dd>`).join('');
    app.$$('[data-permission-preset]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.permissionPreset === mode)));
    $('#permission-warning').hidden = !(Number(mode[2]) & 2);
    $('#permission-warning').textContent = 'остальные пользователи могут изменять этот файл. выбирай такие права осознанно; 777 также разрешает всем читать и выполнять его.';
    try {
      command = app.permissionCommand(mode, filename);
      $('#permission-command').textContent = command;
      $('#permission-file').setAttribute('aria-invalid', 'false');
      $('#permission-copy').disabled = false;
      $('#permission-terminal').disabled = false;
      permissionStatus('команда только подготовлена; настоящие файлы не меняются.');
      app.store.write('dan-permissions-v1', { mode, filename });
    } catch (error) {
      command = '';
      $('#permission-command').textContent = 'проверь имя файла';
      $('#permission-file').setAttribute('aria-invalid', 'true');
      $('#permission-copy').disabled = true;
      $('#permission-terminal').disabled = true;
      permissionStatus(error.message, true);
    }
  }
  $('#permission-grid').onchange = () => {
    mode = groups.map((_, index) => app.$$(`[data-permission-group="${index}"]:checked`).reduce((value, input) => value + Number(input.dataset.permissionBit), 0)).join('');
    $('#permission-mode').value = mode;
    $('#permission-mode').setAttribute('aria-invalid', 'false');
    renderPermission();
  };
  $('.fun-presets').onclick = event => {
    const button = event.target.closest('[data-permission-preset]');
    if (!button) return;
    mode = button.dataset.permissionPreset;
    $('#permission-mode').value = mode;
    $('#permission-mode').setAttribute('aria-invalid', 'false');
    renderPermission();
  };
  $('#permission-mode').oninput = () => {
    const value = $('#permission-mode').value;
    try { app.permissionMode(value); } catch (error) {
      $('#permission-mode').setAttribute('aria-invalid', 'true');
      command = ''; $('#permission-command').textContent = 'проверь числовой режим';
      $('#permission-copy').disabled = true; $('#permission-terminal').disabled = true;
      permissionStatus(error.message, true); return;
    }
    mode = value; $('#permission-mode').setAttribute('aria-invalid', 'false'); renderPermission();
  };
  $('#permission-file').oninput = () => { filename = $('#permission-file').value; if (!/^[0-7]{3}$/.test($('#permission-mode').value)) return; renderPermission(); };
  $('#permission-copy').onclick = async () => {
    if (!command) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(command);
      else {
        const field = document.createElement('textarea'); field.value = command; document.body.append(field); field.select();
        const copied = document.execCommand('copy'); field.remove(); if (!copied) throw new Error();
      }
      permissionStatus('команда скопирована.');
    } catch {
      const range = document.createRange(); range.selectNodeContents($('#permission-command'));
      const selection = root.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      permissionStatus('текст выделен — браузер не разрешил копирование. скопируй вручную.');
    }
  };
  function terminalFocus(value, run = false) {
    $('#terminal').scrollIntoView({ block: 'start' });
    if (run) root.DanLegacy.runCommand(value);
    else $('#terminal-input').value = value;
    $('#terminal-input').focus({ preventScroll: true });
  }
  $('#permission-terminal').onclick = () => { if (command) terminalFocus(command); };
  app.$$('[data-fun-command]').forEach(button => { button.onclick = () => terminalFocus(button.dataset.funCommand, true); });
  renderPermission();

  // The daily lesson is deterministic. Only the existing Academy can award XP.
  let daily;
  function renderDaily() {
    daily = app.dailyLesson(app.localDay());
    const completed = new Set(app.progress.summary().completed);
    const done = completed.has(daily.id);
    let next = daily;
    while (next.prerequisite && !completed.has(next.prerequisite)) next = app.lessons.find(item => item.id === next.prerequisite);
    $('#daily-date').textContent = new Date().toLocaleDateString(app.i18n?.language||'ru', { day: 'numeric', month: 'long' });
    $('#daily-title').textContent = daily.title;
    $('#daily-course').textContent = app.courses.find(course => course.id === daily.course).title;
    $('#daily-progress').textContent = done ? 'этот урок уже пройден ✓' : next.id === daily.id ? 'практика + мини-тест · обычные XP урока' : 'сначала: «' + next.title + '». поможем пройти путь по порядку.';
    $('#daily-open').textContent = done ? 'повторить урок' : next.id === daily.id ? 'пройти задание' : 'начать с нужной основы';
    $('#daily-open').dataset.lesson = done ? daily.id : next.id;
    $('#daily-card').classList.toggle('complete', done);
  }
  $('#daily-open').onclick = () => app.academy.selectLesson($('#daily-open').dataset.lesson, true);
  root.addEventListener('dan:progress', renderDaily);
  root.addEventListener('dan-language-changed', renderDaily);
  let day = app.localDay();
  const dayTimer = setInterval(() => { if (!document.hidden && app.localDay() !== day) { day = app.localDay(); renderDaily(); } }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { day = app.localDay(); renderDaily(); } });
  root.addEventListener('pagehide', () => clearInterval(dayTimer));
  renderDaily();

  // Lightweight command palette: static local data, no network or tracking.
  const dialog = $('#quick-dialog'), input = $('#quick-input'), results = $('#quick-results');
  const sectionNames = [['home','главная'],['academy','Linux Academy'],['playground','Linux-лаборатория · права доступа'],['commands','генератор команд пакетов'],['community','голосование сообщества'],['distros','каталог дистрибутивов'],['alternatives','Open Source альтернативы'],['quiz','подобрать дистрибутив'],['top','топ Дана'],['terminal','терминал'],['opensource','что такое Open Source'],['compare','Linux vs Windows'],['myths','мифы о Linux']];
  const entries = sectionNames.map(([id, title]) => ({ title, kind: 'раздел', keywords: id + ' разделы навигация', run: () => { const section = $('#' + id); section.scrollIntoView({ block: 'start' }); const heading = section.querySelector('h1,h2'); if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); } } }));
  const aliases = { arch:'арч',gentoo:'генту дженту',void:'войд',ubuntu:'убунту',debian:'дебиан',mint:'минт',zorin:'зорин',omarchy:'омарчи' };
  for (const distro of distros) entries.push({ title: distro.name, kind: 'дистрибутив', keywords: 'дистро ' + (aliases[distro.id] || ''), run: () => root.DanLegacy.openDistro(distro.id) });
  for (const lesson of app.lessons) entries.push({ title: lesson.title, kind: 'урок · ' + app.courses.find(course => course.id === lesson.course).title, keywords: 'academy урок ' + lesson.id, run: () => app.academy.selectLesson(lesson.id, true) });
  entries.push({ title:'сменить светлую / тёмную тему', kind:'действие', keywords:'цвет theme light dark', run:() => $('#theme').click() });
  for (const name of ['fastfetch','sl','fortune']) entries.push({ title:name, kind:'команда симулятора', keywords:'терминал команда tux поезд шутка', run:() => terminalFocus(name, true) });
  let visible = [], selected = 0, trigger = null, destinationAction = null;
  const normalize = value => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  function renderResults() {
    const terms = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    visible = entries.filter(entry => terms.every(term => normalize(entry.title + ' ' + entry.kind + ' ' + entry.keywords + ' ' + (app.i18n?.t(entry.title)||'') + ' ' + (app.i18n?.t(entry.kind)||'')).includes(term))).slice(0, 12);
    selected = 0;
    results.innerHTML = visible.length ? visible.map((entry, index) => `<button type="button" role="option" tabindex="-1" id="quick-result-${index}" data-quick-index="${index}" aria-selected="${index === selected}"><span>${h(entry.title)}</span><small>${h(entry.kind)}</small></button>`).join('') : '<p class="fun-quick-empty">ничего не найдено. попробуй «Arch», «права» или «терминал».</p>';
    $('#quick-count').textContent = visible.length ? 'показано ' + visible.length + ' · ↑ ↓ выбрать · Enter открыть' : 'нет совпадений';
    if (visible.length) input.setAttribute('aria-activedescendant', 'quick-result-0'); else input.removeAttribute('aria-activedescendant');
  }
  function selectResult(index) {
    selected = (index + visible.length) % visible.length;
    app.$$('[data-quick-index]', results).forEach((button, current) => button.setAttribute('aria-selected', String(current === selected)));
    input.setAttribute('aria-activedescendant', 'quick-result-' + selected);
    $('#quick-result-' + selected).scrollIntoView({ block: 'nearest' });
  }
  function openQuick() {
    if (dialog.open) { dialog.close(); return; }
    trigger = document.activeElement; destinationAction = null;
    for (const other of app.$$('dialog[open]')) other.close();
    $('#navigation').classList.remove('open'); $('#menu').setAttribute('aria-expanded','false'); $('#menu').setAttribute('aria-label','открыть меню');
    input.value = ''; renderResults(); dialog.showModal(); input.setAttribute('aria-expanded','true'); input.focus();
    setTimeout(() => { if (dialog.open) input.focus(); }, 0);
  }
  function choose(index) {
    if (!visible[index]) return;
    destinationAction = visible[index].run;
    dialog.close();
  }
  dialog.addEventListener('close', () => {
    input.setAttribute('aria-expanded','false');
    const action = destinationAction; destinationAction = null;
    if (action) action(); else if (trigger?.isConnected) trigger.focus({ preventScroll:true });
  });
  $('#quick-open').onclick = openQuick;
  $('#quick-close').onclick = () => dialog.close();
  input.oninput = renderResults;
  input.onkeydown = event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (visible.length) selectResult(selected + (event.key === 'ArrowDown' ? 1 : -1)); }
    if (event.key === 'Enter') { event.preventDefault(); choose(selected); }
  };
  results.onclick = event => { const button = event.target.closest('[data-quick-index]'); if (button) choose(Number(button.dataset.quickIndex)); };
  dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); });
  document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.isComposing && (event.code === 'KeyK' || event.key.toLowerCase() === 'k')) { event.preventDefault(); openQuick(); } });

  let train = null;
  function stopTrain() {
    if (!train) return;
    train.pre.classList.remove('running'); train.button?.remove(); train = null;
  }
  function showTrain() {
    stopTrain(); app.shellUI.stopAnimation();
    const figure = document.createElement('div'); figure.className = 'fun-train';
    const label = document.createElement('span'); label.className = 'v2-chocolate-label'; label.textContent = 'Tux Express · sl — не ls';
    const track = document.createElement('div'); track.className = 'fun-train-track';
    const pre = document.createElement('pre'); pre.className = 'fun-train-art'; pre.textContent = app.trainArt; pre.setAttribute('aria-hidden','true');
    const accessible = document.createElement('span'); accessible.className = 'v2-sr-only'; accessible.textContent = 'ASCII-поезд Tux Express проезжает по терминалу.';
    const button = document.createElement('button'); button.type = 'button';
    track.append(pre); figure.append(label, accessible, track, button); root.DanLegacy.output.append(figure);
    const media = matchMedia('(prefers-reduced-motion: reduce)'); let finished = false, paused = false;
    function replay() {
      pre.classList.remove('running'); void pre.offsetWidth;
      pre.style.setProperty('--train-distance', ((track.clientWidth + pre.scrollWidth) / 2 + 20) + 'px');
      pre.style.animationPlayState = 'running'; pre.classList.add('running'); finished = false; paused = false; button.textContent = 'пауза'; button.setAttribute('aria-pressed','false');
    }
    if (media.matches) {
      label.textContent += ' · движение отключено настройкой системы'; button.textContent = 'закрыть поезд'; button.onclick = () => { stopTrain(); figure.remove(); };
    } else {
      button.onclick = () => { if (finished) { replay(); return; } paused = !paused; pre.style.animationPlayState = paused ? 'paused' : 'running'; button.textContent = paused ? 'продолжить' : 'пауза'; button.setAttribute('aria-pressed', String(paused)); };
      pre.addEventListener('animationend', () => { if (train?.pre !== pre) return; pre.classList.remove('running'); finished = true; button.textContent = 'ещё поезд'; button.setAttribute('aria-pressed','false'); });
      replay();
    }
    train = { pre, button };
    root.DanLegacy.output.scrollTop = root.DanLegacy.output.scrollHeight;
  }
  root.addEventListener('dan:command', event => {
    const special = event.detail.result.special;
    if (special === 'train') showTrain();
    else if (special === 'clear' || special === 'chocolate') stopTrain();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopTrain(); });
  root.addEventListener('pagehide', stopTrain);
})(globalThis);
