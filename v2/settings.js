/* Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
(function(root){
 'use strict';
 const app=root.DanV2, html=document.documentElement;
 const read=(key,fallback)=>{try{return localStorage.getItem(key)||fallback;}catch{return fallback;}};
 const write=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
 const valid=value=>['auto','ru','en'].includes(value)?value:'auto';
 const countryLanguage=country=>['RU','BY','KZ','KG','TJ','UZ'].includes(String(country).toUpperCase())?'ru':'en';
 const browserLanguage=languages=>(languages||[]).some(value=>/^ru(?:-|$)/i.test(value))?'ru':'en';
 let preference=valid(read('dan-language','auto')),generation=0,controller,cache=null;
 try{cache=JSON.parse(read('dan-language-country','null'));}catch{}
 const validCache=cache&&/^[A-Z]{2}$/.test(cache.country)&&Number.isFinite(cache.at)&&Date.now()-cache.at>=0&&Date.now()-cache.at<86400000;
 let autoLanguage=validCache?countryLanguage(cache.country):browserLanguage(navigator.languages||[navigator.language]);
 let source=validCache?'country':'browser',current=preference==='auto'?autoLanguage:preference;
 const records=new WeakMap(),attributeRecords=new WeakMap();
 const ignored='script,style,code,pre,kbd,samp,textarea,[data-user-content],[data-no-translate],svg';
 const normalize=value=>String(value).replace(/\s+/g,' ').trim();
 function translate(value,language=current){
  if(language!=='en')return String(value);
  const raw=String(value),key=normalize(raw),translated=app.english?.[key];
  if(translated!==undefined)return raw.replace(raw.trim(),translated);
  for(const [pattern,replace] of app.englishPatterns||[]){if(pattern.test(key))return key.replace(pattern,replace);}
  if(key.includes('; ')){const parts=key.split('; '),result=parts.map(part=>translate(part.replace(/\.$/,''),'en'));if(result.some((part,i)=>part!==parts[i].replace(/\.$/,'')))return result.join('; ')+(key.endsWith('.')?'.':'');}
  if(key.includes(' · ')){const parts=key.split(' · '),result=parts.map(part=>translate(part,'en'));if(result.some((part,i)=>part!==parts[i]))return result.join(' · ');}
  if(key.includes(', ')){const parts=key.split(', '),result=parts.map(part=>app.english?.[part]||part);if(result.some((part,i)=>part!==parts[i]))return result.join(', ');}
  if(key.includes(': ')){const parts=key.split(': ');if(app.english?.[parts[0]])return app.english[parts[0]]+': '+translate(parts.slice(1).join(': '),'en');}
  return raw;
 }
 function protectedNode(node){return node.parentElement?.closest(ignored);}
 function translateNode(node){
  if(protectedNode(node))return;
  const value=node.nodeValue;let record=records.get(node);
  if(!record||value!==record.last)record={original:value,last:value};
  const result=translate(record.original);if(value!==result)node.nodeValue=result;
  record.last=result;records.set(node,record);
 }
 function translateAttributes(element){
  if(element.closest(ignored)||['INPUT','TEXTAREA'].includes(element.tagName)&&element.hasAttribute('data-user-content'))return;
  let data=attributeRecords.get(element);if(!data){data={};attributeRecords.set(element,data);}
  for(const name of ['aria-label','title','placeholder','alt']){
   if(!element.hasAttribute(name))continue;
   const value=element.getAttribute(name);let record=data[name];if(!record||value!==record.last)record={original:value,last:value};
   const next=translate(record.original);if(value!==next)element.setAttribute(name,next);record.last=next;data[name]=record;
  }
 }
 function renderTree(node){
  if(node.nodeType===3){translateNode(node);return;}
  if(node.nodeType!==1||node.closest(ignored))return;
  translateAttributes(node);
  for(const child of node.childNodes)renderTree(child);
 }
 let observer;
 function refresh(){
  observer?.disconnect();renderTree(document.body);syncSettings();observe();
 }
 function observe(){observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']});}
 function apply(){
  current=preference==='auto'?autoLanguage:preference;html.lang=current;html.dataset.language=current;
  refresh();app.emit('dan-language-changed',{language:current,preference});
 }
 async function resolveAuto(){
  const revision=++generation;controller?.abort();
  if(preference!=='auto'||validCache&&source==='country')return;
  controller=new AbortController();const requestController=controller;const timer=setTimeout(()=>requestController.abort(),2500);
  try{
   const response=await fetch('https://api.country.is/',{signal:requestController.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
   if(!response.ok)throw new Error('country unavailable');
   const country=(await response.json()).country;
   if(!/^[A-Z]{2}$/.test(country))throw new Error('invalid country');
   if(revision!==generation||preference!=='auto')return;
   autoLanguage=countryLanguage(country);source='country';write('dan-language-country',JSON.stringify({country,at:Date.now()}));apply();
  }catch{if(revision===generation&&preference==='auto'){source='browser';apply();}}
  finally{clearTimeout(timer);}
 }
 function choose(value){preference=valid(value);write('dan-language',preference);generation++;controller?.abort();apply();if(preference==='auto')void resolveAuto();}
 function setTheme(light){
  const desired=light?'light':'dark';if(html.dataset.theme!==desired)document.querySelector('#theme')?.click();syncSettings();
 }
 function syncSettings(){
  const select=document.querySelector('#settings-language'),toggle=document.querySelector('#settings-light');
  languageButton.textContent=current.toUpperCase();languageButton.setAttribute('aria-label',current==='ru'?'switch to English':'переключить на русский');languageButton.title=current==='ru'?'English':'русский';languageButton.setAttribute('lang',current);
  if(select)select.value=preference;
  if(toggle)toggle.checked=html.dataset.theme==='light';
  const state=document.querySelector('#settings-detection');
  if(state)state.textContent=current==='en'?(preference==='auto'?`English · ${source==='country'?'country by IP':'browser language'}`:'English · selected manually'):(preference==='auto'?`русский · ${source==='country'?'страна по IP':'язык браузера'}`:'русский · выбран вручную');
 }
 const languageButton=document.createElement('button');languageButton.id='language-button';languageButton.className='settings-language-short';languageButton.type='button';languageButton.setAttribute('data-no-translate','');languageButton.onclick=()=>choose(current==='ru'?'en':'ru');document.querySelector('.nav-tools')?.insertBefore(languageButton,document.querySelector('#theme'));
 const button=document.createElement('button');button.id='settings-button';button.className='icon-button';button.setAttribute('aria-label','настройки');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','settings-dialog');button.title='настройки';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 3-.6 2.3-2.1 1.2L4 6l-2 3.5 1.7 1.7v2.5L2 15.5 4 19l2.3-.5 2.1 1.2L9 22h4l.6-2.3 2.1-1.2 2.3.5 2-3.5-1.7-1.8v-2.5L20 9l-2-3.5-2.3.5-2.1-1.2L13 3Z"/><circle cx="11" cy="12.5" r="3"/></svg>';
 document.querySelector('.nav-tools')?.insertBefore(button,document.querySelector('#theme'));
 const dialog=document.createElement('dialog');dialog.id='settings-dialog';dialog.className='dan-settings';dialog.setAttribute('aria-labelledby','settings-title');dialog.innerHTML='<div class="settings-heading"><h2 id="settings-title">настройки</h2><button id="settings-close" class="icon-button" aria-label="закрыть настройки">×</button></div><p class="muted">твой интерфейс. твой выбор.</p><div class="settings-theme-row"><div><b>светлая тема</b><p class="v2-help">выключи переключатель для тёмной темы.</p></div><label class="settings-switch"><input id="settings-light" type="checkbox" role="switch" aria-label="светлая тема"><span aria-hidden="true"></span></label></div><label class="v2-field" for="settings-language">язык интерфейса<select id="settings-language"><option value="auto">автоматически · по IP</option><option value="ru" lang="ru" data-no-translate>русский</option><option value="en" lang="en" data-no-translate>English</option></select></label><p id="settings-detection" class="settings-detection" role="status" data-no-translate></p><p class="v2-help">в автоматическом режиме страна определяется через country.is. сервис получает IP запроса; сайт сохраняет только код страны на 24 часа. если сервис недоступен, используем язык браузера. VPN может изменить результат.</p><p class="v2-help">для России, Беларуси, Казахстана, Кыргызстана, Таджикистана и Узбекистана выбираем русский; для остальных стран — English. язык можно изменить вручную.</p><p class="v2-help">выбор сохраняется на этом устройстве и действует также в Share. тексты пользователей остаются в оригинале.</p>';
 document.body.append(dialog);button.onclick=()=>{syncSettings();dialog.showModal();};
 document.querySelector('#settings-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>button.focus({preventScroll:true}));
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 document.querySelector('#settings-language').onchange=event=>choose(event.target.value);
 document.querySelector('#settings-light').onchange=event=>setTheme(event.target.checked);
 new MutationObserver(syncSettings).observe(html,{attributes:true,attributeFilter:['data-theme']});
 observer=new MutationObserver(mutations=>{
  observer.disconnect();
  for(const mutation of mutations){if(mutation.type==='characterData')translateNode(mutation.target);else if(mutation.type==='attributes')translateAttributes(mutation.target);else for(const node of mutation.addedNodes)renderTree(node);}
  observe();
 });
 root.addEventListener('storage',event=>{if(event.key==='dan-language'){preference=valid(event.newValue);generation++;controller?.abort();apply();if(preference==='auto')void resolveAuto();}if(event.key==='dan-theme'&&['dark','light'].includes(event.newValue))setTheme(event.newValue==='light');});
 app.i18n={t:translate,choose,refresh,countryLanguage,browserLanguage,get language(){return current;},get preference(){return preference;}};
 apply();if(preference==='auto')void resolveAuto();
})(globalThis);
