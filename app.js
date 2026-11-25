'use strict';
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storage={get(key,fallback=null){try{return localStorage.getItem(key)??fallback}catch{return fallback}},set(key,value){try{localStorage.setItem(key,value)}catch{}}};
// all brand assets are served locally; formats are filled from the downloaded asset manifest.
const assetFormats = {"cachy": "svg", "inkscape": "svg", "debian": "svg", "immich": "svg", "librecad": "ico", "omarchy": "svg", "rustdesk": "svg", "aria2": "png", "mousepad": "svg", "7zip": "svg", "darktable": "ico", "audacity": "svg", "opensuse": "svg", "gitea": "svg", "onlyoffice": "svg", "endeavour": "svg", "arch": "svg", "pop": "svg", "qemu": "svg", "fedora": "svg", "nixos": "svg", "shotcut": "svg", "element": "svg", "vscodium": "svg", "artix": "svg", "chromium": "svg", "kate": "ico", "krita": "svg", "linux": "png", "gimp": "svg", "bazzite": "svg", "mint": "svg", "kdenlive": "svg", "gentoo": "svg", "libreoffice": "svg", "signal": "svg", "joplin": "svg", "freecad": "svg", "nextcloud": "svg", "forgejo": "svg", "thunderbird": "svg", "penpot": "svg", "ubuntu": "svg", "firefox": "svg", "ollama": "svg", "zorin": "svg", "xdm": "png", "alpine": "svg", "void": "svg", "ardour": "svg", "organicmaps": "svg", "navidrome": "svg", "peazip": "ico", "virtmanager": "png", "rawtherapee": "svg"};
const logo = id => `assets/${id}.${assetFormats[id]||'svg'}`;
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4200)}
const themeButton=$('#theme');
function applyAccent(color){const light={'#54b8ee':'#126a98','#b9a3e3':'#71569e','#e8799c':'#ad335d','#f39a63':'#9c491c','#a2c879':'#456f23'};document.documentElement.style.setProperty('--accent',document.documentElement.dataset.theme==='light'?(light[color]||'#126a98'):color)}
function updateThemeLabel(){applyAccent(storage.get('dan-accent','#54b8ee')); const dark=document.documentElement.dataset.theme==='dark';themeButton.setAttribute('aria-label',dark?'включить светлую тему':'включить тёмную тему');themeButton.setAttribute('aria-pressed',String(!dark));$('meta[name="theme-color"]').content=dark?'#0b0d10':'#f8fafc'}
updateThemeLabel();themeButton.onclick=()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;storage.set('dan-theme',theme);updateThemeLabel()};
const accents=[['Arch','#54b8ee'],['Gentoo','#b9a3e3'],['Debian','#e8799c'],['Ubuntu','#f39a63'],['Void','#a2c879']];
$('#accents').innerHTML=accents.map(([name,color])=>`<button class="accent-button" style="--swatch:${color}" data-color="${color}" aria-label="акцент ${name}" title="${name}" aria-pressed="${storage.get('dan-accent','#54b8ee')===color}"></button>`).join('');
$('#accents').onclick=e=>{const b=e.target.closest('[data-color]');if(!b)return;applyAccent(b.dataset.color);storage.set('dan-accent',b.dataset.color);$$('.accent-button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))};
function closeMenu(){ $('#navigation').classList.remove('open');$('#menu').setAttribute('aria-expanded','false');$('#menu').setAttribute('aria-label','открыть меню') }
$('#menu').onclick=()=>{const open=$('#navigation').classList.toggle('open');$('#menu').setAttribute('aria-expanded',String(open));$('#menu').setAttribute('aria-label',open?'закрыть меню':'открыть меню')};
$$('#navigation a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!$('#detail-dialog').open&&!$('#platform-dialog')?.open&&!$('#quick-dialog')?.open&&!$('#settings-dialog')?.open){e.preventDefault();$('#distros').scrollIntoView();$('#distro-search').focus({preventScroll:true})}});
$('#ribbon-logos').innerHTML=['arch','gentoo','debian','ubuntu','void','fedora'].map(id=>{const d=distros.find(x=>x.id===id);return `<a class="ribbon-logo" href="#distros" data-open-distro="${id}"><img src="${logo(id)}" alt="" width="26" height="26">${d.name}</a>`}).join('');

const dialog=$('#detail-dialog');
let modalTrigger=null;
function showDialog(html){modalTrigger=document.activeElement;$('#dialog-content').innerHTML=html;dialog.showModal();dialog.scrollTop=0}
$('.dialog-close').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
dialog.addEventListener('close',()=>modalTrigger?.focus({preventScroll:true}));
function prosCons(d,limit=Infinity){return `<div class="pros-cons"><div class="pros"><b>что нравится</b><ul>${d.pros.slice(0,limit).map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="cons"><b>что учитывать</b><ul>${d.cons.slice(0,limit).map(x=>`<li>${x}</li>`).join('')}</ul></div></div>`}
function openDistro(id){const d=distros.find(x=>x.id===id);if(!d)return;const facts=[['основа',d.base],['пакетный менеджер',d.pkg],['инициализация',d.init],['установка',d.level],['обновления',d.release]];showDialog(`<div class="dialog-heading"><img src="${logo(id)}" alt="логотип ${d.name}"><div><h2 id="modal-title">${d.name}</h2><p class="accent">${d.tag}</p></div></div><p class="dialog-desc">${d.desc}</p><div class="facts">${facts.map(([k,v])=>`<div class="fact"><span>${k}</span><b>${v}</b></div>`).join('')}</div>${prosCons(d)}<p class="dialog-who"><b>кому подходит:</b> ${d.who}</p>${d.note?`<p class="dialog-quote">${d.note}</p>`:''}<a class="button primary" href="${d.url}" target="_blank" rel="noopener">официальный сайт ${d.name}</a>`)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-open-distro]');if(b){e.preventDefault();openDistro(b.dataset.openDistro)}});
$('#top-list').innerHTML=distros.slice(0,5).map((d,i)=>`<article class="top-card"><div class="top-summary"><div class="top-header"><span class="rank">0${i+1}</span><img src="${logo(d.id)}" alt="логотип ${d.name}" width="42" height="42"><h3>${d.name}</h3>${i===0?'<span class="pill">выбор Дана</span>':''}</div><div class="top-tagline">${d.tag}</div><p>${d.desc}</p>${i===0?`<p class="accent" style="font-family:monospace">“${d.note}”</p>`:''}</div><div class="top-details">${prosCons(d,2)}<div class="top-footer"><button data-open-distro="${d.id}">подробнее о ${d.name}</button><a href="${d.url}" target="_blank" rel="noopener">официальный сайт</a></div></div></article>`).join('');

let compareFilter='all';
function renderCompare(){ $('#compare-body').innerHTML=comparisons.map((c,i)=>{if(compareFilter!=='all'&&c[1]!==compareFilter)return '';return `<tr class="compare-main" data-row="${i}"><td><button class="compare-toggle" aria-expanded="false" aria-controls="comparison-${i}">${c[0]}<span aria-hidden="true">+</span></button></td><td>${c[2]}</td><td>${c[3]}</td></tr><tr class="compare-detail" id="comparison-${i}" hidden><td colspan="3">${c[4]}${c[1]==='игры'?' <a class="text-link" href="https://areweanticheatyet.com/" target="_blank" rel="noopener">проверить античит</a>':''}</td></tr>`}).join('') }
renderCompare();
$('#compare-body').onclick=e=>{const row=e.target.closest('.compare-main');if(!row)return;const detail=row.nextElementSibling;detail.hidden=!detail.hidden;const b=$('button',row);b.setAttribute('aria-expanded',String(!detail.hidden));$('span',b).textContent=detail.hidden?'+':'−'};
$('#compare-filters').onclick=e=>{const b=e.target.closest('[data-filter]');if(!b)return;compareFilter=b.dataset.filter;$$('button',$('#compare-filters')).forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});renderCompare()};

const distroFilters=[['all','все'],['beginner','для новичков'],['gaming','для игр'],['light','для слабых ПК'],['dev','для разработчиков'],['minimal','минималистичные'],['rolling','rolling release'],['nosystemd','без systemd']];
let activeDistroFilter='all';
$('#distro-filters').innerHTML=distroFilters.map(([id,label])=>`<button class="chip ${id==='all'?'active':''}" data-filter="${id}" aria-pressed="${id==='all'}">${label}</button>`).join('');
function renderDistros(){const q=$('#distro-search').value.trim().toLowerCase();const list=distros.filter(d=>(activeDistroFilter==='all'||d.filters.includes(activeDistroFilter))&&`${d.name} ${d.base} ${d.pkg} ${d.init} ${d.desc} ${window.DanV2?.i18n?.t(d.desc)||''} ${window.DanV2?.i18n?.t(d.who)||''}`.toLowerCase().includes(q));$('#distro-count').textContent=`${list.length} из ${distros.length} дистрибутивов`;$('#distro-grid').innerHTML=list.length?list.map(d=>`<button class="distro-card" data-open-distro="${d.id}" style="--distro-color:${d.color}" aria-label="подробнее: ${d.name}"><span class="card-top"><img src="${logo(d.id)}" alt="" width="36" height="36" loading="lazy"><span>${d.release.includes('rolling')?'rolling':'release'}</span></span><h3>${d.name}</h3><p>${d.who}</p><span class="card-meta"><span>${d.base.split(' · ')[0]}</span><span aria-hidden="true">+</span></span></button>`).join(''):'<div class="empty">такой системы пока не нашлось.<button id="reset-distros">сбросить поиск и фильтр</button></div>';const reset=$('#reset-distros');if(reset)reset.onclick=()=>{$('#distro-search').value='';setDistroFilter('all')};}
function setDistroFilter(value){activeDistroFilter=value;$$('#distro-filters button').forEach(b=>{b.classList.toggle('active',b.dataset.filter===value);b.setAttribute('aria-pressed',String(b.dataset.filter===value))});renderDistros()}
$('#distro-search').addEventListener('input',renderDistros);$('#distro-filters').onclick=e=>{const b=e.target.closest('[data-filter]');if(b)setDistroFilter(b.dataset.filter)};renderDistros();

const categories=[...new Set(apps.map(a=>a[1]))];$('#app-category').innerHTML+=categories.map(x=>`<option value="${x}">${x}</option>`).join('');
let appLimit=9;
const pagination=document.createElement('div');pagination.className='app-pagination';pagination.style.cssText='text-align:center;margin-top:25px';$('#app-grid').after(pagination);
function renderApps(){const q=$('#app-search').value.toLowerCase().trim(),category=$('#app-category').value;const list=apps.filter(a=>(category==='all'||a[1]===category)&&`${a[0]} ${a[2].map(x=>x[0]+' '+x[4]+' '+(window.DanV2?.i18n?.t(x[4])||'')).join(' ')}`.toLowerCase().includes(q));$('#app-count').textContent=`${list.length} из ${apps.length} групп · показано ${Math.min(appLimit,list.length)}`;$('#app-grid').innerHTML=list.length?list.slice(0,appLimit).map(a=>`<article class="app-card"><div class="app-original"><span>вместо ${a[0]}</span><b>${a[1]}</b></div>${a[2].map(p=>`<div class="app-option"><div class="app-heading"><img src="${logo(p[1])}" alt="логотип ${p[0]}" width="27" height="27" loading="lazy"><a href="${p[2]}" target="_blank" rel="noopener">${p[0]}</a></div><p>${p[4]}</p><span class="platforms">${p[3]}</span></div>`).join('')}</article>`).join(''):'<div class="empty">ничего не найдено. попробуй название оригинала или альтернативы.<button id="reset-apps">сбросить поиск и категорию</button></div>';pagination.innerHTML=list.length>appLimit?`<button class="button" id="more-apps">показать ещё ${Math.min(9,list.length-appLimit)} групп</button>`:'';if($('#more-apps'))$('#more-apps').onclick=()=>{appLimit+=9;renderApps()};if($('#reset-apps'))$('#reset-apps').onclick=()=>{$('#app-search').value='';$('#app-category').value='all';appLimit=9;renderApps()};}
$('#app-search').oninput=()=>{appLimit=9;renderApps()};$('#app-category').onchange=()=>{appLimit=9;renderApps()};renderApps();

// seven answers influence a deterministic, transparent recommendation heuristic.
const questions=[
['пользовался ли ты Linux раньше?',[['new','нет, пока только Windows'],['some','немного пробовал'],['expert','да, чувствую себя уверенно']]],
['сколько оперативной памяти у компьютера?',[['low','меньше 4 ГБ'],['mid','4–8 ГБ'],['high','16 ГБ и больше'],['unknown','не знаю / другое значение']]],
['насколько хочешь всё настроить под себя?',[['simple','мне хватит обоев и темы'],['medium','хочу удобный личный рабочий стол'],['deep','хочу контролировать каждый компонент']]],
['готов пользоваться терминалом?',[['no','лучше через понятные кнопки'],['learn','готов учиться постепенно'],['yes','да, терминал мне нравится']]],
['для чего тебе компьютер?',[['daily','учёба, браузер и повседневные дела'],['gaming','в основном для игр'],['dev','для программирования'],['explore','хочу изучать устройство Linux']]],
['какие обновления тебе ближе?',[['stable','предсказуемость и стабильность'],['fresh','самые свежие пакеты'],['either','пока не знаю — посоветуйте']]],
['готовая система или собственная сборка?',[['ready','готовая: установить и пользоваться'],['balanced','готовая база, дальше разберусь'],['build','хочу самостоятельно собрать окружение']]]
];
let answers=Array(7).fill(null),quizStep=0,quizDone=false;
try{const saved=JSON.parse(storage.get('dan-quiz','null'));if(saved&&Array.isArray(saved.answers)&&saved.answers.length===7){answers=saved.answers.map((v,i)=>questions[i][1].some(x=>x[0]===v)?v:null);quizDone=!!saved.done&&answers.every(Boolean);quizStep=quizDone?7:Math.max(0,Math.min(6,saved.step||0))}}catch{}
function saveQuiz(){storage.set('dan-quiz',JSON.stringify({answers,step:quizStep,done:quizDone}))}
function recommend(a){const [experience,ram,custom,terminal,purpose,updates,setup]=a;let candidates=distros.map(d=>({d,score:0,reasons:[]}));for(const c of candidates){const d=c.d;const add=(n,s)=>{c.score+=n;if(s)c.reasons.push(s)};
 if(d.filters.includes('beginner'))add(experience==='new'?8:2,experience==='new'?'удобный старт после Windows':null);
 if(experience==='expert'&&d.level==='сложная')add(4,'есть пространство для глубокого изучения');
 if(experience==='some'&&d.level==='средняя')add(3,'подходит для следующего шага после знакомства с Linux');
 if(ram==='low'&&d.filters.includes('light'))add(7,'можно выбрать лёгкое окружение и сократить фоновые службы');
 if(ram==='low'&&['zorin','pop','bazzite','omarchy','cachy'].includes(d.id))add(-20);
 if(ram==='mid'&&['mint','debian','ubuntu','fedora'].includes(d.id))add(2,'есть выбор окружений под доступную память');
 if(ram==='high'&&['pop','bazzite','zorin'].includes(d.id))add(2,'готовый рабочий стол подходит для дальнейшей проверки на твоём ПК');
 if(custom==='deep'&&d.filters.includes('minimal'))add(5,'можно самому выбирать компоненты системы');
 if(custom==='simple'&&d.filters.includes('beginner'))add(5,'многое уже настроено');
 if(custom==='medium'&&['fedora','mint','zorin','pop','endeavour'].includes(d.id))add(3,'готовое окружение можно адаптировать под себя');
 if(terminal==='no'&&d.level==='простая')add(6,'основные повседневные действия доступны через интерфейс');
 if(terminal==='learn'&&d.level!=='сложная')add(2,'можно осваивать терминал постепенно');
 if(terminal==='yes'&&d.filters.includes('dev'))add(2,'терминал хорошо вписывается в рабочий процесс');
 if(purpose==='gaming'&&d.filters.includes('gaming'))add(12,'есть подготовленные игровые инструменты или настройки');
 if(purpose==='gaming'&&['gentoo','alpine','void','artix'].includes(d.id))add(-12);
 if(purpose==='dev'&&d.filters.includes('dev'))add(5,'подходит для разработки и работы с пакетами');
 if(purpose==='daily'&&d.filters.includes('beginner'))add(5,'хорошо подходит для браузера, учёбы и обычных задач');
 if(purpose==='explore'&&d.filters.includes('minimal'))add(5,'можно разобраться, из чего состоит система');
 if(updates==='fresh'&&d.filters.includes('rolling'))add(7,'rolling release даёт свежие версии без крупных переустановок');
 if(updates==='fresh'&&d.id==='fedora')add(4,'современное ПО в регулярных выпусках');
 if(updates==='stable'&&!d.filters.includes('rolling'))add(5,'можно выбрать ветку с фиксированными выпусками');
 if(updates==='stable'&&d.filters.includes('rolling'))add(-6);
 if(setup==='ready'&&d.filters.includes('beginner'))add(7,'система готова к работе после установки');
 if(setup==='balanced'&&['endeavour','fedora','debian','mint','cachy'].includes(d.id))add(4,'удобная база для последующей настройки');
 if(setup==='build'&&d.filters.includes('minimal'))add(8,'позволяет собрать собственное окружение');
 if(setup==='build'&&['arch','gentoo','void'].includes(d.id))add(3);
 if(d.id==='alpine')add(-5); // container-first design is rarely the first desktop recommendation.
 }
 // avoid recommending maintenance-heavy systems when the visitor asks for a ready GUI.
 candidates=candidates.filter(c=>!(terminal==='no'&&c.d.level!=='простая')&&!(experience==='new'&&c.d.level==='сложная'&&(terminal!=='yes'||setup!=='build')));
 if(ram==='low'){candidates=candidates.filter(c=>!['zorin','pop','bazzite','omarchy','cachy'].includes(c.d.id));for(const c of candidates){if(['mint','debian','ubuntu','fedora'].includes(c.d.id)){c.score+=5;c.reasons.unshift('для небольшого объёма RAM выбери редакцию Xfce')}}}
 return candidates.sort((a,b)=>b.score-a.score||a.d.name.localeCompare(b.d.name)).slice(0,3).map(c=>({...c,reasons:[...new Set(c.reasons)].slice(0,3)}));
}
function renderQuiz(){const box=$('#quiz-box');if(quizDone){const result=recommend(answers);box.innerHTML=`<div class="quiz-progress-label"><span>подбор завершён</span><span>7 / 7</span></div><h3>три варианта для тебя.</h3>${result.map(c=>`<article class="result-card"><img src="${logo(c.d.id)}" alt=""><div><h4>${c.d.name}${answers[1]==='low'&&['mint','debian','fedora'].includes(c.d.id)?' · Xfce':answers[1]==='low'&&c.d.id==='ubuntu'?' · вариант Xubuntu':''}</h4><p>${c.reasons.join('; ')}.</p><button data-open-distro="${c.d.id}">изучить особенности</button></div></article>`).join('')}<p class="result-note">${answers[4]==='gaming'?'сначала проверь свои игры и античиты: Linux не запускает каждую Windows-игру. ':''}${answers[1]==='low'?'при RAM меньше 4 ГБ современный браузер всё равно может быть узким местом. ':''}${answers[1]==='unknown'?'перед установкой узнай RAM и модель процессора. ':''}попробуй live-USB и проверь Wi-Fi, звук и видеокарту. сохрани резервную копию.</p><button class="button" id="quiz-restart">пройти ещё раз</button>`;$('#quiz-restart').onclick=()=>{answers=Array(7).fill(null);quizStep=0;quizDone=false;saveQuiz();renderQuiz()};return}
 const q=questions[quizStep];box.innerHTML=`<div class="quiz-progress-label"><span>твой маршрут</span><span>вопрос ${quizStep+1} из 7</span></div><div class="quiz-progress" aria-hidden="true">${questions.map((_,i)=>`<i class="${i<=quizStep?'done':''}"></i>`).join('')}</div><h3 id="quiz-question" tabindex="-1">${q[0]}</h3><div class="quiz-options" role="group" aria-labelledby="quiz-question">${q[1].map(([id,text])=>`<button class="quiz-option ${answers[quizStep]===id?'selected':''}" data-answer="${id}" aria-pressed="${answers[quizStep]===id}">${text}</button>`).join('')}</div><div class="quiz-controls"><button id="quiz-back" ${quizStep===0?'disabled':''}>назад</button><button class="button primary" id="quiz-next" ${answers[quizStep]?'':'disabled'}>${quizStep===6?'показать результат':'дальше'}</button></div>`;
 $$('.quiz-option',box).forEach(b=>b.onclick=()=>{answers[quizStep]=b.dataset.answer;saveQuiz();$$('.quiz-option',box).forEach(o=>{o.classList.toggle('selected',o===b);o.setAttribute('aria-pressed',String(o===b))});$('#quiz-next').disabled=false});$('#quiz-back').onclick=()=>{if(quizStep>0){quizStep--;saveQuiz();renderQuiz();$('#quiz-question').focus({preventScroll:true})}};$('#quiz-next').onclick=()=>{if(!answers[quizStep])return;quizStep++;if(quizStep===7)quizDone=true;saveQuiz();renderQuiz();if(quizDone){box.setAttribute('tabindex','-1');box.focus({preventScroll:true})}else $('#quiz-question').focus({preventScroll:true})};
}
renderQuiz();

const output=$('#terminal-output'),terminalInput=$('#terminal-input');let history=[],historyIndex=0;
const archAscii=String.raw`                   /\
                  /  \
                 /\   \
                /      \
               /   ,,   \
              /   |  |  -\
             /_-''    ''-_\
`;
function terminalPrint(text,cls=''){const pre=document.createElement('pre');pre.className=cls;pre.textContent=text;output.append(pre);while(output.children.length>100)output.firstElementChild.remove();output.scrollTop=output.scrollHeight}
function welcome(){terminalPrint('welcome to freedom.\nсимулятор терминала · никаких команд на твоём компьютере.\nнапиши help или попробуй fastfetch.','terminal-success')}
function runCommand(raw){const value=raw.trim();if(!value)return;history.push(value);history=history.slice(-80);historyIndex=history.length;if(window.DanV2?.shellUI){window.DanV2.shellUI.run(value);return;}terminalPrint(`guest@linux:~$ ${value}`,'prompt');const [cmd,...parts]=value.split(/\s+/);const arg=value.slice(cmd.length).trim();
 switch(cmd.toLowerCase()){
 case 'help':terminalPrint('help          — список команд\nfastfetch     — немного системной эстетики\nneofetch      — тот самый старый друг\nls            — посмотреть файлы\npwd           — где я?\nwhoami        — кто я?\necho [текст]  — повторить текст\nclear         — очистить экран\nuname [-a]    — ядро симулятора\ni use arch btw — сообщить важное\n\n↑ / ↓ — история команд. Tab — дополнение.\nподсказка: у шоколада бывает необычная форма.');break;
 case 'fastfetch':case 'neofetch':terminalPrint(`${archAscii}\n\n  guest@freedom\n  ────────────────────────────────\n  OS       Arch Linux (browser edition)\n  Host     Dan’s corner of the internet\n  Kernel   Linux imagination\n  Shell    safe-sim 1.0\n  DE       your choice\n  Uptime   since you got curious\n  Packages freedom + a few cookies\n  Memory   enough for one chocolate trapezoid\n\n  вся информация выше — шутка, не данные твоего ПК.`,'terminal-accent');break;
 case 'ls':terminalPrint('Desktop/    Documents/    freedom.txt\narch-wiki.url    chocolate-trapezoid.recipe');break;
 case 'pwd':terminalPrint('/home/guest');break;
 case 'whoami':terminalPrint('guest — будущий ценитель свободы выбора.');break;
 case 'echo':{let t=arg;if(t.length>=2&&((t.startsWith('"')&&t.endsWith('"'))||(t.startsWith("'")&&t.endsWith("'"))))t=t.slice(1,-1);terminalPrint(t);break;}
 case 'clear':output.replaceChildren();break;
 case 'uname':terminalPrint(parts.includes('-a')?'Linux freedom browser-sim x86_imagination GNU/fun':'Linux (browser simulator)');break;
 default:if(value.toLowerCase()==='i use arch btw'||value.toLowerCase()==='i use arch btw.'){terminalPrint('i use arch btw.\nтеперь все знают. миссия выполнена.','terminal-accent');toast('i use arch btw.')}else if(value.toLowerCase()==='chocolate trapezoid'){terminalPrint('шоколадная трапеция материализована.\nS = (a + b) × h / 2. вкус = 100%.','terminal-success');const bar=document.createElement('div');bar.className='chocolate';bar.setAttribute('role','img');bar.setAttribute('aria-label','шоколадная трапеция');output.append(bar);output.scrollTop=output.scrollHeight;toast('шоколадная трапеция. одобрено Даном.')}else{terminalPrint(`${cmd}: команда не найдена. напиши help.\nэто симулятор; системные команды здесь не выполняются.`)}
 }}
welcome();$('#terminal-form').onsubmit=e=>{e.preventDefault();runCommand(terminalInput.value);terminalInput.value='';terminalInput.focus({preventScroll:true})};
terminalInput.onkeydown=e=>{if(e.key==='ArrowUp'){e.preventDefault();historyIndex=Math.max(0,historyIndex-1);terminalInput.value=history[historyIndex]||''}if(e.key==='ArrowDown'){e.preventDefault();historyIndex=Math.min(history.length,historyIndex+1);terminalInput.value=history[historyIndex]||''}if(e.key==='Tab'){const commands=['help','fastfetch','neofetch','ls','pwd','whoami','echo','clear','uname','i use arch btw','chocolate trapezoid','chocolate-trapezoid','sl','fortune','cd','mkdir','touch','cat','cp','mv','grep','chmod','sudo whoami','makepkg -si'];const matches=commands.filter(c=>c.startsWith(terminalInput.value)&&terminalInput.value);if(matches.length===1){e.preventDefault();terminalInput.value=matches[0]}}};
$$('[data-command]').forEach(b=>b.onclick=()=>{runCommand(b.dataset.command);terminalInput.focus({preventScroll:true})});

$('#myth-list').innerHTML=myths.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('');
let archClicks=0,tuxClicks=0;
$('#arch-secret').onclick=()=>{archClicks++;if(archClicks%5===0)toast('i use arch btw. теперь официально.');else if(archClicks===1)toast('Arch заметил твоё внимание…')};
$('#compiler-secret').onclick=()=>toast('I compiled my compiler to compile a compiler');
$('#tux').onclick=()=>{const t=$('#tux');t.classList.remove('hop');void t.offsetWidth;t.classList.add('hop');const phrases=['привет! я Tux. свобода тебе к лицу.','пингвин не осуждает твой выбор дистро.','можно начать с Firefox. серьёзно.','psst… chocolate trapezoid. попробуй в терминале.','i use fish btw. настоящую рыбу.'];toast(phrases[tuxClicks++%phrases.length])};
$$('[data-demo]').forEach(b=>b.onclick=()=>{const title=$('#demo-title'),content=$('#demo-content');switch(b.dataset.demo){case 'browser':title.textContent='Firefox';content.innerHTML=`<img src="${logo('firefox')}" alt="Firefox"><h3>интернет на месте.</h3><p>вкладки, закладки и любимые сайты — как обычно.</p><a class="text-link" href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener">познакомиться с Firefox</a>`;break;case 'files':title.textContent='файлы · /home/dan';content.innerHTML='<h3>Desktop / Documents / Downloads</h3><p>твои папки. только без диска C:.</p><p>home — твоя домашняя директория.</p>';break;case 'settings':title.textContent='внешний вид';content.innerHTML='<h3>тема меняется одной кнопкой.</h3><p>никакой команды в терминале.</p><button id="demo-theme">переключить тему сайта</button>';$('#demo-theme').onclick=()=>themeButton.click();break;case 'terminal':$('#terminal').scrollIntoView();terminalInput.focus({preventScroll:true});break;}});
$('#sources-button').onclick=()=>showDialog(`<span class="eyebrow accent">читай первоисточники</span><h2 id="modal-title">открытые источники.</h2><p class="dialog-desc">характеристики сверены 24 ноября 2026. версии и требования меняются: перед установкой проверь документацию проекта. личный рейтинг и оценки удобства — мнение Дана.</p><ul class="sources-list">${distros.map(d=>`<li><a href="${d.url}" target="_blank" rel="noopener">${d.name}</a></li>`).join('')}<li><a href="https://opensource.org/osd" target="_blank" rel="noopener">Open Source Definition</a></li><li><a href="https://www.gnu.org/philosophy/free-sw.html" target="_blank" rel="noopener">четыре свободы GNU</a></li><li><a href="https://www.gnu.org/licenses/" target="_blank" rel="noopener">лицензии GNU</a></li><li><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener">Apache 2.0</a></li><li><a href="https://www.protondb.com/" target="_blank" rel="noopener">ProtonDB</a></li><li><a href="https://areweanticheatyet.com/" target="_blank" rel="noopener">Are We Anti-Cheat Yet</a></li></ul><p class="footnote">ссылки на программы находятся в карточках альтернатив. логотипы принадлежат соответствующим проектам; локальные копии получены из Simple Icons, Dashboard Icons и с официальных сайтов. шрифт Inter — SIL Open Font License. сайт не связан с разработчиками дистрибутивов.</p>`);

if('IntersectionObserver' in window){const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!reduce){document.documentElement.classList.add('js-motion');const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');reveal.unobserve(e.target)}}),{threshold:.035});$$('.reveal').forEach(e=>reveal.observe(e))}const sections=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)$$('#navigation a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id))})},{rootMargin:'-10% 0px -65% 0px',threshold:0});$$('main>section[id]').forEach(e=>sections.observe(e))}

// Narrow bridge: retain the original UI and terminal controls.
window.DanLegacy={toast,logo,openDistro,runCommand,terminalPrint,output,terminalInput,archAscii,showDialog};
