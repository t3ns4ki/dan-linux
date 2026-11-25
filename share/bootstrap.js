/* Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
(function(root){
  'use strict';
  let timer;
  root.DanLegacy={
    logo:id=>'assets/'+id+'.'+(id==='linux'?'png':'svg'),
    toast(message){const box=document.querySelector('#toast');box.textContent=message;box.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>box.classList.remove('show'),4200);}
  };
  const store=root.DanV2.store,button=document.querySelector('#theme');
  const colors={'#54b8ee':'#126a98','#b9a3e3':'#71569e','#e8799c':'#ad335d','#f39a63':'#9c491c','#a2c879':'#456f23'};
  function apply(){let theme='dark',accent='#54b8ee';try{theme=localStorage.getItem('dan-theme')||theme;accent=localStorage.getItem('dan-accent')||accent;}catch{}document.documentElement.dataset.theme=theme;document.documentElement.style.setProperty('--accent',theme==='light'?(colors[accent]||'#126a98'):accent);button.setAttribute('aria-label',theme==='dark'?'включить светлую тему':'включить тёмную тему');}
  button.onclick=()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('dan-theme',theme);}catch{}apply();};apply();
})(globalThis);
