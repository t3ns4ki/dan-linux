/* Offline Academy translation; answer IDs, prerequisites and XP are unchanged.
   SPDX-License-Identifier: GPL-3.0-or-later */
(function(app){
 'use strict';
 const lessons=[
 ['linux','what is Linux?',[
 'strictly speaking, Linux is the kernel: the central part of a system. in everyday speech, “Linux” often means the whole operating system, including its kernel, system tools and applications.',
 'when you open a browser, the kernel helps it obtain memory, access storage and use the network. you don’t need to understand every kernel detail to use your computer.'
 ],'a browser requests a file from an SSD. which component manages access to the device?',[
 ['the kernel','correct: drivers and system calls connect programs to hardware.'],['desktop wallpaper','wallpaper changes appearance, not disk access.']
 ],'what do people usually mean by “I installed Linux”?',[
 ['only a kernel without applications','people usually install a complete distribution, not just a kernel.'],['a distribution with a kernel and applications','yes: for example Mint, Debian or Arch.']]],
 ['kernel','why do we need a kernel?',[
 'the kernel allocates CPU time and manages memory and devices. a driver is code that helps the system communicate with particular hardware.',
 'kernel updates may fix bugs and add hardware support, but the newest version is not necessarily best for every machine. LTS means long-term support, not a magical speed boost.'
 ],'what helps a system interact with a graphics card?',[
 ['a suitable driver','yes. consider your hardware model and driver support.'],['a new terminal theme','a theme changes appearance, not graphics card support.']
 ],'why is the kernel called a kernel?',[
 ['it manages important resources and device interactions','yes: it is one of the operating system’s central components.'],['it draws all desktop icons','desktop environment components draw the icons.']]],
 ['distribution','what is a distribution?',[
 'a distribution combines a kernel, software, repositories, installer and update policies into a coherent system. Arch and Ubuntu differ in more than wallpaper.',
 'a package manager installs packages from repositories. a desktop environment can be changed separately: GNOME does not belong to just one distribution.'
 ],'you want an accessible first desktop after Windows. what is a reasonable starting point?',[
 ['try a ready-made Mint or Zorin OS system','correct: you can start without assembling a desktop manually.'],['everyone needs Arch without exception','Arch does not suit every workflow or willingness to configure a system.']
 ],'can GNOME be used in different distributions?',[
 ['yes, the desktop and distribution are different parts of a system','exactly.'],['no, GNOME works only on Ubuntu','GNOME is also available on Fedora, Arch, Debian and other systems.']]],
 ['windows','Linux and Windows: choose for your tasks',[
 'Linux offers many desktops, update models and open components. Windows is often more convenient for certain commercial applications and games with incompatible anti-cheat.',
 'no operating system accelerates all computers equally. check your applications, hardware and games. trying a live USB or keeping dual boot is perfectly reasonable.'
 ],'a required application works only on Windows. what should you do before switching?',[
 ['check alternatives and retain access to the required system','yes: your actual tasks matter more than arguments about logos.'],['erase Windows without checking anything','you could lose access to a needed tool and your data.']
 ],'will every game run through Proton?',[
 ['yes, every game','some games and anti-cheat systems do not support Linux.'],['no, check compatibility','correct: support depends on the specific game.']]],
 ['opensource','Open Source: rights, not a price tag',[
 'an open license grants rights to use, study, modify and redistribute a program under its terms. free software can be sold, and a no-cost program can remain proprietary.',
 'communities help with code, translations, documentation and bug reports. open source allows independent inspection, but does not promise an audit has happened or that no bugs exist.'
 ],'you are not a programmer yet. how can you help an open project?',[
 ['write a clear bug report or contribute a translation','yes: contributions go beyond code.'],['you can’t — a developer diploma is required','testing, documentation and other kinds of help are valuable.']
 ],'does open source guarantee absolute security?',[
 ['yes, open software has no vulnerabilities','open software can have bugs too.'],['no, but independent inspection is possible','yes. reviews and updates still matter.']]],
 ['term-navigation','ls, cd, pwd: where am I?',[
 'pwd shows the current directory. ls lists its contents. cd changes the current folder. an absolute path starts with /; a relative path starts from the current directory.',
 'you start in /home/guest in this sandbox. Documents and notes.txt are already present. commands cannot access your computer’s real files.'
 ],'enter the Documents folder. you can look around with ls and pwd first.',null,'which command shows the full path of the current folder?',[
 ['ls','ls shows contents, not the current path.'],['pwd','correct: print working directory.'],['cd','cd changes the current directory.']]],
 ['term-create','mkdir and touch: create something',[
 'mkdir creates a directory. touch creates an empty file if it does not exist, or updates timestamps on an existing file.',
 'names are case-sensitive: Projects and projects are different names. quote spaces in file names; simple names are easier for your first experiments.'
 ],'create a projects folder, then an empty projects/hello.txt file.',null,'what does touch do to an existing file?',[
 ['erases its contents','ordinary touch does not erase a file’s text.'],['updates its timestamps','correct: the contents remain intact.']]],
 ['term-read','cat: read text',[
 'cat prints the contents of a text file. its name comes from concatenate: it can output several files in sequence.',
 'less is more convenient for very large files on a real system. notes.txt is small, so cat is a good fit here.'
 ],'show the contents of notes.txt.',null,'what does “no such file” mean?',[
 ['check the name, capitalization and current folder','yes. start with pwd and ls.'],['always add sudo','sudo does not fix an incorrect path.']]],
 ['term-copy','cp and mv: copy or move?',[
 'cp copies a file and keeps the original. mv moves or renames a file. check the destination before replacing an existing file.',
 'on real systems, cp -i and mv -i ask before overwriting. this sandbox refuses to silently overwrite an existing file: choose a new name.'
 ],'copy notes.txt to backup.txt, then rename the copy to archive.txt.',null,'which command normally keeps the original in place?',[
 ['mv','mv moves or renames the original.'],['cp','yes: copying creates another file.']]],
 ['term-grep','grep: find the lines you need',[
 'grep finds lines matching a pattern. matching is case-sensitive by default. the -i flag ignores case.',
 'real grep supports regular expressions. this learning sandbox supports only plain text searches and -i: enough for the first exercise.'
 ],'find lines containing Linux in notes.txt.',null,'which grep flag ignores case?',[
 ['-i','correct: ignore case.'],['-r','-r enables recursive searching, not case-insensitive matching.']]],
 ['term-permissions','permissions: 644 is not a password',[
 'permissions are set separately for the owner, group and others. r = read (4), w = write (2), x = execute (1). add the values.',
 '644 means the owner can read and write; the group and others can only read. for directories, x permits traversal. 777 is not a universal error fix.'
 ],'set notes.txt permissions to 644.',null,'what permissions does the owner get with 644?',[
 ['read, write and execute','6 = 4 + 2. the execute bit is absent.'],['read and write','correct: r + w.']]],
 ['term-sudo','users and sudo',[
 'a regular user works with their own files. root is a privileged account. sudo may permit a particular command to run with other privileges under a configured policy.',
 'sudo is not a “fix everything” prefix. understand a command and its source first. sudo whoami only simulates elevation in this sandbox: no real password is needed or requested.'
 ],'inspect the simulated user name with sudo whoami.',null,'why avoid running every program as root?',[
 ['because root is always slower','speed is not the main reason.'],['a mistake with extra privileges can cause more harm','yes: grant only the permissions you need.']]],
 ['term-pipes','redirection and pipes',[
 '> writes output to a file, replacing its existing contents. >> appends instead. | sends one command’s standard output to another command’s standard input.',
 'a pipe does not simply mean “run another command”. in this exercise cat passes text to grep, which keeps matching lines.'
 ],'write Linux into result.txt using echo and >, then pipe cat output into grep Linux.',null,'how does >> differ from >?',[
 ['appends instead of replacing contents','yes. take care with ordinary >.'],['automatically runs the command as root','redirection does not grant extra privileges.']]],
 ['pkg-pacman','pacman: the official Arch route',[
 'pacman manages packages on Arch and several derivatives. -S installs from repositories, -R removes and -Q queries the local package database.',
 'use -Syu for a full upgrade. refreshing only the database with -Sy and then installing packages may cause an unsupported partial upgrade. the AUR is not an official binary pacman repository.'
 ],'install a virtual firefox package with pacman.',null,'which command fully upgrades Arch?',[
 ['sudo pacman -Sy','this only synchronizes databases; it is not a full upgrade.'],['sudo pacman -Syu','yes: synchronize and upgrade system packages.']]],
 ['pkg-apt','APT: Debian and Ubuntu',[
 'apt is used in Debian, Ubuntu, Mint, Zorin and related systems. apt update refreshes available package lists; apt upgrade upgrades the installed packages themselves.',
 'package names depend on the distribution and release. firefox availability and installation methods may differ between Ubuntu and Debian.'
 ],'practice installing a virtual firefox package with apt.',null,'what does apt update do?',[
 ['immediately upgrades all applications','upgrade updates the applications themselves.'],['refreshes information about available packages','correct: repository metadata.']]],
 ['pkg-dnf','DNF: the Fedora family',[
 'dnf resolves dependencies and manages RPM packages. modern Fedora uses DNF5, while basic install, remove, search and info commands remain familiar.',
 'upgrade --refresh refreshes metadata before upgrading packages. this does not upgrade to the next major Fedora release: that requires a separate procedure.'
 ],'install a virtual firefox package with dnf.',null,'does dnf upgrade --refresh upgrade to the next Fedora release?',[
 ['yes, automatically','package updates and release upgrades are different operations.'],['no, it updates packages in the current system','correct.']]],
 ['pkg-xbps','XBPS: Void’s own path',[
 'Void uses its own tools: xbps-install, xbps-query and xbps-remove. repository queries and removal use separate commands.',
 'xbps-install -Su synchronizes repositories and upgrades the system. if XBPS itself is upgraded first, other updates may need another run.'
 ],'install a virtual firefox package with XBPS.',null,'which tool queries XBPS package information?',[
 ['xbps-query','correct: query the local database or repositories.'],['systemctl','systemctl manages systemd services; Void normally uses runit.']]],
 ['pkg-emerge','Portage and emerge: build from a recipe',[
 'Gentoo uses Portage; emerge installs packages and resolves dependencies. USE flags affect program features at build time. official binary packages also exist.',
 '--ask shows the plan and asks for confirmation. installation time depends on the package, hardware and availability of suitable binary builds.'
 ],'simulate installing www-client/firefox with emerge in the sandbox.',null,'what do USE flags do?',[
 ['control package features during compilation','yes: a key Gentoo feature.'],['overclock the CPU to any frequency','USE flags are not overclocking settings.']]],
 ['pkg-aur','AUR, yay, paru and makepkg',[
 'the AUR stores user-contributed PKGBUILD recipes. makepkg executes a recipe and builds a package that pacman can install. yay and paru help with this workflow.',
 'read PKGBUILD and related files before building. never run makepkg as root: recipes execute commands that do not need unlimited privileges. dependency and final package installation can request sudo separately.'
 ],'build a simulated package with makepkg -si, without sudo.',null,'why is sudo makepkg a bad idea?',[
 ['recipe commands would receive unnecessary privileges','correct: build as a regular user.'],['root is unable to compile anything','the reason is privilege safety, not compilation ability.']]],
 ['adv-kernel','the kernel and system calls',[
 'applications request kernel services through system calls: reading files, creating processes and using sockets. this forms a boundary between user space and kernel space.',
 'changing a desktop environment does not automatically change the kernel. several kernel versions can coexist; the bootloader and configuration determine which one starts.'
 ],'show the learning kernel version with uname -r.',null,'what is a system call?',[
 ['an interface for a program to request a kernel service','correct.'],['any keyboard shortcut','a shortcut is an interface event, not the definition of a system call.']]],
 ['adv-boot','GRUB and Limine: before the system starts',[
 'after power-on, firmware starts the boot chain. a bootloader loads the kernel and passes parameters to it. GRUB and Limine are examples.',
 'EFI partitioning, Secure Boot and configuration depend on your machine. this course explains the principles; it does not ask you to blindly overwrite your disk’s bootloader.'
 ],'when do you normally choose a system from the GRUB menu?',[
 ['before its kernel starts','yes: the bootloader prepares to start the kernel.'],['after opening a browser','the browser starts much later.']
 ],'GRUB and Limine are…',[
 ['desktop environments','GNOME, Plasma and other environments provide desktops.'],['bootloaders','correct.']]],
 ['adv-init','systemd and alternative init systems',[
 'the kernel starts the first user-space process. init and service management help start and supervise services.',
 'systemd is common in many distributions. Void uses runit; Alpine and some Gentoo setups use OpenRC. service management commands differ.'
 ],'inspect the simulated PID 1 process name: ps -p 1 -o comm=.',null,'does systemctl work with every init system?',[
 ['yes, it is universal','systemctl belongs to systemd. runit and OpenRC have different interfaces.'],['no, commands depend on the service system','correct.']]],
 ['adv-desktop','DE and WM: what makes your desktop?',[
 'a Desktop Environment is a suite: a shell, settings, file manager and other components. GNOME, KDE Plasma and Xfce are examples.',
 'a Window Manager manages windows. Wayland compositors combine more responsibilities: Hyprland and Sway are examples. tiling automatically arranges windows in a workspace.'
 ],'you want a complete desktop with settings and applications. which fits?',[
 ['Desktop Environment','yes: a more complete set of components.'],['only a kernel','the kernel alone does not provide a graphical desktop.']
 ],'is Hyprland a standalone distribution?',[
 ['yes, a separate Linux with its own package manager','Hyprland is a compositor usable in multiple distributions.'],['no, it is a Wayland compositor','correct.']]],
 ['adv-display','X11 and Wayland',[
 'X11 and Wayland represent different approaches to graphical applications and the display system. Wayland is a protocol; a compositor provides an implementation.',
 'XWayland runs many X11 applications inside a Wayland session. screen recording, remote access and driver support depend on the environment and versions.'
 ],'what is XWayland for?',[
 ['running many X11 applications in a Wayland session','yes: it is a compatibility layer.'],['compiling the kernel','that is not XWayland’s task.']
 ],'are Wayland and Hyprland the same thing?',[
 ['yes, two names for one program','several different Wayland compositors exist.'],['no: a protocol and one of its compositors','correct.']]],
 ['adv-bash','Bash: variables and scripts',[
 'a shell parses commands and connects programs. Bash supports variables, conditions, loops and scripts. simple assignment has no spaces around =.',
 'double quotes permit variable expansion; single quotes preserve literal text. the learning simulator supports assignment and simple expansion, not full Bash.'
 ],'set name=Dan, then print the value with echo "$name".',null,'which assignment is valid in Bash?',[
 ['name = Dan','the shell sees a command named name with arguments, not an assignment.'],['name=Dan','correct: no spaces around =.']]],
 ['adv-compile','compilation: from source to program',[
 'a compiler translates source code into another representation, such as machine code. linking can then combine object files and libraries into an executable.',
 'cc only simulates compilation in this sandbox: C code is not executed and no compiler is downloaded. ./hello means running hello from the current directory in a real shell; here it returns a predefined safe response.'
 ],'simulate compiling hello.c into hello, then run the learning ./hello.',null,'what does -o hello mean for a typical cc compiler?',[
 ['the output file name','yes: output.'],['compile only over the internet','this flag does not enable network compilation.']]]
 ];
 function add(original,english){if(typeof original==='string'&&typeof english==='string')app.english[original.replace(/\s+/g,' ').trim()]=english;}
 for(const [id,title,body,prompt,practice,question,options] of lessons){const lesson=app.lessons.find(row=>row.id===id);if(!lesson)continue;add(lesson.title,title);lesson.body.forEach((text,i)=>add(text,body[i]));add(lesson.practice.prompt,prompt);lesson.practice.options?.forEach((option,i)=>{add(option.label,practice?.[i]?.[0]);add(option.why,practice?.[i]?.[1]);});add(lesson.quiz.question,question);lesson.quiz.options.forEach((option,i)=>{add(option.label,options[i][0]);add(option.why,options[i][1]);});}
})(globalThis.DanV2);
