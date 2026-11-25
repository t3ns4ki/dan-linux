/* English editorial translations. Original data and answer IDs remain unchanged.
   Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
(function(app){
 'use strict';
 const add=(original,english)=>{if(typeof original==='string'&&typeof english==='string')app.english[original.replace(/\s+/g,' ').trim()]=english;};
 const distroText={
 arch:['independent','pacman · AUR through makepkg','a minimal base for building your own system. choose your desktop, software and tools. pacman, the AUR and Arch Wiki help you manage it.',['full control over system components','fresh packages and detailed Arch Wiki','a huge selection of AUR build recipes'],['read documentation and maintain the system','AUR recipes are user-contributed: inspect them before building'],'for people who want to learn Linux and choose every component.'],
 gentoo:['independent','Portage · emerge','fine-tune software through USE flags and source builds. choose package features before installation. official binary packages are also supported.',['deep dependency control','USE flags and component choices','a great way to understand Linux from within'],['compilation can take a long time','requires careful reading of the handbook'],'for experimenters who enjoy compilation and deep control.'],
 void:['independent','XBPS','an independent system with its own XBPS package manager and runit. glibc and musl variants are available. an interesting path beyond Debian, Fedora and Arch.',['straightforward runit service management','independent development','a compact base system'],['fewer ready-made guides than Ubuntu','the musl variant is incompatible with some prebuilt software'],'for fans of independent systems and alternatives to systemd.'],
 omarchy:['Arch Linux','pacman · AUR tools','a ready-made Arch and Hyprland setup: themes, animations, shortcuts and coordinated tools. tiling without hours of configuration from scratch.',['a coherent desktop design','prepared shortcuts and workflow','the capabilities of Arch and Hyprland'],['Dan finds it a little bloated: many preinstalled components','tiling and shortcuts take getting used to'],'for people who want a polished, ready-made Hyprland setup and agree with its authors’ choices.'],
 zorin:['Ubuntu LTS','APT · Flatpak · Snap','a familiar interface for Windows users, straightforward installation and a polished desktop. Dan likes the convenience: not everyone needs to assemble a system piece by piece.',['a comfortable transition from Windows','clear appearance settings','free Core edition'],['the Pro edition costs money','the main desktop is heavier than lightweight alternatives'],'for beginners who want to start using their computer right away.'],
 pop:['Ubuntu','APT · Flatpak','System76’s system for productivity and development. COSMIC offers window organization and workspaces.',['productivity tools','convenient window management','System76 hardware support'],['check the new desktop against your workflow','not every Ubuntu guide applies without changes'],'for developers and people working with many windows.'],
 mint:['Ubuntu LTS · LMDE uses Debian','APT · Flatpak','a familiar desktop, update manager and a measured approach. consider the Xfce edition for older computers.',['a comfortable start after Windows','clear graphical tools','an Xfce edition is available'],['not always the newest software versions','very new hardware may need extra steps'],'for beginners and anyone wanting a stable everyday system.'],
 debian:['independent','APT · dpkg','a large community project. Debian Stable emphasizes predictability; many desktops and installation approaches are available.',['a dependable Stable branch','a large repository','suitable for servers and desktops'],['Stable may have older software versions','new hardware can require extra steps'],'for people who value stability and reliability.'],
 ubuntu:['Debian','APT · Snap','a popular system with many guides and broad software vendor support. offers LTS and interim releases.',['many guides and compatible applications','convenient installation','different official desktop flavors'],['Snap does not suit everyone','the main edition is not particularly lightweight'],'for beginners, developers and people who value broad support.'],
 fedora:['independent · Red Hat ecosystem','DNF · RPM · Flatpak','modern technologies and current software on a fixed release cycle. Workstation uses GNOME; other desktop editions are available.',['a modern technology stack','good for development','different Spins and Atomic variants'],['regular upgrades to new releases are necessary','some codecs and drivers require separate installation'],'for developers and fans of modern technologies.'],
 cachy:['Arch Linux','pacman','an Arch-based system with optimized builds and kernels. results depend on CPU, workload and configuration: there is no universal FPS boost.',['graphical installer','optimized package variants','convenient configuration tools'],['still requires rolling-release maintenance','gains depend on your workload'],'for people exploring optimization and the Arch ecosystem.'],
 endeavour:['Arch Linux','pacman · yay for AUR','an Arch-like experience with graphical installation and a friendly community. the terminal remains part of the workflow.',['easier initial installation','close to Arch','a helpful community'],['does not remove Arch maintenance needs','uses the terminal more often than Mint'],'for people wanting an Arch-like system without a fully manual installation.'],
 alpine:['independent','apk','a compact musl and BusyBox system, popular in containers and on servers. a desktop is possible, but not the easiest starting point.',['a minimal base system','convenient for containers','OpenRC and straightforward apk'],['musl differs from glibc: some prebuilt software is incompatible','a desktop needs configuration'],'for administrators, container authors and minimalists.'],
 nixos:['independent','Nix','describe your system declaratively, apply its configuration and return to previous generations. reproducibility also depends on pinning input versions.',['declarative configuration','system generation rollbacks','isolated development environments'],['requires learning Nix and an unfamiliar structure','ordinary Linux instructions may not apply'],'for developers interested in reproducible environments.'],
 bazzite:['Fedora Atomic · Universal Blue','Flatpak · Distrobox · rpm-ostree for layering','a system image with gaming tools and a SteamOS-like approach. the base updates as a whole; Flatpak is convenient for applications.',['prepared gaming tools','return to a previous image','PC and handheld variants'],['some anti-cheat systems are incompatible with Linux','ordinary Fedora package installation guides may not apply'],'for gamers after checking game and hardware compatibility.'],
 opensuse:['independent · SUSE family','Zypper · RPM','a family of systems: Leap for fixed releases and Tumbleweed for continuous updates. administration tools depend on the edition.',['a choice of update models','powerful Zypper','snapshot and rollback integration in suitable installations'],['learn edition-specific details beforehand','the rolling branch requires regular updates'],'for people interested in administration and choosing their update pace.'],
 artix:['Arch Linux','pacman','an Arch-like system with alternative init systems. package repositories and service configuration differ from standard Arch.',['several init systems to choose from','a flexible minimal base','familiar pacman'],['Arch instructions need adaptation','check service and package compatibility'],'for experienced users wanting an Arch-like system without systemd.']
 };
 for(const d of distros){const e=distroText[d.id];if(!e)continue;add(d.base,e[0]);add(d.pkg,e[1]);add(d.desc,e[2]);d.pros.forEach((s,i)=>add(s,e[3][i]));d.cons.forEach((s,i)=>add(s,e[4][i]));add(d.who,e[5]);}
 const extra={
 'OpenRC или systemd':'OpenRC or systemd','systemd по умолчанию':'systemd by default','фиксированные выпуски':'fixed releases','фиксированные Stable · Testing/Unstable отдельно':'fixed Stable releases · separate Testing/Unstable branches','фиксированные выпуски · есть LTS':'fixed releases · LTS available','фиксированные выпуски · edge отдельно':'fixed releases · separate edge branch','фиксированные выпуски · nixos-unstable отдельно':'fixed releases · separate nixos-unstable branch','постоянно обновляемый образ':'continuously updated image','Leap — фиксированные · Tumbleweed — rolling':'Leap — fixed · Tumbleweed — rolling',
 'максимум контроля. легендарная компиляция.':'maximum control. legendary compilation.','Дан предпочитает выбирать компоненты сам.':'Dan prefers choosing his own components.','удобство — тоже хорошая причина.':'convenience is a good reason too.',
 'меньше рутины. больше дела.':'less routine. more productivity.','просто чувствуй себя дома.':'just feel at home.','надёжная основа.':'a reliable foundation.','большое сообщество. понятный старт.':'a large community. an accessible start.','современный Linux, уже сегодня.':'modern Linux, today.','Arch с фокусом на производительность.':'Arch with a performance focus.','ближе к Arch. проще на старте.':'closer to Arch. easier to start.','маленькая система. большие задачи.':'small system. big tasks.','твоя система — это конфигурация.':'your system is a configuration.','загружайся. играй.':'boot. play.','выбери свой темп.':'choose your pace.','Arch-подобная свобода без systemd.':'Arch-like freedom without systemd.'
 };Object.assign(app.english,extra);
 const compareEnglish=[
 ['RAM','depends on desktop and services: Xfce is usually lighter than a full GNOME setup.','depends on version, background services and applications.','compare identical tasks and clean boots; cached memory is not itself a problem.'],
 ['performance','a lightweight system can be tailored to a specific task.','some commercial applications are better optimized for Windows.','there is no universal winner or honest single speedup percentage.'],
 ['customization','change your desktop, window manager, kernel and services.','many settings are available, but the vendor controls the system internals.','Linux offers more choices; customization can take time.'],
 ['privacy','depends on the distribution, services and chosen settings.','includes telemetry and cloud integrations; some are configurable.','open source does not automatically disable data collection in every application.'],
 ['source code','the kernel and much of the system are open; proprietary drivers can be present.','the main Windows code is proprietary, while some components are open.','a Linux distribution is not always entirely free software.'],
 ['updates','choose fixed releases or a rolling release.','centralized Windows Update; some apps update independently.','Linux also needs reboots, for example to start a new kernel.'],
 ['cost','many distributions are free of charge; support and some editions cost money.','usually requires a license, often included in the PC price.','free software may be sold. freedom does not mean a price of zero.'],
 ['older computers','lightweight desktops can extend an older PC’s useful life.','new versions have specific hardware requirements.','check CPU architecture and driver support as well as RAM.'],
 ['programming','package managers, containers and a familiar server environment.','Visual Studio, .NET and WSL offer strong development tools.','it depends on the stack: Linux is not equally convenient for every project.'],
 ['gaming','native games and Proton run many Windows games.','the broadest compatibility with Windows games and anti-cheat.','check every important game on ProtonDB, Are We Anti-Cheat Yet and its developer’s website.'],
 ['application compatibility','many alternatives; Wine helps with some Windows programs.','the native platform for many Adobe, CAD and corporate applications.','Wine does not guarantee compatibility. web versions or virtual machines do not solve everything.'],
 ['user freedom','study and change open components under their licenses.','use and modification are limited by the vendor’s license.','choice matters even if you never modify the code.'],
 ['system requirements','vary by distribution and desktop environment.','published for each Windows version.','read the project’s current requirements; this site does not promise support for every device.']
 ];
 comparisons.forEach((row,i)=>{add(row[0],compareEnglish[i][0]);for(let j=2;j<5;j++)add(row[j],compareEnglish[i][j-1]);});
 const mythEnglish=[
 ['Linux is only for hackers.','also for browsing, study, drawing and calls. Mint and Zorin OS welcome everyday users. a black hoodie is not a system requirement.'],
 ['you can’t game on Linux.','you can: native games, Steam and Proton. some games and anti-cheat systems do not work — check your library before switching.'],
 ['Linux is impossible to install.','many distributions have graphical installers. back up your files, try a live USB and follow official instructions. disk partitioning needs care.'],
 ['everything on Linux requires a terminal.','browsers, software stores, files and settings usually have graphical interfaces. the terminal is another tool; Arch and Gentoo need it more often.'],
 ['free software is always worse than paid software.','price does not measure quality. Blender, Firefox and Linux do serious work. the right features matter more than a pretty license — check your own tasks.'],
 ['Linux never gets viruses.','Linux malware exists. keep software updated, be careful with downloads and limit privileges. sudo does not make a suspicious script friendlier.'],
 ['beginners can’t use Arch Linux.','they can, if willing to read the Wiki and learn. manual configuration and maintenance do not suit everyone. Mint or Zorin can be more comfortable first steps.'],
 ['all Linux distributions are the same.','a shared kernel does not mean the same experience. packages, updates, init, desktops and configuration approaches differ. shared ingredients don’t make every pizza identical.']
 ];myths.forEach((row,i)=>row.forEach((value,j)=>add(value,mythEnglish[i][j])));
const applicationDescriptions=[
 'a family of systems using the Linux kernel; choose a distribution for your tasks.',
 'documents, spreadsheets and presentations; complex MS Office layouts may differ.',
 'document editors; check macro and formatting compatibility.',
 'photo retouching and raster graphics; Photoshop plugins do not transfer automatically.',
 'digital painting and illustration, rather than a complete Photoshop clone.',
 'vector graphics and SVG; complex AI documents may need adjustments.',
 'multitrack video editing and effects.',
 'a video editor supporting many formats.',
 'non-destructive RAW processing and photo cataloging.',
 'detailed RAW processing, color and image controls.',
 'a browser with a different engine; the iOS version uses WebKit.',
 'the open foundation of Chrome; services and codecs depend on the build.',
 'extensions, synchronization and privacy controls.',
 'archive utility: extracts RAR, but does not create RAR archives.',
 'graphical archive manager supporting many formats.',
 'an editor with tabs, syntax highlighting and development tools.',
 'a lightweight text editor from Xfce.',
 'a Code — OSS build without Microsoft branding; some extensions are unavailable or restricted.',
 'a Matrix chat and calling client. Discord servers and friends do not migrate automatically.',
 'end-to-end encryption; your friends also need Signal. registration uses the mobile app.',
 'stream your own music collection. requires a server and your own files; no Spotify catalog.',
 'files and collaboration on your server or a provider’s hosting. hosting can cost money.',
 'self-hosted photos and backups. server maintenance is your responsibility.',
 'offline OpenStreetMap maps; does not replace live traffic or Google’s directory.',
 'remote desktop with optional self-hosting. remote control depends on the platform.',
 'a command-line downloader with multiple connections.',
 'graphical download manager; integration depends on your browser.',
 'email and calendar; check corporate Exchange features separately.',
 'Markdown notes with synchronization; OneNote import may require conversion.',
 'parametric 3D CAD with a different workflow.',
 '2D drafting. check DWG compatibility and your professional workflow.',
 'audio recording and editing.',
 'multitrack DAW; official ready-made builds may require payment.',
 'collaborative interface design and prototypes; Figma plugins are not automatically compatible.',
 'self-hosted Git with issues and pull requests. Git is open; GitHub itself is proprietary.',
 'compact Git hosting; migrating CI and integrations needs configuration.',
 'emulation and virtualization; acceleration depends on your platform.',
 'graphical virtual machine management through libvirt, often with QEMU/KVM.',
 'Ollama runs models; it is not a model itself. choose models with suitable licenses: open weights do not always mean Open Source. quality and speed depend on the model and hardware.'
 ];
 let applicationIndex=0;for(const row of apps)for(const item of row[2])add(item[4],applicationDescriptions[applicationIndex++]);
 Object.assign(app.english,{'система':'system','офис':'office','дизайн':'design','медиа':'media','интернет':'internet','утилиты':'utilities','разработка':'development','общение':'communication','облако':'cloud','ии':'AI','ПК · серверы':'PCs · servers','Ollama + открытые модели':'Ollama + open models','Linux · Windows · macOS · Android · iOS · веб':'Linux · Windows · macOS · Android · iOS · web','сервер: Linux · Windows · macOS · клиент: веб':'server: Linux · Windows · macOS · client: web','сервер Linux · клиенты ПК, Android, iOS, веб':'Linux server · PC, Android, iOS and web clients','сервер Linux/Docker · Android · iOS · веб':'Linux/Docker server · Android · iOS · web','Linux · Windows · macOS · Android · iOS (клиент)':'Linux · Windows · macOS · Android · iOS (client)','веб · собственный сервер':'web · self-hosted','сервер Linux · веб':'Linux server · web','сервер Linux · Windows · macOS · веб':'Linux · Windows · macOS server · web'});
})(globalThis.DanV2);
