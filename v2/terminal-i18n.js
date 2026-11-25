/* Display-only terminal localization. Never changes simulated files or proofs.
   Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
(function(app){
 'use strict';
 const lines={
 'симулятор терминала · никаких команд на твоём компьютере.':'terminal simulator · no commands run on your computer.',
 'напиши help или попробуй fastfetch.':'type help or try fastfetch.',
 'учебная оболочка: ls, cd, pwd, mkdir, touch, cat, cp, mv, grep, chmod, whoami, id, sudo whoami, echo, uname, ps, cc, makepkg.':'learning shell: ls, cd, pwd, mkdir, touch, cat, cp, mv, grep, chmod, whoami, id, sudo whoami, echo, uname, ps, cc, makepkg.',
 'пайпы | и перенаправления > >> работают с виртуальными файлами.':'pipes | and redirections > >> work with virtual files.',
 'пакеты: pacman, apt, dnf, xbps-install/query/remove, emerge, yay, paru, apk, zypper — только имитация.':'packages: pacman, apt, dnf, xbps-install/query/remove, emerge, yay, paru, apk, zypper — simulation only.',
 'ещё: fastfetch, neofetch, clear, sl, fortune, i use arch btw, chocolate-trapezoid.':'also: fastfetch, neofetch, clear, sl, fortune, i use arch btw, chocolate-trapezoid.',
 'это не полный Bash. файлы, пакеты и сведения о системе вымышленные.':'this is not full Bash. files, packages and system information are simulated.',
 'choo choo! Tux Express прибыл в симулятор.':'choo choo! Tux Express has arrived in the simulator.',
 'команда слишком длинная: максимум 500 символов.':'command too long: maximum 500 characters.',
 'после \\ нужен символ.':'a character is required after \\.',
 'эта конструкция не поддерживается учебной оболочкой. команды выполняются только в симуляции.':'this syntax is not supported by the learning shell. commands run only in simulation.',
 '|| пока не поддерживается; попробуй обычный пайп |.':'|| is not supported yet; try a regular pipe |.',
 'закрой кавычки в конце команды.':'close the quotes at the end of the command.',
 'нужен путь к файлу или папке.':'a file or directory path is required.',
 'песочница ограничена /home/guest. реальные каталоги компьютера недоступны.':'the sandbox is limited to /home/guest. real computer directories are inaccessible.',
 'слишком длинное имя пути.':'path name too long.',
 'это папка, а нужен файл.':'this is a directory; a file is required.',
 'это файл, а нужна папка.':'this is a file; a directory is required.',
 'учебный лимит: 128 файлов и папок. сбрось песочницу.':'learning limit: 128 files and directories. reset the sandbox.',
 'учебный файл ограничен 8192 символами.':'learning files are limited to 8192 characters.',
 'нельзя записать текст вместо папки.':'cannot write text over a directory.',
 'перед | нужна команда.':'a command is required before |.',
 'нужны команды с обеих сторон пайпа, максимум четыре.':'commands are required on both sides of a pipe; at most four commands.',
 'после > или >> укажи ровно один файл.':'specify exactly one file after > or >>.',
 'неподдерживаемое перенаправление.':'unsupported redirection.',
 'перед перенаправлением нужна команда.':'a command is required before redirection.',
 'симулятор не смог разобрать команду. попробуй help.':'the simulator could not parse the command. try help.',
 'после sudo нужна команда. реальный пароль здесь не нужен.':'a command is required after sudo. no real password is needed here.',
 'для первого упражнения используй одно присваивание без пробелов.':'for this exercise, use one assignment without spaces.',
 'cd: укажи одну папку.':'cd: specify one directory.',
 'учебный ls поддерживает -l и -a.':'the learning ls supports -l and -a.',
 'для упражнения укажи одну папку.':'specify one directory for this exercise.',
 'папка или файл с таким именем уже есть.':'a file or directory with this name already exists.',
 'песочница заполнена; сбрось её.':'the sandbox is full; reset it.',
 'цель уже существует. в этой песочнице выбери новое имя, чтобы не затереть файл.':'the destination exists. choose a new name in this sandbox to avoid overwriting it.',
 'пример: grep Linux notes.txt или cat notes.txt | grep Linux':'example: grep Linux notes.txt or cat notes.txt | grep Linux',
 'учебный chmod принимает три восьмеричные цифры, например 644.':'the learning chmod accepts three octal digits, for example 644.',
 'учебный пример: ps -p 1 -o comm=':'learning example: ps -p 1 -o comm=',
 'пример: cc hello.c -o hello':'example: cc hello.c -o hello',
 'учебный исполняемый файл создан. настоящая компиляция не выполнялась.':'learning executable created. no real compilation was performed.',
 'сначала изобрази сборку: cc hello.c -o hello':'first simulate compilation: cc hello.c -o hello',
 'makepkg не запускают от root: PKGBUILD выполняет команды и не должен получать лишние права. попробуй makepkg -si без sudo.':'do not run makepkg as root: PKGBUILD executes commands and must not receive extra privileges. try makepkg -si without sudo.',
 'учебный пример: makepkg -si':'learning example: makepkg -si',
 'пакет собран и установлен [симуляция].':'package built and installed [simulation].',
 'это шутка, а не данные твоего компьютера.':'this is a joke, not information about your computer.',
 'i use arch btw. теперь все знают.':'i use arch btw. now everyone knows.',
 'шоколадная трапеция материализована.':'chocolate trapezoid materialized.',
 'эта операция в примере использует sudo. реальный пароль здесь не запрашивается.':'this example operation uses sudo. no real password is requested here.',
 'yay и paru запускают обычным пользователем, без sudo.':'run yay and paru as a regular user, without sudo.',
 'укажи простое имя пакета, например firefox.':'specify a simple package name, for example firefox.',
 'учебный лимит: 128 пакетов. сбрось песочницу.':'learning limit: 128 packages. reset the sandbox.',
 'в реальной системе сверь параметры в генераторе команд. изменений на компьютере нет.':'on a real system, check arguments in the command generator. nothing on your computer has changed.',
 'песочница /home/guest готова. начни с примера урока.':'/home/guest sandbox ready. start with the lesson example.',
 'песочница /home/guest готова.':'/home/guest sandbox ready.',
 'песочница сброшена. снова /home/guest.':'sandbox reset. back in /home/guest.'
 };
 const patterns=[
 [/^нет такого файла или папки: (.*)\. проверь pwd и ls\.$/, (_,path)=>'no such file or directory: '+path+'. check pwd and ls.'],
 [/^(.*): ожидается (\d+) аргумент\(а\)\. посмотри пример урока\.$/,(_,name,count)=>name+': expected '+count+' argument(s). see the lesson example.'],
 [/^(.*): команда не найдена в симуляторе\. напиши help\.$/,(_,name)=>name+': command not found in the simulator. type help.'],
 [/^(.*) удалён \[симуляция\]\.$/,(_,name)=>name+' removed [simulation].'],
 [/^(.*) установлен \[симуляция: сеть и устройство не используются\]\.$/,(_,name)=>name+' installed [simulation: no network or device access].'],
 [/^учебная имитация: (.*)$/,(_,command)=>'learning simulation: '+command],
 [/^(uid=\d+\([^\n]*\)) \[симуляция\]$/,(_,id)=>id+' [simulation]']
 ];
 app.terminalTranslations=lines;app.terminalPatterns=patterns;
 app.terminalText=function(text,language=app.i18n?.language||'ru'){
  if(language!=='en')return String(text);
  return String(text).split('\n').map(line=>{
   if(Object.hasOwn(lines,line))return lines[line];
   for(const [pattern,replace] of patterns)if(pattern.test(line))return line.replace(pattern,replace);
   return app.i18n?.t(line,'en')??line;
  }).join('\n');
 };
 app.terminalOutput=(result,language)=>result.verbatim?result.output:app.terminalText(result.output,language);
})(globalThis.DanV2);
