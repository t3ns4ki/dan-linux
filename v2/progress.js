/* Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
(function(root){'use strict';const app=root.DanV2,h=app.escape;
  app.$=(selector,base=document)=>base.querySelector(selector);
  app.$$=(selector,base=document)=>[...base.querySelectorAll(selector)];
  const guestKey='dan-academy-v2-guest';
  function readGuest(){
    const saved=app.store.read(guestKey,{}),completed={};
    for(const lesson of app.lessons){const record=saved?.completed?.[lesson.id];if(record&&record.revision===lesson.revision&&record.quiz_answer===lesson.quiz.answer&&typeof record.at==='string')completed[lesson.id]=record;}
    return {version:2,completed,secrets:Array.isArray(saved?.secrets)&&saved.secrets.includes('chocolate')?['chocolate']:[]};
  }
  let guest=readGuest();
  app.progress={
    guest:()=>guest,
    state(){
      if(!app.backend.session)return guest;
      const completed=Object.fromEntries((app.backend.dashboard?.progress||[]).map(row=>[row.lesson_id,{revision:row.revision,at:row.completed_at}]));
      return {version:2,completed,secrets:(app.backend.dashboard?.achievements||[]).some(item=>item.id==='chocolate')?['chocolate']:[]};
    },
    summary(){
      const summary=app.progressSummary(this.state());
      if(app.backend.session&&app.backend.dashboard?.profile){summary.xp=app.backend.dashboard.profile.xp;summary.level=app.backend.dashboard.profile.level;summary.badges=app.backend.dashboard.achievements.map(item=>item.id);}
      return summary;
    },
    async complete(lesson,practice,quiz){
      const state=this.state();
      if(lesson.prerequisite&&!state.completed[lesson.prerequisite])throw new Error('сначала заверши предыдущий урок этого курса.');
      if(quiz!==lesson.quiz.answer)throw new Error('сначала проверь ответ на тест.');
      const before=this.summary().badges;
      if(app.backend.session){
        await app.backend.rpc('submit_lesson',{p_lesson_id:lesson.id,p_practice_answer:practice,p_quiz_answer:quiz,p_revision:lesson.revision});
      }else{
        if(!guest.completed[lesson.id])guest.completed[lesson.id]={practice_answer:practice,quiz_answer:quiz,revision:lesson.revision,at:new Date().toISOString()};
        if(!app.store.write(guestKey,guest))app.notify('браузер запретил сохранение: прогресс доступен только до закрытия страницы.');
      }
      app.emit('dan:progress',{});celebrate(before,this.summary().badges);
    },
    async chocolate(phrase){
      const before=this.summary().badges;
      if(app.backend.session)await app.backend.rpc('claim_chocolate',{p_phrase:phrase});
      else {guest.secrets=['chocolate'];app.store.write(guestKey,guest);}
      app.emit('dan:progress',{});celebrate(before,this.summary().badges);
    },
    clearGuest(){guest={version:2,completed:{},secrets:[]};app.store.remove(guestKey);app.emit('dan:progress',{});},
    async importGuest(onProgress=()=>{}){
      if(!app.backend.session)throw new Error('сначала войди в аккаунт.');
      const uid=app.backend.session.user.id,records=app.lessons.filter(lesson=>guest.completed[lesson.id]);let imported=0;
      for(const lesson of records){
        if(app.backend.session?.user.id!==uid)throw new Error('сеанс изменился. перенос остановлен.');
        const record=guest.completed[lesson.id];
        await app.backend.rpc('submit_lesson',{p_lesson_id:lesson.id,p_practice_answer:record.practice_answer,p_quiz_answer:record.quiz_answer,p_revision:record.revision});
        onProgress(++imported,records.length);
      }
      if(guest.secrets.includes('chocolate'))await app.backend.rpc('claim_chocolate',{p_phrase:'chocolate-trapezoid'});
      app.emit('dan:progress',{});return imported;
    }
  };
  function celebrate(before,after){if(app.backend.dashboard?.profile?.preferences?.celebrate_achievements===false)return;const added=after.filter(id=>!before.includes(id));if(added.length){const badge=app.achievements.find(item=>item.id===added.at(-1));app.notify('достижение: '+badge.name+' · +'+badge.bonus+' XP');}}
  root.addEventListener('dan:account',()=>app.emit('dan:progress',{}));

  app.downloadJSON=(filename,value)=>{const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  document.addEventListener('DOMContentLoaded',()=>{if(app.backend.configured)void app.backend.init().catch(()=>{});});
  function badgesHTML(summary){return app.achievements.map(badge=>{const earned=summary.badges.includes(badge.id),secret=badge.secret&&!earned;return `<article class="v2-badge ${earned?'earned':'locked'}"><span class="v2-badge-symbol" aria-hidden="true">${earned?'✧':'◇'}</span><h4>${secret?'???':h(badge.name)}</h4><p>${secret?'маленький секрет где-то в терминале.':h(badge.description)}</p><small>${earned?'получено · ':''}+${badge.bonus} XP</small></article>`;}).join('');}
  app.badgesHTML=badgesHTML;
})(globalThis);
