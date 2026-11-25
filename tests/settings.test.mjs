import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
class Element{
 constructor(tag='div',attrs={}){this.nodeType=1;this.tagName=tag.toUpperCase();this.attrs={...attrs};this.childNodes=[];this.dataset={};this.style={};this.checked=false;this.value='';}
 append(...children){for(const n of children){n.parentElement=this;this.childNodes.push(n);}}
 insertBefore(n){this.append(n);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 getAttribute(k){return this.attrs[k]??null;}
 hasAttribute(k){return k in this.attrs;}
 removeAttribute(k){delete this.attrs[k];}
 closest(selectors){for(let e=this;e;e=e.parentElement)if(selectors.split(',').some(s=>s.startsWith('[')?e.hasAttribute(s.slice(1,-1)):e.tagName.toLowerCase()===s))return e;return null;}
 set textContent(value){this.childNodes=[];this.append({nodeType:3,nodeValue:String(value)});}
 get textContent(){return this.childNodes.map(n=>n.nodeValue??n.textContent).join('');}
 click(){this.onclick?.();}
 addEventListener(){}focus(){}showModal(){this.open=true;}close(){this.open=false;}
}
function setup({saved={},languages=['ru-RU'],fetcher=async()=>({ok:true,json:async()=>({country:'KZ',ip:'discard-me'})}),blocked=false}={}){
 const body=new Element('body'),html=new Element('html');html.dataset.theme='dark';const ids=new Map();
 for(const id of ['theme','settings-language','settings-light','settings-detection','settings-close']){const n=new Element(id==='settings-language'?'select':'button');ids.set('#'+id,n);body.append(n);}
 const nav=new Element('div');body.append(nav);ids.set('.nav-tools',nav);
 ids.get('#theme').onclick=()=>{html.dataset.theme=html.dataset.theme==='dark'?'light':'dark';};
 const text=new Element('p');text.textContent='профиль';body.append(text);
 const code=new Element('code');code.textContent='профиль';body.append(code);
 const user=new Element('p',{'data-user-content':''});user.textContent='профиль';body.append(user);
 const input=new Element('input',{placeholder:'найти дистрибутив…'});input.value='мой несохранённый текст';body.append(input);
 const data=new Map(Object.entries(saved)),requests=[],events={},observers=[];
 const context=vm.createContext({console,Date,Map,WeakMap,Set,Promise,AbortController,navigator:{languages},localStorage:{getItem:k=>{if(blocked)throw Error();return data.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error();data.set(k,v);}},document:{documentElement:html,body,createElement:tag=>new Element(tag),querySelector:selector=>ids.get(selector)||null},MutationObserver:class{constructor(fn){this.fn=fn;observers.push(this);}observe(){}disconnect(){}},setTimeout,clearTimeout,addEventListener:(name,fn)=>{events[name]=fn;},fetch:async(...args)=>{requests.push(args);return fetcher(...args);}});
 for(const file of ['data.js','v2/core.js','v2/academy-data.js','v2/english.js','v2/english-content.js','v2/english-academy.js','v2/settings.js'])vm.runInContext(read(file),context);
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 return {app:context.DanV2,context,html,body,text,code,user,input,data,requests,events,ids,observers,flush};
}
test('RU/EN translation is reversible, keeps draft values, code and authored content intact',()=>{
 const s=setup({saved:{'dan-language':'en'}});assert.equal(s.html.lang,'en');assert.equal(s.text.textContent,'profile');assert.equal(s.input.getAttribute('placeholder'),'find a distribution…');assert.equal(s.input.value,'мой несохранённый текст');assert.equal(s.code.textContent,'профиль');assert.equal(s.user.textContent,'профиль');assert.equal(s.requests.length,0);
 s.app.i18n.choose('ru');assert.equal(s.text.textContent,'профиль');assert.equal(s.input.getAttribute('placeholder'),'найти дистрибутив…');
 s.text.textContent='новая запись';s.app.i18n.choose('en');assert.equal(s.text.textContent,'new post');s.app.i18n.choose('ru');assert.equal(s.text.textContent,'новая запись');
 s.app.i18n.choose('en');const dynamic=new Element('button');dynamic.textContent='отправить на проверку';s.body.append(dynamic);s.observers.at(-1).fn([{type:'childList',addedNodes:[dynamic]}]);assert.equal(dynamic.textContent,'submit for review');
 s.ids.get('#settings-light').onchange({target:{checked:true}});assert.equal(s.html.dataset.theme,'light');assert.equal(s.ids.get('#settings-light').checked,true);
 s.app.i18n.choose('ru');assert.equal(dynamic.textContent,'отправить на проверку');
 const shortcut=s.ids.get('.nav-tools').childNodes.find(n=>n.id==='language-button');assert.equal(shortcut.textContent,'RU');shortcut.click();assert.equal(s.html.lang,'en');assert.equal(shortcut.textContent,'EN');assert.equal(s.data.get('dan-language'),'en');shortcut.click();assert.equal(s.html.lang,'ru');
});
test('country detection caches only country and timestamp, browser fallback and manual override win races',async()=>{
 const automatic=setup();await automatic.flush();assert.equal(automatic.html.lang,'ru');assert.deepEqual(Object.keys(JSON.parse(automatic.data.get('dan-language-country'))).sort(),['at','country']);assert.equal(automatic.requests[0][1].credentials,'omit');assert.equal(automatic.requests[0][1].referrerPolicy,'no-referrer');assert.ok(![...automatic.data.values()].some(x=>x.includes('discard-me')));
 const cached=setup({saved:{'dan-language-country':JSON.stringify({country:'US',at:Date.now()})}});assert.equal(cached.html.lang,'en');assert.equal(cached.requests.length,0);
 const fallback=setup({languages:['en-US'],fetcher:async()=>{throw Error('offline');}});await fallback.flush();assert.equal(fallback.html.lang,'en');
 let finish;const race=setup({fetcher:()=>new Promise(resolve=>finish=resolve)});race.app.i18n.choose('ru');finish({ok:true,json:async()=>({country:'US'})});await race.flush();assert.equal(race.html.lang,'ru');assert.equal(race.data.get('dan-language'),'ru');assert.equal(race.data.has('dan-language-country'),false);
 const blocked=setup({blocked:true,fetcher:async()=>{throw Error();}});await blocked.flush();assert.equal(blocked.html.lang,'ru');blocked.app.i18n.choose('en');assert.equal(blocked.html.lang,'en');
});
test('English covers the complete catalog, lessons and quiz explanations without changing IDs or answers',()=>{
 const s=setup({saved:{'dan-language':'en'}}),app=s.app;let checked=0;
 const covered=value=>{if(/[а-яё]/i.test(value)){assert.ok(app.english[value.replace(/\s+/g,' ').trim()],value);assert.ok(!/[а-яё]/i.test(app.i18n.t(value)),value);checked++;}};
 for(const lesson of app.lessons){covered(lesson.title);lesson.body.forEach(covered);covered(lesson.practice.prompt);covered(lesson.quiz.question);for(const o of [...lesson.practice.options||[],...lesson.quiz.options]){covered(o.label);covered(o.why);}}
 const data=vm.runInContext('({distros,apps,comparisons,myths})',s.context);
 for(const d of data.distros){[d.desc,d.who,...d.pros,...d.cons].forEach(covered);}
 for(const row of data.apps)for(const alternative of row[2])covered(alternative[4]);
 for(const row of data.comparisons)[row[0],...row.slice(2)].forEach(covered);for(const row of data.myths)row.forEach(covered);
 const baseline=vm.createContext({});vm.runInContext(read('v2/core.js')+read('v2/academy-data.js'),baseline);assert.equal(JSON.stringify(app.lessons),JSON.stringify(baseline.DanV2.lessons));assert.ok(checked>400);assert.equal(app.i18n.t('7 из 26 уроков'),'7 of 26 lessons');
 s.events.storage({key:'dan-language',newValue:'ru'});assert.equal(s.html.lang,'ru');
});
