# файлы обновления

исходная версия: `ad3d884240ca3c08514ba65f605ab91e284b1537`. удалённых исходных файлов нет.

## изменены

- `index.html` — новые разделы, навигация, профиль, CSP и подключение модулей.
- `app.js` — узкий мост к безопасной оболочке; исходные функции сохранены.
- `assets/sources.json` — источники дополнительных логотипов.

## созданы

- `.gitignore`
- `.nojekyll`
- `README.md`
- `assets/gnome.svg`
- `assets/hyprland.svg`
- `assets/i3.svg`
- `assets/kdeplasma.svg`
- `assets/manjaro.svg`
- `assets/sway.svg`
- `assets/xfce.svg`
- `config.js`
- `docs/CHANGES.md`
- `docs/DEPLOY.md`
- `docs/SECURITY.md`
- `docs/SUPABASE.md`
- `docs/TESTING.md`
- `package-lock.json`
- `package.json`
- `scripts/catalog.mjs`
- `scripts/check.mjs`
- `scripts/integrate.mjs`
- `scripts/package-source.py`
- `supabase/config.toml`
- `supabase/functions/delete-account/handler.mjs`
- `supabase/functions/delete-account/index.ts`
- `supabase/schema.sql`
- `tests/backend.test.mjs`
- `tests/database.test.mjs`
- `tests/delete-account.test.mjs`
- `tests/fixtures/legacy-contract.json`
- `tests/logic.test.mjs`
- `tests/regression.test.mjs`
- `v2/academy-data.js`
- `v2/academy-ui.js`
- `v2/backend.js`
- `v2/commands.js`
- `v2/community-data.js`
- `v2/community-ui.js`
- `v2/core.js`
- `v2/generator-ui.js`
- `v2/platform.css`
- `v2/platform.js`
- `v2/profile-ui.js`
- `v2/sections.html`
- `v2/simulator.js`
- `vendor/README.md`
- `vendor/supabase-2.119.2.js`
- `vendor/supabase-LICENSE.txt`

`style.css`, `data.js` и все исходные ассеты сохранены без изменения; это проверяется SHA-256 в regression-тесте. по просьбе автора добавлена GPL-3.0-or-later: LICENSE, NOTICE, поле license в package.json, уведомление в подвале и описание в README. лицензии сторонних компонентов сохранены.

## название вкладки и Linux-приколюхи

- `index.html`, `scripts/integrate.mjs` — точный title, кнопка поиска, лаборатория и подключение модулей.
- `v2/playground-data.js` — права доступа, даты, шутки и ASCII-поезд.
- `v2/playground-ui.js`, `v2/playground.css`, `v2/playground.html` — быстрый поиск, калькулятор, задание дня и поезд.
- `v2/sections.html` — карточка ежедневного урока.
- `v2/simulator.js`, `v2/platform.js`, `app.js` — новые команды, отмена анимации и автодополнение.
- `scripts/catalog.mjs`, `tests/playground.test.mjs` — подключение модели и проверки.
- `README.md`, `docs/TESTING.md` — описание обновления и результаты проверки.

схема Supabase и правила начисления XP не изменены. GPL-3.0-or-later и сторонние лицензии сохранены.


## Share, живой backend и настройки

созданы `share/index.html`, `bootstrap.js`, `model.js`, `app.js`, `style.css`; `v2/progress.js`, `share-context.js`, `settings.js`, `settings.css`, `english.js`, `english-content.js`, `english-academy.js`; две SQL-миграции, `delete-account/cleanup.mjs`, тесты Share/настроек и инструкции. обновлены навигация, callback Auth из подпапки, профиль с ID, начальная конфигурация, общая Academy, упаковка и README.

сохранены исходный CSS, данные, ассеты и GPLv3+. GitHub API не разрешил запись (403); сам репозиторий требует ручной загрузки.

## язык симулятора терминала

добавлены `v2/terminal-i18n.js` и `tests/terminal-i18n.test.mjs`; обновлены `v2/simulator.js`, `platform.js`, `academy-ui.js`, `english.js`, `scripts/integrate.mjs`, `index.html`. язык выводов меняется общей кнопкой RU/EN или в настройках, история сохраняется. введённые команды и пользовательские данные остаются буквальными; исходные ответы проверок не изменяются.
