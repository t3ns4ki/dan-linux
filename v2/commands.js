(function (root) {
  'use strict';
  const app=root.DanV2;
  app.commandDistros=[
    ['arch','Arch Linux','pacman'],['cachy','CachyOS','pacman'],['endeavour','EndeavourOS','pacman'],['manjaro','Manjaro','pacman'],['omarchy','Omarchy','pacman'],
    ['ubuntu','Ubuntu','apt'],['debian','Debian','apt'],['mint','Linux Mint','apt'],['zorin','Zorin OS','apt'],['fedora','Fedora','dnf'],['void','Void Linux','xbps'],['gentoo','Gentoo','emerge'],['alpine','Alpine Linux','apk'],['opensuse','openSUSE','zypper']
  ];
  app.commandActions=[['install','установить пакет'],['remove','удалить пакет'],['update','обновить систему'],['search','найти пакет'],['info','сведения о пакете'],['installed','установленные пакеты'],['cache','очистить кэш']];
  app.commandSources={
    pacman:'https://man.archlinux.org/man/pacman.8.en',apt:'https://manpages.debian.org/stable/apt/apt.8.en.html',dnf:'https://dnf5.readthedocs.io/en/latest/commands/index.html',xbps:'https://docs.voidlinux.org/xbps/index.html',emerge:'https://dev.gentoo.org/~zmedico/portage/doc/man/emerge.1.html',apk:'https://wiki.alpinelinux.org/wiki/Alpine_Package_Keeper',zypper:'https://en.opensuse.org/Portal:Zypper',yay:'https://github.com/Jguer/yay',paru:'https://github.com/Morganamilo/paru'
  };
  const descriptions={
    sudo:'выполнить команду с разрешёнными административными правами; сначала проверь её назначение.',
    pacman:'пакетный менеджер Arch и совместимых систем.',apt:'интерфейс управления пакетами Debian и Ubuntu.',dnf:'интерфейс управления RPM-пакетами Fedora; базовые команды подходят для DNF5.',
    'xbps-install':'установка и обновление через XBPS.', 'xbps-query':'запросы к базе XBPS.', 'xbps-remove':'удаление пакетов и очистка кэша XBPS.',
    emerge:'интерфейс Portage в Gentoo.',equery:'запросы Gentoolkit; утилиту нужно установить отдельно.',qlist:'список пакетов из app-portage/portage-utils.', 'eclean-dist':'очистка исходных архивов; утилита из app-portage/gentoolkit.',
    apk:'пакетный менеджер Alpine.',zypper:'пакетный менеджер openSUSE.',yay:'помощник для репозиториев и AUR, запускается без sudo.',paru:'помощник для репозиториев и AUR, запускается без sudo.',
    '-S':'синхронизация/установка из репозиториев; конкретный смысл зависит от менеджера.', '-R':'удалить указанный пакет через pacman или AUR-помощник.', '-Syu':'обновить базы и все установленные пакеты Arch.',
    '-Ss':'искать пакеты по строке в репозиториях.', '-Si':'показать сведения о пакете в репозитории.', '-Q':'перечислить локально установленные пакеты.', '-Sc':'очистить часть кэша с подтверждением; это может сократить возможности отката.',
    '-Su':'синхронизировать репозитории и обновить систему XBPS.', '-Rs':'в XBPS искать по строке в удалённых репозиториях.', '-R-xbps':'в XBPS запросить сведения из удалённого репозитория.', '-l':'перечислить установленные пакеты XBPS.', '-O':'удалить устаревшие пакеты из кэша XBPS, не сами установленные приложения.',
    install:'установить выбранный пакет.',remove:'удалить пакет; проверь предлагаемый список зависимостей.',update:'в APT: обновить списки; в Zypper: обновить пакеты текущего выпуска.',upgrade:'обновить пакеты текущей системы.',
    search:'найти подходящие пакеты.',show:'показать информацию о пакете APT.',info:'показать сведения о пакете.',list:'перечислить пакеты.', '--installed':'ограничить список установленными пакетами.',
    clean:'очистить кэш менеджера пакетов.',packages:'для dnf clean: удалить кэш загруженных RPM.', '--refresh':'обновить метаданные репозиториев перед операцией.',
    '&&':'следующая команда запускается, только если предыдущая завершилась успешно.', '--ask':'показать план и запросить подтверждение.', '--depclean':'в Portage проверить обратные зависимости и удалить выбранный пакет только когда это допустимо.',
    '--sync':'обновить дерево ebuild-рецептов Portage.', '--update':'обновить выбранное множество пакетов Portage.', '--deep':'проверить дерево зависимостей глубже.', '--newuse':'учесть изменения USE-флагов.', '@world':'выбранные пользователем пакеты и нужные системные наборы.',
    '--search':'поиск по имени в Portage.',meta:'метаданные пакета через Gentoolkit.', '-I':'показать установленные пакеты через qlist.',add:'установить пакет Alpine.',del:'удалить пакет Alpine.',
    '-a':'в apk info: все доступные подробности о выбранном установленном пакете.',cache:'операции с локальным кэшем APK, если кэш включён.',refresh:'обновить метаданные репозиториев openSUSE.',dup:'обновление дистрибутива; стандартный путь обновления Tumbleweed.',
    '--installed-only':'показать только установленные пакеты openSUSE.', '--all':'для zypper clean: очистить также метаданные репозиториев.'
  };
  app.generateCommand=function({distro,action,packageName='',aur='official',suse='tumbleweed'}){
    const selected=app.commandDistros.find(item=>item[0]===distro);
    if(!selected)throw new Error('выбери известный дистрибутив.');
    if(!app.commandActions.some(item=>item[0]===action))throw new Error('выбери действие из списка.');
    if(!['official','yay','paru'].includes(aur))throw new Error('неизвестный источник пакетов.');
    if(!['tumbleweed','leap'].includes(suse))throw new Error('выбери Leap или Tumbleweed.');
    const family=selected[2],needsPackage=['install','remove','search','info'].includes(action);
    const pkg=String(packageName).trim();
    if(needsPackage){
      const pattern=family==='emerge'?/^[a-z0-9][a-z0-9+_.-]*(?:\/[a-z0-9][a-z0-9+_.-]*)?$/:family==='apt'?/^[a-z0-9][a-z0-9+.-]*$/:/^[A-Za-z0-9][A-Za-z0-9@+_.-]*$/;
      if(pkg.length>80||!pattern.test(pkg))throw new Error('введи одно имя пакета без пробелов, флагов и символов оболочки. для Gentoo допустимо category/package.');
    }
    if(aur!=='official'&&family!=='pacman')throw new Error('yay и paru относятся к системам семейства Arch.');
    const manager=family==='pacman'&&aur!=='official'?aur:family;
    let commands=[],warning='',note='названия и доступность пакетов зависят от дистрибутива и выпуска. проверь результат поиска перед установкой.';
    switch(manager){
      case 'pacman':case 'yay':case 'paru':{
        const prefix=manager==='pacman'?'sudo pacman':manager;
        commands={install:[`${prefix} -S ${pkg}`],remove:[`${prefix} -R ${pkg}`],update:[`${prefix} -Syu`],search:[`${manager} -Ss ${pkg}`],info:[`${manager} -Si ${pkg}`],installed:[`${manager} -Q`],cache:[`${prefix} -Sc`]}[action];
        if(manager!=='pacman')note='AUR содержит пользовательские рецепты. прочитай PKGBUILD и связанные файлы до сборки. yay/paru и makepkg запускают без sudo: рецепт не должен получать права root.';
        else if(action==='install')note='система должна быть полностью обновлена. Arch не поддерживает частичные обновления: не заменяй эту команду на pacman -Sy с установкой одного пакета.';
        if(distro==='manjaro'&&manager!=='pacman')note+=' Manjaro обновляет пакеты в своём темпе: AUR-рецепты могут ожидать другие версии зависимостей.';
        break;
      }
      case 'apt':commands={install:[`sudo apt install ${pkg}`],remove:[`sudo apt remove ${pkg}`],update:['sudo apt update','sudo apt upgrade'],search:[`apt search ${pkg}`],info:[`apt show ${pkg}`],installed:['apt list --installed'],cache:['sudo apt clean']}[action];break;
      case 'dnf':commands={install:[`sudo dnf install ${pkg}`],remove:[`sudo dnf remove ${pkg}`],update:['sudo dnf upgrade --refresh'],search:[`dnf search ${pkg}`],info:[`dnf info ${pkg}`],installed:['dnf list --installed'],cache:['sudo dnf clean packages']}[action];break;
      case 'xbps':commands={install:[`sudo xbps-install -S ${pkg}`],remove:[`sudo xbps-remove ${pkg}`],update:['sudo xbps-install -Su'],search:[`xbps-query -Rs ${pkg}`],info:[`xbps-query -R ${pkg}`],installed:['xbps-query -l'],cache:['sudo xbps-remove -O']}[action];if(action==='update')note='если сначала обновился сам XBPS, повтори полное обновление, чтобы установить остальные пакеты.';break;
      case 'emerge':commands={install:[`sudo emerge --ask ${pkg}`],remove:[`sudo emerge --ask --depclean ${pkg}`],update:['sudo emerge --sync','sudo emerge --ask --update --deep --newuse @world'],search:[`emerge --search ${pkg}`],info:[`equery meta ${pkg}`],installed:['qlist -I'],cache:['sudo eclean-dist']}[action];
        if(action==='info'||action==='cache')note='для этой команды нужен app-portage/gentoolkit. очистка eclean-dist относится к архивам исходников, а не к установленным пакетам.';
        if(action==='installed')note='qlist входит в app-portage/portage-utils; утилита может требовать отдельной установки.';
        if(action==='remove')note='укажи точный category/package. --depclean проверяет обратные зависимости; проверь план и состояние @world. не подменяй его --unmerge вслепую.';
        break;
      case 'apk':commands={install:[`sudo apk add ${pkg}`],remove:[`sudo apk del ${pkg}`],update:['sudo apk update','sudo apk upgrade'],search:[`apk search ${pkg}`],info:[`apk info -a ${pkg}`],installed:['apk info'],cache:['sudo apk cache clean']}[action];if(action==='cache')note='команда работает с настроенным локальным кэшем APK. в системе без включённого кэша очищать может быть нечего.';if(action==='info')note='apk info описывает установленные пакеты. если пакет ещё не установлен, сначала используй apk search.';break;
      case 'zypper':commands={install:[`sudo zypper install ${pkg}`],remove:[`sudo zypper remove ${pkg}`],update:['sudo zypper refresh',suse==='tumbleweed'?'sudo zypper dup':'sudo zypper update'],search:[`zypper search ${pkg}`],info:[`zypper info ${pkg}`],installed:['zypper search --installed-only'],cache:['sudo zypper clean --all']}[action];if(action==='update')note=suse==='tumbleweed'?'для обычного обновления Tumbleweed используют dup. это не инструкция по переходу с Leap на Tumbleweed.':'для пакетов текущего выпуска Leap используется update; переход на следующий выпуск — отдельная процедура.';break;
    }
    if(action==='remove')warning='удаление меняет систему. внимательно проверь список пакетов и зависимостей перед подтверждением.';
    if(action==='cache')warning='очистка удаляет загруженные файлы кэша. для повторной установки может понадобиться интернет; возможности отката могут сократиться.';
    if(action==='update')warning='обновление меняет установленные пакеты. прочитай сообщения дистрибутива, закрой важную работу и проверь резервные копии.';
    const text=commands.join(' && '),tokens=text.split(/\s+/);
    const argumentsExplained=[...new Set(tokens)].map(token=>({token,description:token===pkg&&needsPackage?'имя выбранного пакета; может отличаться между дистрибутивами.':token==='-R'&&manager==='xbps'?descriptions['-R-xbps']:descriptions[token]||'аргумент выбранной операции.'}));
    return {text,manager,family,warning,note,arguments:argumentsExplained,source:app.commandSources[manager]||app.commandSources[family]};
  };
})(globalThis);
