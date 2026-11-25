import fs from 'node:fs';
import crypto from 'node:crypto';
const path=new URL('../index.html',import.meta.url);
let html=fs.readFileSync(path,'utf8');
const fragment=fs.readFileSync(new URL('../v2/sections.html',import.meta.url),'utf8')+'\n'+fs.readFileSync(new URL('../v2/playground.html',import.meta.url),'utf8');
if(html.includes('<!-- BEGIN DAN LINUX 2 -->'))html=html.replace(/<!-- BEGIN DAN LINUX 2 -->[\s\S]*?<!-- END DAN LINUX 2 -->/,`<!-- BEGIN DAN LINUX 2 -->\n${fragment}\n<!-- END DAN LINUX 2 -->`);
else html=html.replace('<section id="terminal"',`<!-- BEGIN DAN LINUX 2 -->\n${fragment}\n<!-- END DAN LINUX 2 -->\n<section id="terminal"`);
if(!html.includes('href="v2/platform.css"'))html=html.replace('<link rel="stylesheet" href="style.css"><script src="data.js" defer></script><script src="app.js" defer></script>',[
  '<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="v2/platform.css">',
  ...['config.js','data.js','v2/core.js','v2/academy-data.js','v2/simulator.js','v2/commands.js','v2/community-data.js','v2/backend.js','app.js','v2/platform.js','v2/academy-ui.js','v2/generator-ui.js','v2/community-ui.js','v2/profile-ui.js'].map(file=>`<script src="${file}" defer></script>`)
].join('\n  '));
if(!html.includes('href="#academy">Academy'))html=html.replace('<a href="#alternatives">альтернативы</a></nav>','<a href="#alternatives">альтернативы</a><a href="#academy">Academy</a><a href="#commands">команды</a><a href="#community">сообщество</a></nav>');
if(!html.includes('id="profile-button"'))html=html.replace('<div class="nav-tools">','<div class="nav-tools"><button id="profile-button" class="v2-profile-button" aria-haspopup="dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg><span>профиль</span></button>');
if(!html.includes('id="platform-dialog"'))html=html.replace('<noscript>',`<dialog id="platform-dialog" class="v2-profile-dialog" aria-labelledby="platform-modal-title"><button class="v2-modal-close icon-button" aria-label="закрыть профиль">×</button><div id="platform-dialog-content"></div></dialog>\n<noscript>`);
if(!html.includes('class="v2-new-links"'))html=html.replace('<section id="opensource"',`<div class="v2-new-links"><span>Dan Linux 2.0</span><a href="#academy">Linux Academy</a><a href="#commands">генератор команд</a><a href="#community">голосование</a></div>\n<section id="opensource"`);
if(!html.includes('src="v2/academy-ui.js"'))html=html.replace('<script src="v2/platform.js" defer></script>','<script src="v2/platform.js" defer></script>\n<script src="v2/academy-ui.js" defer></script>\n<script src="v2/generator-ui.js" defer></script>\n<script src="v2/community-ui.js" defer></script>\n<script src="v2/profile-ui.js" defer></script>');
html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>OpenSource and Linux</title>');
if(!html.includes('href="v2/playground.css"'))html=html.replace('<link rel="stylesheet" href="v2/platform.css">','<link rel="stylesheet" href="v2/platform.css"><link rel="stylesheet" href="v2/playground.css">');
if(!html.includes('src="v2/playground-data.js"'))html=html.replace('<script src="v2/academy-data.js" defer></script>','<script src="v2/academy-data.js" defer></script>\n<script src="v2/playground-data.js" defer></script>');
if(!html.includes('src="v2/playground-ui.js"'))html=html.replace('<script src="v2/profile-ui.js" defer></script>','<script src="v2/profile-ui.js" defer></script>\n<script src="v2/playground-ui.js" defer></script>');
if(!html.includes('id="quick-open"'))html=html.replace('<div class="nav-tools">','<div class="nav-tools"><button class="icon-button fun-search-button" id="quick-open" aria-label="быстрый поиск" aria-haspopup="dialog" aria-controls="quick-dialog" aria-keyshortcuts="Control+K Meta+K" title="быстрый поиск · Ctrl+K"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></button>');
if(!html.includes('href="#playground">лаборатория'))html=html.replace('<a href="#community">сообщество</a>','<a href="#community">сообщество</a><a href="#playground">лаборатория</a>');
if(!html.includes('id="quick-dialog"'))html=html.replace('<noscript>',`<dialog id="quick-dialog" class="fun-quick-dialog" aria-labelledby="quick-title"><div class="fun-quick-top"><h2 id="quick-title">куда отправимся?</h2><button id="quick-close" class="icon-button" aria-label="закрыть быстрый поиск">×</button></div><label class="fun-quick-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="quick-input" type="text" role="combobox" aria-label="поиск раздела, дистрибутива или урока" aria-autocomplete="list" aria-controls="quick-results" aria-expanded="false" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="100" placeholder="раздел, дистрибутив или урок…"></label><div id="quick-results" class="fun-quick-results" role="listbox" aria-label="результаты поиска"></div><div class="fun-quick-bottom" id="quick-count" role="status"></div></dialog>\n<noscript>`);
if(!html.includes('src="v2/progress.js"'))html=html.replace('<script src="v2/platform.js" defer></script>','<script src="v2/progress.js" defer></script>\n<script src="v2/platform.js" defer></script>');
if(!html.includes('src="v2/share-context.js"'))html=html.replace('<script src="v2/profile-ui.js" defer></script>','<script src="v2/share-context.js" defer></script>\n<script src="v2/profile-ui.js" defer></script>');
if(!html.includes('class="button share-entry"'))html=html.replace('<a href="#community">голосование</a></div>','<a href="#community">голосование</a><a class="button share-entry" href="share/">DanLinux Share</a></div>');
if(!html.includes('href="share/">Share'))html=html.replace('<a href="#playground">лаборатория</a>','<a href="#playground">лаборатория</a><a href="share/">Share</a>');
if(!html.includes('href="v2/settings.css"'))html=html.replace('<link rel="stylesheet" href="v2/platform.css">','<link rel="stylesheet" href="v2/platform.css"><link rel="stylesheet" href="v2/settings.css">');
if(!html.includes('src="v2/settings.js"'))html=html.replace('</head>','<script src="v2/english.js" defer></script>\n<script src="v2/english-content.js" defer></script>\n<script src="v2/english-academy.js" defer></script>\n<script src="v2/settings.js" defer></script>\n</head>');
if(!html.includes('src="v2/english-content.js"'))html=html.replace('<script src="v2/settings.js"','<script src="v2/english-content.js" defer></script>\n<script src="v2/english-academy.js" defer></script>\n<script src="v2/settings.js"');
html=html.replace('проект современного Notepad опубликован Microsoft. ','');
html=html.replace('href="dan-linux-source.zip"','href="dan-linux-2.0-source.zip"');
if(!html.includes('src="v2/terminal-i18n.js"'))html=html.replace('<script src="v2/simulator.js" defer></script>','<script src="v2/simulator.js" defer></script>\n<script src="v2/terminal-i18n.js" defer></script>');
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match=>"'sha256-"+crypto.createHash('sha256').update(match[1]).digest('base64')+"'");
const policy=`default-src 'self'; script-src 'self' ${inline.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.country.is https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'self'`;
const meta=`<meta http-equiv="Content-Security-Policy" content="${policy}">`;
if(html.includes('http-equiv="Content-Security-Policy"'))html=html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/,meta);else html=html.replace('<title>',meta+'\n  <title>');
fs.writeFileSync(path,html);

const jsPath=new URL('../app.js',import.meta.url);let js=fs.readFileSync(jsPath,'utf8');
const anchor="historyIndex=history.length;terminalPrint(`guest@linux:~$ ${value}`,'prompt');";
if(!js.includes('DanV2?.shellUI'))js=js.replace(anchor,"historyIndex=history.length;if(window.DanV2?.shellUI){window.DanV2.shellUI.run(value);return;}terminalPrint(`guest@linux:~$ ${value}`,'prompt');");
js=js.replace("'chocolate trapezoid'];const matches", "'chocolate trapezoid','chocolate-trapezoid','cd','mkdir','touch','cat','cp','mv','grep','chmod','sudo whoami','makepkg -si'];const matches");
js=js.replace("!$('#detail-dialog').open)","!$('#detail-dialog').open&&!$('#platform-dialog')?.open)");
if(!js.includes('window.DanLegacy='))js+='\n// Narrow bridge: retain the original UI and terminal controls.\nwindow.DanLegacy={toast,logo,openDistro,runCommand,terminalPrint,output,terminalInput,archAscii,showDialog};\n';
fs.writeFileSync(jsPath,js);
console.log('Integrated additive sections, navigation and safe terminal bridge.');
