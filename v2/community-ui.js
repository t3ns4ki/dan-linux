(function(root){
  'use strict';
  const app=root.DanV2,$=app.$,h=app.escape;
  const state={rows:null,lastUpdated:null,error:'',loading:false,pending:false,visible:false};
  $('#voting-category').innerHTML=app.votingCategories.map(category=>`<option value="${category.id}">${h(category.name)}</option>`).join('');
  $('#voting-family').innerHTML=Object.entries(app.familyLabels).filter(([id])=>!['desktop','wm'].includes(id)).map(([id,label])=>`<option value="${id}">${h(label)}</option>`).join('');
  const category=()=>app.votingCategories.find(item=>item.id===$('#voting-category').value);
  const myVote=()=>app.backend.session?(app.backend.dashboard?.votes||[]).find(item=>item.category_id===category().id)?.distro_id:null;
  function candidates(){return app.votingCandidates.filter(candidate=>candidate.kind===category().kind);}
  function count(id){if(!state.rows)return null;return state.rows.find(row=>row.category_id===category().id&&row.distro_id===id)?.vote_count??0;}
  function render(){
    const selectedCategory=category(),all=candidates(),total=state.rows?all.reduce((sum,item)=>sum+count(item.id),0):null,mine=myVote(),query=$('#voting-search').value.trim().toLowerCase(),family=$('#voting-family').value;
    $('.v2-voting-family').hidden=selectedCategory.kind!=='distro';
    const ranked=[...all].sort((a,b)=>(count(b.id)||0)-(count(a.id)||0)||a.name.localeCompare(b.name));
    const list=($('#voting-sort').value==='name'?[...all].sort((a,b)=>a.name.localeCompare(b.name)):ranked).filter(item=>item.name.toLowerCase().includes(query)&&(selectedCategory.kind!=='distro'||family==='all'||item.family===family));
    $('#voting-total').textContent=total===null?'результаты ещё не загружены':`${total} ${total===1?'голос':'голосов'} · ${list.length} кандидатов показано`;
    const status=$('#voting-status');status.classList.toggle('ready',!!state.rows&&!state.error);
    if(!app.backend.configured)status.textContent='общественное голосование пока не подключено. можно изучать кандидатов; голоса и результаты здесь не имитируются.';
    else if(state.error)status.textContent=state.error+(state.rows?' показаны последние загруженные результаты.':' результаты не загружены.');
    else if(state.loading&&!state.rows)status.textContent='загружаем настоящие результаты…';
    else if(!app.backend.session)status.innerHTML='результаты доступны всем. <button data-community-login>войди с подтверждённой почтой</button>, чтобы проголосовать.';
    else if(!app.backend.session.user.email_confirmed_at)status.innerHTML='подтверди почту перед голосованием. <button data-community-login>открыть аккаунт</button>';
    else status.textContent='голосование подключено. один активный голос в категории; изменения синхронизируются с сервером.';
    $('#voting-cards').innerHTML=list.length?list.map(item=>{
      const votes=count(item.id),percent=total>0?votes/total*100:0,selected=mine===item.id;
      const text=!app.backend.configured?'пока недоступно':state.pending?'сохраняем…':!app.backend.session?'войти и голосовать':selected?'твой голос':'проголосовать';
      return `<article class="v2-vote-card ${selected?'selected':''}" id="vote-card-${item.id}"><img src="${h(item.logo)}" alt="логотип ${h(item.name)}" width="30" height="30" loading="lazy"><h3>${h(item.name)}</h3><span class="v2-vote-family">${h(app.familyLabels[item.family]||item.family)}</span><div class="v2-vote-count"><b>${votes===null?'—':votes+' голосов'}</b><span>${votes===null?'—':percent.toLocaleString('ru',{maximumFractionDigits:1})+'%'}</span></div><button data-vote="${item.id}" aria-pressed="${selected}" ${!app.backend.configured||state.pending?'disabled':''}>${text}</button></article>`;
    }).join(''):'<div class="empty">по этим условиям кандидатов нет.<button id="voting-reset-filter">сбросить поиск и фильтр</button></div>';
    $('#voting-chart-note').textContent=total===null?'подключение ещё не настроено или результаты недоступны. выдуманных голосов нет.':total===0?'пока никто не проголосовал в этой категории. твой голос может стать первым.':'доли рассчитаны от всех голосов категории, независимо от поиска и фильтра.';
    $('#voting-chart').innerHTML=total===null?'':ranked.map(item=>{const votes=count(item.id),percent=total?votes/total*100:0;return `<button class="v2-chart-row" data-chart-candidate="${item.id}" aria-label="показать ${h(item.name)}: ${votes} голосов"><span class="v2-chart-label"><span>${h(item.name)}</span><span>${votes} · ${percent.toLocaleString('ru',{maximumFractionDigits:1})}%</span></span><span class="v2-chart-track" aria-hidden="true"><i style="width:${percent}%"></i></span></button>`;}).join('');
    $('#voting-updated').textContent=state.lastUpdated?'обновлено '+state.lastUpdated.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'обновление результатов не выполнялось';
    $('#voting-withdraw').hidden=!mine;$('#voting-withdraw').disabled=state.pending;$('#voting-refresh').disabled=state.loading;
    const reset=$('#voting-reset-filter');if(reset)reset.onclick=()=>{$('#voting-search').value='';$('#voting-family').value='all';render();};
  }
  async function refresh(){
    if(!app.backend.configured){app.notify('общественное голосование пока не подключено.');render();return;}
    if(state.loading)return;state.loading=true;render();
    try{
      const rows=await app.backend.rpc('voting_results');if(!Array.isArray(rows))throw new Error('сервер вернул неожиданный формат результатов.');
      state.rows=rows.map(row=>({...row,vote_count:Number(row.vote_count)})).filter(row=>app.votingCategories.some(c=>c.id===row.category_id)&&app.votingCandidates.some(c=>c.id===row.distro_id)&&Number.isSafeInteger(row.vote_count)&&row.vote_count>=0);
      if(!state.rows.length)throw new Error('каталог голосования на сервере ещё не настроен.');
      state.lastUpdated=new Date();state.error='';
    }catch(error){state.error=error.message;}finally{state.loading=false;render();}
  }
  async function vote(id){
    if(!app.backend.session?.user.email_confirmed_at){app.profile?.open('signin');return;}
    if(state.pending)return;state.pending=true;render();
    try{await app.backend.rpc('cast_vote',{p_category_id:category().id,p_distro_id:id});app.notify(id?'голос сохранён.':'голос отозван.');await refresh();}
    catch(error){app.notify(error.message);state.error=error.message;}finally{state.pending=false;render();}
  }
  $('#voting-cards').onclick=event=>{const button=event.target.closest('[data-vote]');if(button)void vote(button.dataset.vote);};
  $('#voting-status').onclick=event=>{if(event.target.closest('[data-community-login]'))app.profile?.open('signin');};
  $('#voting-withdraw').onclick=()=>void vote(null);$('#voting-refresh').onclick=()=>void refresh();
  $('#voting-chart').onclick=event=>{const button=event.target.closest('[data-chart-candidate]');if(!button)return;$('#voting-search').value='';$('#voting-family').value='all';render();const card=$('#vote-card-'+button.dataset.chartCandidate);card?.scrollIntoView({block:'nearest'});card?.querySelector('button')?.focus({preventScroll:true});};
  for(const id of ['voting-category','voting-family','voting-sort'])$('#'+id).onchange=()=>{if(id==='voting-category'){$('#voting-search').value='';$('#voting-family').value='all';}render();};
  $('#voting-search').oninput=render;
  root.addEventListener('dan:account',()=>{render();if(app.backend.status==='ready'&&!state.rows&&!state.loading)void refresh();});
  if('IntersectionObserver' in root){const observer=new IntersectionObserver(entries=>{state.visible=entries[0].isIntersecting;if(state.visible&&app.backend.configured&&!state.rows)void refresh();});observer.observe($('#community'));}else state.visible=true;
  const interval=setInterval(()=>{if(state.visible&&!document.hidden&&app.backend.configured)void refresh();},Math.max(15,Number(root.DAN_CONFIG?.votingPollSeconds)||30)*1000);
  root.addEventListener('pagehide',()=>clearInterval(interval));
  app.community={refresh,render};render();
})(globalThis);
