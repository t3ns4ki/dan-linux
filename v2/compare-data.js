/* Evidence-based comparisons with links to project documentation.
   Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
(function(app){
 'use strict';
 const rows=[
 ['оперативная память','база','выбираешь окружение и фоновые службы: минимальную систему можно сделать легче под свои задачи.','расход зависит от версии, автозагрузки, приложений и кэша; фиксированных «6 ГБ для всех» нет.','преимущество Linux — контроль над составом системы. расход Arch + GNOME нужно измерять отдельно; требования к RAM не равны её использованию.'],
 ['производительность','база','можно убрать ненужные компоненты и оставить ресурсы нужной работе.','отдельные игры и профессиональные приложения могут работать лучше в своей родной Windows-среде.','меньше фоновых задач — полезная возможность настройки Linux, но победитель в скорости определяется конкретной нагрузкой, драйвером и железом.'],
 ['кастомизация','свобода','можно заменить весь рабочий стол, оконный менеджер, службы и ядро — система под твои правила.','есть темы и сторонние инструменты настройки, но исходный код основной системы закрыт.','сильная сторона Linux — выбор компонентов, а не только обоев. в Arch минимальная база собирается пользователем; это требует времени и знаний.'],
 ['приватность','свобода','можно выбирать дистрибутив, службы и программы под свои требования к приватности.','Microsoft документирует обязательные и необязательные диагностические данные Windows.','контроль над сервисами и доступность открытого кода помогают проверять систему. Linux не отключает автоматически телеметрию браузеров и других приложений.'],
 ['исходный код','свобода','ядро и многие системные компоненты можно изучать, изменять и распространять по их лицензиям.','основной код Windows закрыт; отдельные инструменты и компоненты открыты.','это реальное преимущество свободного ПО: проверка и модификация доступны независимо от поставщика. открытость сама по себе не доказывает безопасность.'],
 ['обновления','база','пакетный менеджер обновляет систему и программы из настроенных репозиториев; есть выбор модели выпусков.','Windows Update обновляет ОС; для приложений есть Store, WinGet и собственные механизмы.','Linux удобен единым управлением пакетами и зависимостями. у Windows тоже есть пакетный менеджер; ни одна система не обходится без обслуживания и перезагрузок.'],
 ['стоимость','база','Arch и многие другие дистрибутивы можно использовать без покупки лицензии на каждый компьютер.','лицензия Windows обычно покупается отдельно или уже входит в цену устройства.','для Linux не обязательно платить за ОС. коммерческая поддержка, хостинг и отдельные редакции могут стоить денег.'],
 ['старые компьютеры','база','можно подобрать лёгкое окружение и меньше фоновых служб — больше ресурсов приложениям.','Windows 11 требует совместимый процессор, от 4 ГБ RAM, UEFI с поддержкой Secure Boot и TPM 2.0.','Linux даёт больше вариантов для старого ПК, но нужно проверить архитектуру и драйверы. GNOME не превращается в лёгкое окружение только потому, что установлен на Arch.'],
 ['программирование','работа','родные Unix-инструменты, репозитории и привычная среда для многих серверных задач.','Visual Studio, .NET и WSL тоже предоставляют сильные средства разработки.','Linux особенно удобен, когда целевая серверная среда тоже Linux. для Windows-специфичного ПО выбор может быть другим.'],
 ['игры','игры','можно играть в совместимые нативные игры и многие Windows-игры через Proton.','обычно шире совместимость с Windows-играми и их античитами.','играть без перехода на Windows — плюс Linux для совместимой библиотеки. это не обещание большего FPS или работы любого античита.'],
 ['совместимость программ','работа','много открытых приложений; Wine помогает с частью Windows-программ.','родная платформа для ряда Adobe-приложений, CAD и корпоративных инструментов.','Linux даёт выбор открытых инструментов, но нужные форматы, плагины и функции надо проверять. альтернативы не обязаны быть полной копией.'],
 ['свобода пользователя','свобода','можно изучать, менять и передавать свободные компоненты на условиях их лицензий.','возможности использования и изменения определяются лицензией поставщика.','свобода — преимущество даже для тех, кто не пишет код: можно сменить сборку, разработчика или способ использования.'],
 ['системные требования','база','можно выбрать минимальную базу или готовый рабочий стол под конкретное железо.','официальный минимум Windows 11: 4 ГБ RAM; это требование к установленной памяти, не замер расхода.','у Linux нет одного требования к RAM для всех систем. базовый Arch, Arch + GNOME и Mint Xfce — разные конфигурации; сравнивай готовые рабочие места.']
 ];
 const en=[
 ['RAM','choose your desktop and background services: a minimal system can be made lighter for your tasks.','usage depends on version, startup programs, apps and caches; there is no fixed “6 GB for everyone”.','Linux’s advantage is control over the system’s components. measure Arch + GNOME separately; RAM requirements are not RAM usage.'],
 ['performance','remove unwanted components and leave resources for your work.','some games and professional applications can work better in their native Windows environment.','fewer background tasks are a useful Linux customization option, but performance depends on the workload, driver and hardware.'],
 ['customization','replace the whole desktop, window manager, services and kernel — your system, your rules.','themes and third-party customization tools exist, but the main system source is closed.','Linux lets you choose components, not just wallpaper. users assemble Arch from a minimal base; this takes time and knowledge.'],
 ['privacy','choose a distribution, services and applications to meet your privacy needs.','Microsoft documents required and optional Windows diagnostic data.','service control and open code help inspection. Linux does not automatically disable telemetry in browsers and other apps.'],
 ['source code','study, modify and redistribute the kernel and many system components under their licenses.','the main Windows code is closed; some tools and components are open.','a real free-software benefit: inspection and modification independent of the vendor. openness alone does not prove security.'],
 ['updates','the package manager updates the system and programs from configured repositories; release models are a choice.','Windows Update updates the OS; apps also use the Store, WinGet and their own updaters.','Linux offers integrated package and dependency management. Windows also has a package manager; both systems require maintenance and reboots.'],
 ['cost','Arch and many other distributions require no per-computer license purchase.','a Windows license is usually purchased separately or included in the device price.','you do not have to pay for a Linux OS. commercial support, hosting and some editions may cost money.'],
 ['older computers','choose a light desktop and fewer background services to leave more resources for apps.','Windows 11 requires a supported CPU, at least 4 GB RAM, Secure Boot-capable UEFI and TPM 2.0.','Linux offers more options for older PCs, but check architecture and drivers. GNOME does not become a light desktop just because it runs on Arch.'],
 ['programming','native Unix tools, repositories and a familiar environment for many server tasks.','Visual Studio, .NET and WSL also provide strong development tools.','Linux is particularly convenient when the target server environment is Linux too. Windows-specific software may call for another choice.'],
 ['gaming','play compatible native games and many Windows games through Proton.','usually broader compatibility with Windows games and their anti-cheat systems.','playing a compatible library without switching to Windows is a Linux benefit. it does not guarantee higher FPS or support for every anti-cheat.'],
 ['application compatibility','many open applications; Wine helps with some Windows programs.','the native platform for certain Adobe, CAD and enterprise tools.','Linux offers open tools, but check required formats, plugins and features. an alternative need not be an exact replacement.'],
 ['user freedom','study, change and share free components under their licenses.','use and modification are governed by the vendor’s license.','freedom matters even without coding: you can choose a different build, developer or way to use the software.'],
 ['system requirements','choose a minimal base or a ready-made desktop for your hardware.','the official Windows 11 minimum is 4 GB RAM; this means installed capacity, not measured usage.','Linux has no single RAM requirement. base Arch, Arch + GNOME and Mint Xfce are different setups; compare complete work environments.']
 ];
 app.comparisonTranslations={};
 rows.forEach((row,index)=>{comparisons[index]=row;app.comparisonTranslations[row[0]]=en[index][0];for(let col=2;col<5;col++)app.comparisonTranslations[row[col]]=en[index][col-1];});
 Object.assign(app.comparisonTranslations,{
 "меньше навязанных компонентов. больше свободы с Linux.": "fewer imposed components. more freedom with Linux.",
 "реальные преимущества Linux.": "real Linux advantages.",
 "Linux даёт выбор: готовый рабочий стол в Mint или Zorin OS, собственное окружение в Arch. браузер, настройки и магазин программ могут работать через привычные кнопки.": "Linux gives you a choice: a prepared Mint or Zorin OS desktop, or your own Arch environment. browsing, settings and software stores can use familiar graphical controls.",
 "больше свободы с привычными задачами.": "more freedom for familiar tasks.",
 "многие открытые программы работают и в Windows.": "many open applications also work on Windows.",
 "Linux сильнее там, где важен твой выбор": "Linux excels where your choices matter",
 "меньше лишнего. больше контроля.": "less clutter. more control.",
 "вот за что мы любим Linux: можно выбрать состав системы, способ обновлений и инструменты. эти преимущества не требуют выдуманного процента ускорения.": "why we love Linux: choose your system components, update model and tools. these benefits need no invented speedup percentage.",
 "выбираешь компоненты сам": "choose your own components",
 "Arch начинается с минимальной базы. рабочий стол и нужные пакеты добавляешь ты.": "Arch starts from a minimal base. you add your desktop and the packages you need.",
 "как устроен Arch": "how Arch works",
 "обновления в одном месте": "updates in one place",
 "pacman управляет пакетами и зависимостями из репозиториев. меньше отдельных установщиков.": "pacman manages repository packages and dependencies. fewer separate installers.",
 "собрать команду обновления": "generate an update command",
 "можно заглянуть внутрь": "look inside",
 "свободные компоненты можно изучать и менять по условиям лицензии — без разрешения одного поставщика.": "study and modify free components under their licenses, without seeking one vendor’s permission.",
 "что даёт открытый код": "what open source offers",
 "окружение под твой компьютер": "a desktop for your computer",
 "готовый GNOME или лёгкий рабочий стол, набор программ или минимальная база — выбирай под задачу.": "ready-made GNOME or a light desktop, a software suite or a minimal base — choose for your task.",
 "выбрать свою систему": "choose your system",
 "источники сравнения · проверено 26 ноября 2026": "comparison sources · checked November 26, 2026",
 "с подтверждёнными фактами и источниками.": "with supported facts and sources.",
 "требования и принципы проектов подтверждены документацией. измерения Windows и Arch на этом сайте не проводились.": "requirements and project principles are supported by documentation. this site has not benchmarked Windows against Arch."
});
 app.compareSources=[
 ['Arch Linux','https://archlinux.org/about/'],['pacman','https://man.archlinux.org/man/pacman.8.en'],['free(1)','https://man.archlinux.org/man/free.1.en'],['Windows 11 requirements','https://learn.microsoft.com/en-us/windows/whats-new/windows-11-requirements'],['Windows diagnostics','https://support.microsoft.com/en-us/windows/privacy/diagnostics-feedback-and-privacy-in-windows'],['WinGet','https://learn.microsoft.com/en-us/windows/package-manager/winget/'],['GNU freedoms','https://www.gnu.org/philosophy/free-sw.html']
 ];
})(globalThis.DanV2);
