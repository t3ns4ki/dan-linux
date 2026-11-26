(function(root){
  'use strict';
  const app=root.DanV2,$=app.$,h=app.escape,backend=app.backend,dialog=$('#platform-dialog');
  const state={mode:'guest',trigger:null,userId:null};
  const content=()=>$('#platform-dialog-content');
  const profile=()=>backend.dashboard?.profile;
  function open(mode){
    state.trigger=document.activeElement;state.mode=mode||(backend.session?'profile':'guest');
    if($('#detail-dialog')?.open)$('#detail-dialog').close();
    draw();if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
    if(backend.configured&&!backend.client)void backend.init().catch(()=>{});
  }
  function close(){dialog.close();}
  $('.v2-modal-close',dialog).onclick=close;
  dialog.addEventListener('close',()=>state.trigger?.focus({preventScroll:true}));
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close();});
  $('#profile-button').onclick=()=>open();
  function setStatus(text,error=false){const box=$('#profile-status',dialog);if(box){box.textContent=text;box.classList.toggle('error',error);box.classList.toggle('success',!error);}}
  async function action(button,callback,success){
    if(button)button.disabled=true;setStatus('подожди немного…');
    try{await callback();if(success)setStatus(success);}catch(error){setStatus(backend.errorMessage(error),true);}finally{if(button?.isConnected)button.disabled=false;}
  }
  const statCards=summary=>`<div class="v2-profile-stats"><div class="v2-profile-stat"><b>${summary.level}</b><span>уровень</span></div><div class="v2-profile-stat"><b>${summary.xp}</b><span>XP</span></div><div class="v2-profile-stat"><b>${summary.completed.length}/${app.lessons.length}</b><span>уроков пройдено</span></div></div>`;
  const statusHTML='<p id="profile-status" class="v2-form-status" role="status"></p>';
  function draw(){
    if(backend.recovery)state.mode='password';
    if(backend.session&&state.mode!=='password')state.mode='profile';
    if(!backend.session&&state.mode==='profile')state.mode='guest';
    if(['signin','signup','reset','password'].includes(state.mode))drawAuth();else if(state.mode==='profile')drawProfile();else drawGuest();
  }
  function bindModes(){app.$$('[data-profile-mode]',dialog).forEach(button=>button.onclick=()=>{state.mode=button.dataset.profileMode;draw();dialog.scrollTop=0;});}
  function drawGuest(){
    const summary=app.progress.summary();
    content().innerHTML=`<span class="eyebrow accent">твоя Linux Academy</span><h2 id="platform-modal-title">гость, но уже свой.</h2><p>учиться можно без регистрации. прогресс и достижения сохраняются в этом браузере; на другом устройстве они появятся после входа и переноса в аккаунт.</p>${statCards(summary)}<div class="v2-profile-actions"><button class="button primary" data-profile-mode="signin">войти</button><button class="button" data-profile-mode="signup">создать аккаунт</button><button class="text-link" id="profile-go-academy">продолжить обучение</button></div>${!backend.configured?'<div class="v2-auth-notice" style="margin-top:22px">регистрация и общие голоса пока не подключены. обучение, прогресс гостя и генератор команд уже работают.</div>':''}<div class="v2-profile-section"><h3>достижения</h3><div class="v2-badge-grid">${app.badgesHTML(summary)}</div></div><div class="v2-profile-section"><h3>данные этого устройства</h3><p>мы не просим настоящее имя, адрес или телефон. гостевой прогресс хранится только здесь.</p><div class="v2-privacy-buttons"><button id="profile-export">скачать мой прогресс</button><button id="profile-clear-guest">сбросить гостевой прогресс</button></div><div id="profile-local-confirm"></div></div>${statusHTML}`;
    bindModes();
    $('#profile-go-academy').onclick=()=>{close();if(app.academy){$('#academy').scrollIntoView();app.academy.selectLesson(app.academy.currentLesson().id,true);}else root.location.href=new URL('#academy',document.baseURI).href;};
    $('#profile-export').onclick=()=>app.downloadJSON('dan-linux-guest-progress.json',app.progress.guest());
    $('#profile-clear-guest').onclick=()=>{
      $('#profile-local-confirm').innerHTML='<div class="v2-delete-confirm"><p>сбросить уроки и достижения гостя в этом браузере? данные аккаунта не затрагиваются.</p><div class="v2-profile-actions"><button class="button v2-danger-button" id="confirm-local-reset">сбросить</button><button class="button" id="cancel-local-reset">отмена</button></div></div>';
      $('#cancel-local-reset').onclick=()=>$('#profile-local-confirm').replaceChildren();
      $('#confirm-local-reset').onclick=()=>{app.progress.clearGuest();drawGuest();app.notify('гостевой прогресс сброшен.');};
    };
  }
  function drawAuth(){
    const mode=state.mode,isReset=mode==='reset',isSignup=mode==='signup',isPassword=mode==='password',available=backend.configured;
    const title=isReset?'вернём доступ.':isSignup?'добро пожаловать.':isPassword?'новый пароль.':'с возвращением.';
    const description=isReset?'если такая почта зарегистрирована, на неё придёт письмо со ссылкой для смены пароля.':isSignup?'достаточно почты и пароля. после регистрации подтверди адрес из письма. никнейм и аватар выберешь позже.':isPassword?'ссылка из письма открывает защищённый сеанс восстановления. задай новый пароль.':'вход синхронизирует Academy и даёт один голос в каждой категории.';
    const tabs=!isPassword?`<div class="v2-account-tabs"><button class="chip ${mode==='signin'?'active':''}" data-profile-mode="signin">вход</button><button class="chip ${isSignup?'active':''}" data-profile-mode="signup">регистрация</button><button class="chip ${isReset?'active':''}" data-profile-mode="reset">забыл пароль</button></div>`:'';
    const email=!isPassword?'<label class="v2-field">электронная почта<input id="auth-email" name="email" type="email" autocomplete="username" maxlength="254" required></label>':'';
    const password=!isReset?`<label class="v2-field">${isPassword?'новый пароль':'пароль'}<input id="auth-password" name="password" type="password" autocomplete="${isSignup||isPassword?'new-password':'current-password'}" ${isSignup||isPassword?'minlength="12"':''} maxlength="128" required></label>${isSignup||isPassword?'<label class="v2-field">повтори пароль<input id="auth-password-confirm" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label><p class="v2-help">от 12 символов. не используй пароль от других сервисов.</p>':''}`:'';
    content().innerHTML=`<span class="eyebrow accent">Dan Linux · приватный аккаунт</span><h2 id="platform-modal-title">${title}</h2><p>${description}</p>${tabs}${!available?'<div class="v2-auth-notice">сервис аккаунтов пока не подключён. форма станет доступна после настройки сайта. гостевые уроки и прогресс доступны уже сейчас.</div>':''}<form id="profile-auth-form" class="v2-auth-form"><fieldset ${!available?'disabled':''}>${email}${password}${!isReset&&!isPassword?`<label class="v2-check-label"><input id="auth-remember" type="checkbox" ${app.store.read('dan-remember-session-v2',true)?'checked':''}><span>оставаться в системе на этом устройстве. выключи на общем компьютере.</span></label>`:''}<button class="button primary" type="submit">${isReset?'отправить письмо':isSignup?'зарегистрироваться':isPassword?'сохранить новый пароль':'войти'}</button></fieldset></form>${!isReset&&!isPassword&&available&&(root.DAN_CONFIG.oauthProviders||[]).length?`<div class="v2-oauth">${root.DAN_CONFIG.oauthProviders.filter(provider=>['google','github'].includes(provider)).map(provider=>`<button class="button" data-oauth="${provider}">войти через ${provider==='github'?'GitHub':'Google'}</button>`).join('')}</div>`:''}${statusHTML}<div class="v2-auth-footer"><button data-profile-mode="guest">продолжить как гость</button>${!isPassword&&available?'<button id="auth-resend">повторить письмо подтверждения</button>':''}</div>`;
    bindModes();
    $('#profile-auth-form').onsubmit=event=>{
      event.preventDefault();const button=$('button[type="submit"]',$('#profile-auth-form')),email=$('#auth-email')?.value.trim(),password=$('#auth-password')?.value;
      if((isSignup||isPassword)&&password!==$('#auth-password-confirm').value){setStatus('пароли не совпадают.',true);return;}
      if($('#auth-remember'))backend.setRemember($('#auth-remember').checked);
      void action(button,async()=>{
        if(isReset){await backend.resetPassword(email);setStatus('если адрес зарегистрирован, письмо отправлено. проверь также папку спама.');}
        else if(isSignup){await backend.signUp(email,password);setStatus('проверь почту: подтверди адрес из письма, затем войди. если письмо не пришло, проверь спам или повтори отправку позже.');$('#auth-password').value='';$('#auth-password-confirm').value='';}
        else if(isPassword){await backend.updatePassword(password);state.mode=backend.session?'profile':'signin';draw();app.notify('пароль обновлён.');}
        else{await backend.signIn(email,password);state.mode='profile';draw();app.notify('ты вошёл в аккаунт.');}
      });
    };
    app.$$('[data-oauth]',dialog).forEach(button=>button.onclick=()=>{if($('#auth-remember'))backend.setRemember($('#auth-remember').checked);void action(button,()=>backend.oauth(button.dataset.oauth));});
    if($('#auth-resend'))$('#auth-resend').onclick=()=>{const email=$('#auth-email').value.trim();if(!$('#auth-email').checkValidity()){$('#auth-email').reportValidity();return;}void action($('#auth-resend'),()=>backend.resend(email),'если адрес ожидает подтверждения, новое письмо отправлено.');};
  }
  function candidateOptions(kind,selected){return '<option value="">не выбрано</option>'+app.votingCandidates.filter(item=>item.kind===kind).map(item=>`<option value="${item.id}" ${item.id===selected?'selected':''}>${h(item.name)}</option>`).join('');}
  function drawProfile(){
    const p=profile();
    if(!p){
      content().innerHTML=`<h2 id="platform-modal-title">твой аккаунт.</h2><div class="v2-auth-notice">${h(backend.error||(!backend.session?.user.email_confirmed_at?'подтверди почту, чтобы пользоваться аккаунтом.':'загружаем приватный профиль…'))}</div><div class="v2-profile-actions"><button id="profile-retry" class="button">обновить</button><button id="profile-signout" class="button">выйти</button></div>${statusHTML}`;
      $('#profile-retry').onclick=()=>void action($('#profile-retry'),async()=>{await backend.refresh();draw();});$('#profile-signout').onclick=()=>void action($('#profile-signout'),()=>backend.signOut());return;
    }
    const summary=app.progress.summary(),guest=app.progress.guest(),cloudCompleted=new Set(summary.completed),pendingGuest=Object.keys(guest.completed).some(id=>!cloudCompleted.has(id))||(guest.secrets.includes('chocolate')&&!summary.badges.includes('chocolate'));
    const avatars=[...distros.map(item=>[item.id,item.name]),['linux','Tux']],history=backend.dashboard.vote_history||[];
    const fields=`<div class="v2-profile-fields"><label class="v2-field">никнейм<input id="profile-nickname" value="${h(p.nickname)}" minlength="2" maxlength="24" required autocomplete="nickname" aria-describedby="nickname-help"></label><label class="v2-field">аватар<select id="profile-avatar">${avatars.map(([id,name])=>`<option value="${id}" ${id===p.avatar_id?'selected':''}>${h(name)}</option>`).join('')}</select></label><label class="v2-field">любимый дистрибутив<select id="profile-favorite-distro">${candidateOptions('distro',p.favorite_distro)}</select></label><label class="v2-field">любимый Desktop Environment<select id="profile-favorite-de">${candidateOptions('de',p.favorite_de)}</select></label><label class="v2-field">любимый Window Manager<select id="profile-favorite-wm">${candidateOptions('wm',p.favorite_wm)}</select></label></div>`;
    const votes=backend.dashboard.votes.length?`<ul class="v2-own-votes">${backend.dashboard.votes.map(vote=>`<li>${h(vote.category_name)}: <b>${h(vote.candidate_name)}</b></li>`).join('')}</ul>`:'<p>ты ещё не голосовал. в каждой категории можно выбрать одного кандидата.</p>';
    const historyHTML=history.length?`<p class="v2-help">последние 50 изменений. история видна только тебе.</p><ul class="v2-own-votes">${history.map(item=>`<li>${h(item.category_name)}: <b>${h(item.action==='withdraw'?'голос отозван':item.candidate_name)}</b><time datetime="${h(item.created_at)}">${h(new Date(item.created_at).toLocaleString('ru'))}</time></li>`).join('')}</ul>`:'<p>история пока пуста.</p>';
    content().innerHTML=`<span class="eyebrow accent">видно только тебе</span><div class="v2-private-profile-header"><img id="profile-avatar-preview" src="${root.DanLegacy.logo(p.avatar_id)}" alt="выбранный аватар"><div><h2 id="platform-modal-title"><span data-user-content>${h(p.nickname)}</span> ${app.roleBadge?.(app.shareContext?.role)||''}</h2><p>приватный профиль · почта и прогресс не публикуются</p></div></div>${statCards(summary)}${pendingGuest?'<div class="v2-guest-import"><p>в этом браузере есть гостевые достижения или уроки, которых ещё нет в аккаунте. перенос проверяет ответы на сервере и не копирует произвольные XP.</p><button class="button" id="profile-import">перенести мой гостевой прогресс</button><p id="profile-import-status" class="v2-form-status" role="status"></p></div>':''}<form id="profile-settings-form">${fields}<p class="v2-help" id="nickname-help">подойдёт любой псевдоним. настоящее имя не требуется.</p><label class="v2-check-label"><input type="checkbox" id="profile-celebrate" ${p.preferences.celebrate_achievements?'checked':''}><span>показывать уведомления о новых достижениях</span></label><label class="v2-check-label"><input type="checkbox" id="profile-show-xp" ${p.preferences.show_xp?'checked':''}><span>показывать XP в панели Academy</span></label><button class="button primary" type="submit">сохранить профиль</button></form>${statusHTML}<div class="v2-profile-section"><h3>достижения и прогресс</h3><p>${summary.completed.length} из ${app.lessons.length} уроков пройдено. достижения и XP подтверждаются сервером.</p><div class="v2-badge-grid">${app.badgesHTML(summary)}</div></div><div class="v2-profile-section"><h3>мои активные голоса</h3>${votes}<button class="text-link" id="profile-go-voting">перейти к голосованию</button></div><div class="v2-profile-section"><h3>история моих голосований</h3>${historyHTML}</div><div class="v2-profile-section"><h3>приватность и сеанс</h3><p>почта, уроки и личная история закрыты. в опубликованных записях Share видны никнейм, аватар и роль автора.</p><label class="v2-field">ID твоего аккаунта<input id="profile-account-id" value="${h(p.id)}" readonly aria-label="ID аккаунта"></label><div class="v2-privacy-buttons"><button id="profile-copy-id">копировать ID</button><button id="profile-export">скачать мои данные</button><button id="profile-signout">выйти на этом устройстве</button><button id="profile-signout-all">выйти из всех сеансов</button><button id="profile-delete-open" class="v2-danger-button">удалить аккаунт</button></div><div id="profile-delete-area"></div></div>`;
    $('#profile-avatar').onchange=()=>{$('#profile-avatar-preview').src=root.DanLegacy.logo($('#profile-avatar').value);};
    $('#profile-settings-form').onsubmit=event=>{
      event.preventDefault();const nickname=$('#profile-nickname').value.trim();if(nickname.length<2||/[<>\x00-\x1f]/.test(nickname)){setStatus('никнейм: от 2 до 24 символов без управляющих символов и угловых скобок.',true);return;}
      const values={p_nickname:nickname,p_avatar_id:$('#profile-avatar').value,p_favorite_distro:$('#profile-favorite-distro').value||null,p_favorite_de:$('#profile-favorite-de').value||null,p_favorite_wm:$('#profile-favorite-wm').value||null,p_preferences:{celebrate_achievements:$('#profile-celebrate').checked,show_xp:$('#profile-show-xp').checked}};
      void action($('button[type="submit"]',$('#profile-settings-form')),async()=>{await backend.rpc('save_profile',values);drawProfile();setStatus('профиль сохранён.');});
    };
    $('#profile-copy-id').onclick=async()=>{try{await navigator.clipboard.writeText(p.id);setStatus('ID скопирован. это не пароль.');}catch{$('#profile-account-id').select();setStatus('ID выделен — скопируй вручную.');}};
    $('#profile-go-voting').onclick=()=>{close();if($('#community'))$('#community').scrollIntoView();else root.location.href=new URL('#community',document.baseURI).href;};$('#profile-export').onclick=()=>app.downloadJSON('dan-linux-my-data.json',backend.dashboard);
    $('#profile-signout').onclick=()=>void action($('#profile-signout'),()=>backend.signOut());$('#profile-signout-all').onclick=()=>void action($('#profile-signout-all'),()=>backend.signOut('global'));
    if($('#profile-import'))$('#profile-import').onclick=()=>void action($('#profile-import'),async()=>{await app.progress.importGuest((done,total)=>{const status=$('#profile-import-status');if(status)status.textContent=`проверено ${done} из ${total} уроков…`;});drawProfile();setStatus('гостевой прогресс проверен и перенесён.');});
    $('#profile-delete-open').onclick=()=>{
      $('#profile-delete-area').innerHTML='<div class="v2-delete-confirm"><h3>удалить аккаунт безвозвратно?</h3><p>будут удалены профиль, прогресс, достижения, голоса и история. для защиты нужен вход в течение последних 15 минут. гостевой прогресс этого браузера остаётся отдельно.</p><form id="profile-delete-form"><label class="v2-field">введи delete для подтверждения<input id="profile-delete-confirm" autocomplete="off" spellcheck="false" placeholder="delete" required></label><button type="submit" class="button v2-danger-button" id="profile-delete-submit" disabled>удалить мой аккаунт</button></form><button class="text-link" id="profile-delete-cancel" style="margin-top:16px">отмена</button></div>';
      $('#profile-delete-cancel').onclick=()=>$('#profile-delete-area').replaceChildren();$('#profile-delete-confirm').oninput=()=>{$('#profile-delete-submit').disabled=$('#profile-delete-confirm').value.trim()!=='delete';};
      $('#profile-delete-form').onsubmit=event=>{event.preventDefault();if($('#profile-delete-confirm').value.trim()!=='delete')return;void action($('#profile-delete-submit'),async()=>{await backend.deleteAccount('DELETE MY ACCOUNT');state.mode='guest';draw();app.notify('аккаунт и связанные данные удалены.');});};
    };
  }
  root.addEventListener('dan:account',()=>{
    const userId=backend.session?.user.id||null,changed=userId!==state.userId;state.userId=userId;
    const button=$('#profile-button');const label=$('span',button);if(backend.dashboard?.profile)label.setAttribute('data-user-content','');else label.removeAttribute('data-user-content');label.textContent=backend.dashboard?.profile?.nickname||'профиль';button.setAttribute('aria-label',backend.session?'открыть мой приватный профиль':'открыть профиль или войти');
    if(dialog.open&&(changed||(state.mode==='profile'&&!$('#profile-settings-form'))))draw();
  });
  root.addEventListener('dan:progress',()=>{if(dialog.open&&state.mode==='guest')drawGuest();});
  root.addEventListener('dan:recovery',()=>{state.mode='password';open('password');});
  root.addEventListener('dan:recovery-complete',()=>{state.mode='profile';});
  app.profile={open,close,draw};
})(globalThis);
