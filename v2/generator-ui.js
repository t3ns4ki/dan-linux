(function(root){
  'use strict';
  const app=root.DanV2,$=app.$,h=app.escape;let generated=null;
  $('#generator-distro').innerHTML=app.commandDistros.map(([id,name])=>`<option value="${id}">${h(name)}</option>`).join('');
  $('#generator-action').innerHTML=app.commandActions.map(([id,name])=>`<option value="${id}">${h(name)}</option>`).join('');
  $('#generator-package').value='firefox';
  function generate(explicit=false){
    const distro=$('#generator-distro').value,action=$('#generator-action').value,family=app.commandDistros.find(item=>item[0]===distro)[2],needsPackage=['install','remove','search','info'].includes(action);
    $('#generator-aur-field').hidden=family!=='pacman';if(family!=='pacman')$('#generator-aur').value='official';
    $('#generator-suse-field').hidden=family!=='zypper';$('#generator-package').disabled=!needsPackage;
    $('#generator-input-hint').textContent=needsPackage?(family==='emerge'?'для Gentoo лучше точный category/package, например www-client/firefox.':'одно имя пакета без пробелов, флагов и символов оболочки.'):'для этой операции имя пакета не требуется.';
    try{
      generated=app.generateCommand({distro,action,packageName:$('#generator-package').value,aur:$('#generator-aur').value,suse:$('#generator-suse').value});
      const pkg=$('#generator-package').value.trim();
      $('#generator-output').innerHTML=generated.text.split(/(\s+)/).map(token=>{if(/^\s+$/.test(token))return token;const cls=token==='&&'?'operator':token===pkg&&needsPackage?'package':token.startsWith('-')||token==='@world'?'flag':/^(sudo|pacman|apt|dnf|emerge|equery|qlist|eclean-dist|apk|zypper|yay|paru|xbps-)/.test(token)?'command':'';return `<span class="v2-token-${cls}">${h(token)}</span>`;}).join('');
      $('#generator-manager').textContent=generated.manager;$('#generator-copy').disabled=false;$('#generator-package').setAttribute('aria-invalid','false');
      $('#generator-warning').textContent=generated.warning;$('#generator-warning').hidden=!generated.warning;
      $('#generator-note').textContent=generated.note;$('#generator-arguments').innerHTML=generated.arguments.map(item=>`<dt>${h(item.token)}</dt><dd>${h(item.description)}</dd>`).join('');
      $('#generator-source').href=generated.source;$('#generator-source').hidden=false;$('#generator-status').textContent=explicit?'команда готова. скопируй её после проверки объяснения.':'';$('#generator-status').classList.remove('error');
    }catch(error){
      generated=null;$('#generator-output').textContent='укажи корректное имя пакета';$('#generator-copy').disabled=true;$('#generator-package').setAttribute('aria-invalid','true');$('#generator-status').textContent=error.message;$('#generator-status').classList.add('error');$('#generator-arguments').replaceChildren();$('#generator-warning').hidden=true;$('#generator-note').textContent='команда не создана: опасные символы и дополнительные аргументы не принимаются.';$('#generator-source').hidden=true;
    }
  }
  $('#generator-form').onsubmit=event=>{event.preventDefault();generate(true);};
  $('#generator-form').addEventListener('change',()=>{const family=app.commandDistros.find(item=>item[0]===$('#generator-distro').value)[2];if(family==='emerge'&&$('#generator-package').value==='firefox')$('#generator-package').value='www-client/firefox';else if(family!=='emerge'&&$('#generator-package').value==='www-client/firefox')$('#generator-package').value='firefox';generate();});
  $('#generator-package').addEventListener('input',()=>generate());
  $('#generator-copy').onclick=async()=>{
    if(!generated)return;
    try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(generated.text);}else{const field=document.createElement('textarea');field.value=generated.text;field.style.position='fixed';field.style.top='-1000px';document.body.append(field);field.select();const copied=document.execCommand('copy');field.remove();if(!copied)throw new Error();}$('#generator-status').textContent='команда скопирована.';app.notify('команда скопирована.');}
    catch{const range=document.createRange();range.selectNodeContents($('#generator-output'));const selection=root.getSelection();selection.removeAllRanges();selection.addRange(range);$('#generator-status').textContent='браузер не разрешил копирование. текст выделен — скопируй вручную.';}
  };
  generate();
})(globalThis);
