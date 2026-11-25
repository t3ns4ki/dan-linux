/* Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
(function(root){
 'use strict';
 const app=root.DanV2,$=app.$,h=app.escape,backend=app.backend,model=app.shareModel;
 const state={view:'feed',kind:'all',rows:[],offset:0,more:false,epoch:0,loading:false,uid:null};
 const items=new Map();let searchTimer,previewURL=null,imageBlob=null,imageReady=false,imageRevision=0,activePost=null,focusTrigger=null;
 const date=value=>new Date(value).toLocaleString(app.i18n?.language||'ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
 const hasAccount=()=>!!backend.session?.user.email_confirmed_at;
 const role=()=>app.shareContext.role;
 const canModerate=()=>['owner','admin'].includes(role());
 function status(text,error=false,selector='#share-status'){const box=$(selector);if(!box)return;box.textContent=text;box.classList.toggle('error',error);}
 function author(row){return `<div class="share-author"><img src="${h(root.DanLegacy.logo(row.avatar_id||'linux'))}" alt="" width="27" height="27"><span><span data-user-content>${h(row.author_name)}</span>${app.roleBadge(row.author_role)}</span><time datetime="${h(row.created_at)}">${h(date(row.created_at))}</time></div>`;}
 function image(row){return row.image_path?`<div class="share-image-container"><img class="share-post-image" data-share-image="${h(row.image_path)}" alt="${h(row.title)}" data-user-content width="800" height="450"><p class="share-image-state" role="status">загружаем изображение…</p></div>`:'';}
 function privateStatus(row){return row.status?`<p class="share-content-status ${row.status==='rejected'?'share-rejection':''}"><span>${h(model.statuses[row.status]||row.status)}</span>${row.reason?' · <span data-user-content>'+h(row.reason)+'</span>':''}</p>`:'';}
 function reviewControls(row,kind){return row.can_review?`<div class="share-review"><label>причина отклонения<textarea data-review-reason="${h(row.id)}" rows="2" minlength="3" maxlength="500" placeholder="что нужно исправить?"></textarea></label><div class="share-review-controls">${row.status==='approved'?'':`<button class="button primary" data-review-id="${h(row.id)}" data-review-kind="${kind}" data-review-approve="true">одобрить</button>`}<button class="button" data-review-id="${h(row.id)}" data-review-kind="${kind}" data-review-approve="false">${row.status==='approved'?'снять с публикации':'отклонить'}</button></div></div>`:'';}
 function postCard(row,queue=false){items.set('post:'+row.id,row);return `<article class="share-post" data-post-id="${h(row.id)}">${author(row)}<h3 data-user-content>${queue?h(row.title):`<button class="share-title-button" data-open-post="${h(row.id)}">${h(row.title)}</button>`}</h3><p class="share-body" data-user-content>${h(row.body)}</p>${image(row)}${privateStatus(row)}${queue?reviewControls(row,'post'):`<div class="share-post-actions">${(!row.status||row.status==='approved')?`<button class="text-link" data-open-post="${h(row.id)}">${Number(row.comment_count)||0} комментариев · открыть</button>`:''}${row.is_mine&&row.status!=='withdrawn'?`<button class="text-link" data-withdraw-id="${h(row.id)}" data-withdraw-kind="post">снять с публикации</button>`:''}${row.status==='draft'?`<button class="text-link" data-finish-upload="${h(row.id)}">завершить загруженное изображение</button>`:''}<span class="share-kind">${h(model.kinds[row.kind]||'запись')}</span></div>`}</article>`;}
 function commentCard(row,queue=false){items.set('comment:'+row.id,row);return `<article class="share-comment">${author(row)}${queue?`<div class="share-context-preview" data-user-content>к записи «${h(row.parent_title)}»\n${h(row.parent_body).slice(0,1600)}</div>`:''}<p class="share-body" data-user-content>${h(row.body)}</p>${privateStatus(row)}${queue?reviewControls(row,'comment'):row.is_mine&&row.status!=='withdrawn'?`<div class="share-post-actions"><button class="text-link" data-withdraw-id="${h(row.id)}" data-withdraw-kind="comment">снять комментарий</button></div>`:''}</article>`;}
 function empty(title,text){return `<div class="share-empty"><h3>${h(title)}</h3><p>${h(text)}</p></div>`;}
 let imageObserver=null;
 function hydrateImages(container){
  const load=async img=>{if(img.dataset.loading)return;img.dataset.loading='true';const note=img.parentElement.querySelector('.share-image-state');
   try{const client=await backend.init();const {data,error}=await client.storage.from('dan-share').createSignedUrl(img.dataset.shareImage,60);if(error)throw error;
    const url=new URL(data.signedUrl);if(url.origin!==new URL(root.DAN_CONFIG.supabaseUrl).origin||!url.pathname.startsWith('/storage/v1/'))throw new Error('недопустимый адрес изображения');
    if(!img.isConnected)return;img.onload=()=>{img.height=img.naturalHeight;note.hidden=true;};img.onerror=()=>{note.textContent='изображение недоступно. обнови страницу; при проверке не одобряй запись, пока не увидишь картинку.';};img.src=url.href;
   }catch{if(img.isConnected)note.textContent='изображение не загружено: нет доступа или файл удалён.';}
  };
  for(const img of app.$$('[data-share-image]:not([data-loading])',container)){
   if('IntersectionObserver' in root){if(!imageObserver)imageObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){imageObserver.unobserve(entry.target);void load(entry.target);}},{rootMargin:'200px'});imageObserver.observe(img);}else void load(img);
  }
 }
 function renderTabs(){
  const r=role();$('#share-queue-button').hidden=!canModerate();$('#share-admins-button').hidden=r!=='owner';$('#share-queue-count').textContent=app.shareContext.pending_count?' · '+app.shareContext.pending_count:'';
  $('#share-self-role').innerHTML=hasAccount()?`<span>твой аккаунт ${app.roleBadge(r)}</span>`:'';
  app.$$('[data-share-view]').forEach(button=>button.classList.toggle('active',button.dataset.shareView===state.view));
  $('#share-feed-controls').hidden=state.view!=='feed';
  $('#share-view-title').textContent={feed:'общая лента',mine:'мои записи и комментарии',queue:'ждущие на проверку',admins:'управление админами'}[state.view];
  const connection=$('#share-connection');
  connection.textContent=!backend.configured?'сервис сообщества пока не подключён. владелец завершает настройку.':backend.error?'подключение аккаунта требует внимания: '+backend.error:hasAccount()?'ты вошёл. '+(r==='owner'?'твои записи публикуются сразу.':r==='admin'?'твои записи проверяет только owner.':'твои записи появляются после проверки.'):'читать опубликованное можно без аккаунта. для отправки войди и подтверди почту.';
 }
 async function loadView(append=false){
  const epoch=++state.epoch;state.loading=true;$('#share-refresh').disabled=true;$('#share-more').disabled=true;
  if(!append){state.rows=[];state.offset=0;items.clear();imageObserver?.disconnect();$('#share-list').replaceChildren();}
  renderTabs();status(backend.configured?'загружаем…':'');
  if(!backend.configured){state.loading=false;$('#share-list').innerHTML=empty('сообщество скоро появится.','здесь будут настоящие записи пользователей — без выдуманных постов и аккаунтов.');$('#share-more').hidden=true;$('#share-refresh').disabled=false;return;}
  if(state.view!=='feed'&&!hasAccount()){state.loading=false;$('#share-list').innerHTML=empty('сначала войди в аккаунт.','для своих записей и модерации нужна подтверждённая почта.');$('#share-refresh').disabled=false;app.profile.open('signin');status('');return;}
  try{
   if(state.view==='admins'){await loadAdmins(epoch);return;}
   const data=state.view==='feed'?await backend.rpc('share_feed',{p_kind:state.kind,p_query:$('#share-search').value.trim(),p_offset:state.offset}):state.view==='mine'?await backend.rpc('share_my_content'):await backend.rpc('share_moderation_queue',{p_offset:state.offset});
   if(epoch!==state.epoch)return;
   const rows=[...(data.posts||[]).map(row=>({row,type:'post'})),...(data.comments||[]).map(row=>({row,type:'comment'}))];
   if(state.view==='queue')rows.sort((a,b)=>new Date(a.row.created_at)-new Date(b.row.created_at));
   const seen=new Set(state.rows.map(item=>item.type+item.row.id));state.rows.push(...rows.filter(item=>!seen.has(item.type+item.row.id)));
   $('#share-list').innerHTML=state.rows.length?state.rows.map(item=>item.type==='post'?postCard(item.row,state.view==='queue'):commentCard(item.row,state.view==='queue')).join(''):empty(state.view==='queue'?'очередь пуста.':state.view==='mine'?'ты пока ничего не отправил.':'пока нет опубликованных записей.',state.view==='queue'?'все доступные тебе записи уже проверены.':state.view==='mine'?'создай запись — её статус появится здесь.':'стань первым или попробуй другие условия поиска.');
   state.more=!!data.has_more;$('#share-more').hidden=!state.more;status(state.view==='queue'?'админы видят только записи обычных пользователей. записи админов доступны для проверки только owner.':'');hydrateImages($('#share-list'));
  }catch(error){if(epoch===state.epoch){status(error.message,true);if(!state.rows.length)$('#share-list').innerHTML=empty('не удалось загрузить данные.','проверь подключение и нажми «обновить».');}}
  finally{if(epoch===state.epoch){state.loading=false;$('#share-refresh').disabled=false;$('#share-more').disabled=false;}}
 }
 function selectView(view){if(['queue','admins'].includes(view)&&!canModerate())return;if(view==='admins'&&role()!=='owner')return;state.view=view;void loadView();}
 $('#share-main').addEventListener('click',event=>{const tab=event.target.closest('[data-share-view]');if(tab)selectView(tab.dataset.shareView);});
 $('#share-kind-filters').onclick=event=>{const button=event.target.closest('[data-kind]');if(!button)return;state.kind=button.dataset.kind;app.$$('[data-kind]').forEach(item=>item.classList.toggle('active',item===button));void loadView();};
 $('#share-search').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>void loadView(),280);};
 $('#share-refresh').onclick=()=>{void app.refreshShareContext();void loadView();};
 $('#share-more').onclick=()=>{state.offset+=state.view==='queue'?25:20;void loadView(true);};
 for(const button of app.$$('[data-close-dialog]'))button.onclick=()=>$('#'+button.dataset.closeDialog).close();
 for(const dialog of [$('#share-compose'),$('#share-thread')]){
  dialog.addEventListener('close',()=>{focusTrigger?.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 }
 $('#share-create').onclick=()=>{
  if(!hasAccount()){app.profile.open('signin');return;}focusTrigger=document.activeElement;
  $('#share-compose-policy').textContent=role()==='owner'?'ты owner: запись появится сразу после отправки и загрузки изображения.':role()==='admin'?'твои записи и комментарии проверяет только owner. до одобрения их видишь только ты и владелец.':'запись сначала увидит owner или admin. после одобрения она появится в общей ленте.';
  $('#share-send').textContent=role()==='owner'?'опубликовать':'отправить на проверку';$('#share-compose').showModal();
 };
 function clearImage(){imageRevision++;if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;imageBlob=null;imageReady=false;$('#share-image').value='';$('#share-image-preview').hidden=true;$('#share-preview-img').removeAttribute('src');}
 async function prepareImage(file){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('нужен PNG, JPEG или WebP до 8 МБ.');
  const url=URL.createObjectURL(file);
  try{const img=new Image();img.src=url;await img.decode();if(img.naturalWidth*img.naturalHeight>30000000)throw new Error('изображение слишком большое по разрешению. уменьши его перед отправкой.');
   const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const context=canvas.getContext('2d');context.drawImage(img,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.88));if(!blob||blob.type!=='image/webp'||blob.size>4194304)throw new Error('браузер не смог подготовить WebP до 4 МБ. выбери другое изображение.');canvas.width=canvas.height=1;return blob;
  }finally{URL.revokeObjectURL(url);}
 }
 $('#share-image').onchange=async()=>{
  const file=$('#share-image').files[0];clearImage();const revision=imageRevision;if(!file)return;$('#share-send').disabled=true;status('подготавливаем изображение…',false,'#share-compose-status');
  try{const prepared=await prepareImage(file);if(revision!==imageRevision)return;imageBlob=prepared;previewURL=URL.createObjectURL(imageBlob);$('#share-preview-img').src=previewURL;$('#share-image-preview').hidden=false;imageReady=true;status('изображение готово. метаданные убраны.',false,'#share-compose-status');}catch(error){if(revision===imageRevision)status(error.message,true,'#share-compose-status');}finally{if(revision===imageRevision)$('#share-send').disabled=false;}
 };
 $('#share-remove-image').onclick=()=>{clearImage();status('изображение убрано.',false,'#share-compose-status');};
 $('#share-compose-form').onsubmit=async event=>{
  event.preventDefault();if(!hasAccount()){app.profile.open('signin');return;}
  let value;try{value=model.validatePost({title:$('#share-post-title').value,body:$('#share-post-body').value,kind:$('#share-post-kind').value});}catch(error){status(error.message,true,'#share-compose-status');return;}
  const uid=backend.session.user.id;$('#share-send').disabled=true;let reserved=null;
  try{status('отправляем…',false,'#share-compose-status');const result=await backend.rpc('share_submit_post',{p_title:value.title,p_body:value.body,p_kind:value.kind,p_has_image:!!imageReady});reserved=result.post;
   if(imageReady){const client=await backend.init();if(backend.session?.user.id!==uid)throw new Error('сеанс изменился. отправка остановлена.');const {error}=await client.storage.from('dan-share').upload(reserved.image_path,imageBlob,{contentType:'image/webp',upsert:false,cacheControl:'0'});if(error)throw error;reserved=(await backend.rpc('share_finish_upload',{p_post_id:reserved.id})).post;}
   if(backend.session?.user.id!==uid)throw new Error('сеанс изменился.');$('#share-compose').close();$('#share-compose-form').reset();clearImage();status('',false,'#share-compose-status');app.notify(reserved.status==='approved'?'запись опубликована.':'запись отправлена на проверку.');state.view='mine';await loadView();void app.refreshShareContext();
  }catch(error){status((reserved?'запись сохранена в «мои записи». если картинка успела загрузиться, нажми там «завершить загруженное изображение». иначе сними черновик и отправь заново. ':'')+backend.errorMessage(error),true,'#share-compose-status');}
  finally{$('#share-send').disabled=false;}
 };
 async function openThread(id){
  if(!/^[0-9a-f-]{36}$/i.test(id))return;const epoch=state.epoch;focusTrigger=document.activeElement;
  try{const data=await backend.rpc('share_thread',{p_post_id:id});if(epoch!==state.epoch)return;activePost=id;
   items.set('post:'+id,data.post);$('#share-thread-content').innerHTML=author(data.post)+`<h2 id="share-thread-title" data-user-content>${h(data.post.title)}</h2><p class="share-body" data-user-content>${h(data.post.body)}</p>`+image(data.post)+reviewControls(data.post,'post')+`<h3 class="share-comments-heading">комментарии · ${data.comments.length}</h3><div id="share-thread-comments">${data.comments.length?data.comments.map(row=>commentCard(row)).join(''):'<p>пока нет комментариев. можешь начать обсуждение.</p>'}</div>`+(hasAccount()?`<form id="share-comment-form" class="share-comment-form"><label for="share-comment-text">твой комментарий</label><textarea id="share-comment-text" rows="4" minlength="2" maxlength="3000" required></textarea><p class="v2-help">${role()==='owner'?'появится сразу.':role()==='admin'?'проверит только owner.':'сначала отправится на проверку.'}</p><button type="submit" class="button primary">${role()==='owner'?'опубликовать':'отправить на проверку'}</button><p id="share-comment-status" class="v2-form-status" role="status"></p></form>`:'<button class="button" id="share-thread-login">войти и ответить</button>');
   $('#share-thread').showModal();hydrateImages($('#share-thread'));const login=$('#share-thread-login');if(login)login.onclick=()=>{$('#share-thread').close();app.profile.open('signin');};
   if($('#share-comment-form'))$('#share-comment-form').onsubmit=async event=>{event.preventDefault();let body;try{body=model.validateComment($('#share-comment-text').value);}catch(error){status(error.message,true,'#share-comment-status');return;}const button=$('#share-comment-form button');button.disabled=true;
    try{const response=await backend.rpc('share_submit_comment',{p_post_id:id,p_body:body});$('#share-comment-text').value='';status(response.comment.status==='approved'?'комментарий опубликован.':'комментарий отправлен на проверку. статус появится в «мои записи».',false,'#share-comment-status');if(response.comment.status==='approved'){const comments=$('#share-thread-comments');if(!comments.querySelector('.share-comment'))comments.replaceChildren();comments.insertAdjacentHTML('beforeend',commentCard(response.comment));$('.share-comments-heading').textContent='комментарии · '+comments.querySelectorAll('.share-comment').length;}void app.refreshShareContext();}
    catch(error){status(error.message,true,'#share-comment-status');}finally{if(button.isConnected)button.disabled=false;}
   };
   const url=new URL(root.location.href);url.searchParams.set('post',id);history.replaceState(null,'',url);
  }catch(error){app.notify(error.message);}
 }
 $('#share-thread').addEventListener('close',()=>{activePost=null;const url=new URL(root.location.href);url.searchParams.delete('post');history.replaceState(null,'',url);});
 document.addEventListener('click',event=>{
  const open=event.target.closest('[data-open-post]');if(open){void openThread(open.dataset.openPost);return;}
  const withdraw=event.target.closest('[data-withdraw-id]');if(withdraw){void mutate(withdraw,()=>backend.rpc('share_withdraw',{p_kind:withdraw.dataset.withdrawKind,p_id:withdraw.dataset.withdrawId}),'запись снята с публикации.');return;}
  const finish=event.target.closest('[data-finish-upload]');if(finish){void mutate(finish,()=>backend.rpc('share_finish_upload',{p_post_id:finish.dataset.finishUpload}),'загрузка завершена.');return;}
  const review=event.target.closest('[data-review-id]');if(review){const id=review.dataset.reviewId,kind=review.dataset.reviewKind,row=items.get(kind+':'+id),approve=review.dataset.reviewApprove==='true',reason=$(`[data-review-reason="${id}"]`).value.trim();if(!approve&&reason.length<3){app.notify('укажи причину отклонения: минимум 3 символа.');return;}void mutate(review,()=>backend.rpc('share_review',{p_kind:kind,p_id:id,p_version:row.version,p_approve:approve,p_reason:reason}),approve?'запись одобрена.':'запись отклонена.');}
 });
 async function mutate(button,action,message){button.disabled=true;try{await action();app.notify(message);if($('#share-thread').open)$('#share-thread').close();await loadView();void app.refreshShareContext();}catch(error){app.notify(error.message);}finally{if(button.isConnected)button.disabled=false;}}
 function adminUser(user,remove=false){return `<div class="share-admin-user"><div><b data-user-content>${h(user.nickname)}</b> ${app.roleBadge(user.role)}<br><small>ID …${h(user.id.slice(-8))}</small></div>${user.role==='owner'?'':`<button class="button" data-admin-id="${h(user.id)}" data-admin-enable="${!remove}" data-admin-name="${h(user.nickname)}">${remove?'снять admin':'назначить admin'}</button>`}</div>`;}
 async function loadAdmins(epoch){
  const admins=await backend.rpc('share_admins');if(epoch!==state.epoch)return;
  $('#share-list').innerHTML=`<div class="share-admin-search"><h3>назначить админа</h3><p>введи точный никнейм зарегистрированного пользователя. одинаковые ники различай по ID — право выдаётся аккаунту, а не имени.</p><form id="share-admin-search-form"><label class="v2-field">никнейм<input id="share-admin-nickname" minlength="2" maxlength="24" required></label><button type="submit" class="button">найти</button></form><div id="share-admin-found" class="share-admin-users"></div><div id="share-admin-confirm"></div><h3 style="margin-top:30px">назначенные админы</h3><div class="share-admin-users">${admins.length?admins.map(user=>adminUser(user,true)).join(''):'<p>ты пока никого не назначил.</p>'}</div></div>`;
  $('#share-more').hidden=true;status('только owner может менять роли. admin может проверять обычные записи, но не записи админов.');
  $('#share-admin-search-form').onsubmit=async event=>{event.preventDefault();const uid=backend.session?.user.id;try{const found=await backend.rpc('share_find_users',{p_nickname:$('#share-admin-nickname').value.trim()});if(state.view!=='admins'||backend.session?.user.id!==uid)return;$('#share-admin-found').innerHTML=found.length?found.map(user=>adminUser(user,user.role==='admin')).join(''):'<p>такого подтверждённого аккаунта не найдено.</p>';}catch(error){status(error.message,true);}};
 }
 $('#share-list').addEventListener('click',event=>{
  const button=event.target.closest('[data-admin-id]');if(!button)return;const id=button.dataset.adminId,enable=button.dataset.adminEnable==='true',name=button.dataset.adminName;
  $('#share-admin-confirm').innerHTML=`<div class="share-admin-confirm"><p>${enable?'назначить':'снять права у'} <b data-user-content>${h(name)}</b> · ID …${h(id.slice(-8))}?</p><p>${enable?'админ сможет видеть и проверять неопубликованные записи обычных пользователей. его собственные записи будет проверять только owner.':'права модерации перестанут действовать сразу на сервере.'}</p><div class="share-review-controls"><button class="button primary" id="share-admin-confirm-yes">подтвердить</button><button class="button" id="share-admin-confirm-no">отмена</button></div></div>`;
  $('#share-admin-confirm-no').onclick=()=>$('#share-admin-confirm').replaceChildren();$('#share-admin-confirm-yes').onclick=()=>void mutate($('#share-admin-confirm-yes'),()=>backend.rpc('share_set_admin',{p_user_id:id,p_enabled:enable}),enable?'admin назначен.':'права admin сняты.');
 });
 root.addEventListener('dan:share-role',()=>{renderTabs();if(state.view==='queue'&&canModerate()){void loadView();return;}if((state.view==='queue'&&!canModerate())||(state.view==='admins'&&role()!=='owner')){state.view='feed';void loadView();}});
 root.addEventListener('dan:account',()=>{const uid=backend.session?.user.id||null;renderTabs();if(uid!==state.uid){state.uid=uid;state.epoch++;if($('#share-thread').open)$('#share-thread').close();if($('#share-compose').open)$('#share-compose').close();$('#share-compose-form').reset();clearImage();$('#share-send').disabled=false;status('',false,'#share-compose-status');if(!uid)state.view='feed';void loadView();}});
 document.addEventListener('DOMContentLoaded',async()=>{await loadView();const post=new URL(root.location.href).searchParams.get('post');if(post&&backend.configured)void openThread(post);});
 root.addEventListener('pagehide',()=>{if(previewURL)URL.revokeObjectURL(previewURL);imageObserver?.disconnect();clearTimeout(searchTimer);});
})(globalThis);
