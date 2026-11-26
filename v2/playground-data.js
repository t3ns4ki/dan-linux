/* Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
(function (root) {
  'use strict';
  const app = root.DanV2;
  const bits = [[4, 'r', 'читать'], [2, 'w', 'изменять'], [1, 'x', 'выполнять']];
  app.permissionBits = bits;
  app.permissionMode = function (mode) {
    if (!/^[0-7]{3}$/.test(String(mode))) throw new Error('нужны три цифры от 0 до 7, например 644.');
    return [...String(mode)].map(digit => ({
      value: Number(digit),
      symbolic: bits.map(([bit, letter]) => Number(digit) & bit ? letter : '-').join(''),
      rights: bits.filter(([bit]) => Number(digit) & bit).map(([, , name]) => name)
    }));
  };
  app.permissionCommand = function (mode, filename) {
    app.permissionMode(mode);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(String(filename))) {
      throw new Error('одно имя файла латиницей: буквы, цифры, точка, дефис и _. без пробелов и команд.');
    }
    return 'chmod ' + mode + ' ' + filename;
  };
  app.localDay = function (date = new Date()) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  };
  app.dailyLesson = function (day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('некорректная дата.');
    const date = new Date(day + 'T00:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) throw new Error('некорректная дата.');
    const ordinal = Math.floor(date.getTime() / 86400000);
    return app.lessons[((ordinal % app.lessons.length) + app.lessons.length) % app.lessons.length];
  };
  app.fortunes = [
    'сначала резервная копия. потом «а что делает эта кнопка?»',
    'i use arch btw. даже печенька уже в курсе.',
    'I compiled my compiler to compile a compiler. теперь можно попить чай.',
    'свобода — это когда цвет курсора выбираешь ты.',
    'сегодня хороший день, чтобы понять одну команду, а не скопировать сто.',
    'шоколадная трапеция успешно скомпилирована. зависимости: какао и любопытство.',
    'необязательно менять дистрибутив. иногда достаточно выспаться.',
    'твои обои прекрасны. теперь можно наконец открыть браузер.',
    'sudo не делает команду правильнее. только влиятельнее.',
    'в терминале тихо. это Tux думает над следующим приколом.',
    'rolling release: мой рабочий стол обновился раньше, чем я сделал домашку.',
    'читай, пробуй, задавай вопросы. знание Linux не выдаётся вместе с бородой.'
  ];
  app.trainArt = [
    '          (  )   (   )   (  )',
    '        (    ) (    )  (   )',
    '          O     O      O',
    '          |     |      |',
    '      ____|_____|______|__',
    '  ___/  TUX EXPRESS      |____',
    ' |__|____________________|___ |',
    '   O==O==O==O==O      O==O==O'
  ].join('\n');
})(globalThis);
