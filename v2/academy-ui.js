(function(root){
  'use strict';
  const app=root.DanV2,$=app.$,h=app.escape;
  let course='basics',current=app.store.read('dan-academy-last-lesson','linux'),drafts=new Map();
  if(!app.lessons.some(lesson=>lesson.id===current))current='linux';
  course=app.lessons.find(lesson=>lesson.id===current).course;
  const currentLesson=()=>app.lessons.find(lesson=>lesson.id===current);
  const draft=()=>{if(!drafts.has(current))drafts.set(current,{practice:null,quiz:null,practiceFeedback:'',quizFeedback:'',terminalEntries:[],terminalLog:'песочница /home/guest готова. начни с примера урока.'});return drafts.get(current);};
  function practiceLog(state=draft()){
    const intro=app.terminalText(state.terminalLog)+(state.includePrompt?' '+(app.i18n?.t(currentLesson().practice.prompt)||currentLesson().practice.prompt):'');
    return (intro+(state.terminalEntries||[]).map(entry=>'\n$ '+entry.source+'\n'+app.terminalOutput(entry.result)).join('')).slice(-9000);
  }
  function renderOverview(){
    const summary=app.progress.summary();$('#academy-level').textContent='уровень '+summary.level;$('#academy-xp').textContent=summary.xp+' XP';$('#academy-completed').textContent=`${summary.completed.length} из ${app.lessons.length} уроков`;
    $('#academy-progress').setAttribute('aria-valuenow',summary.completed.length);$('#academy-progress i').style.width=(summary.completed.length/app.lessons.length*100)+'%';
    const backend=app.backend;
    $('#academy-sync').textContent=!backend.session?'гостевой прогресс сохраняется в этом браузере':backend.dashboard?'прогресс синхронизирован с аккаунтом':backend.error||'загружаем прогресс аккаунта…';
    $('#academy-badge-count').textContent=summary.badges.length+' / '+app.achievements.length;
    $('#academy-badges').innerHTML=app.badgesHTML(summary);
    $('#academy-courses').innerHTML=app.courses.map(item=>{const lessons=app.lessons.filter(lesson=>lesson.course===item.id),done=lessons.filter(lesson=>summary.completed.includes(lesson.id)).length;return `<button class="v2-course-card" data-course="${item.id}" aria-pressed="${course===item.id}"><img src="${root.DanLegacy.logo(item.icon)}" alt="" width="30" height="30"><h3>${h(item.title)}</h3><p>${h(item.description)}</p><span>${done} / ${lessons.length} уроков</span><div class="v2-progress-track" aria-hidden="true"><i style="width:${done/lessons.length*100}%"></i></div></button>`;}).join('');
    const showXP=backend.dashboard?.profile?.preferences?.show_xp!==false;$('#academy-xp').hidden=!showXP;
    renderSidebar(summary);
  }
  function renderSidebar(summary=app.progress.summary()){
    const lessons=app.lessons.filter(lesson=>lesson.course===course);$('#academy-course-name').textContent=app.courses.find(item=>item.id===course).title;
    $('#academy-course-count').textContent=lessons.filter(lesson=>summary.completed.includes(lesson.id)).length+'/'+lessons.length;
    $('#academy-lessons').innerHTML=lessons.map(lesson=>`<button class="v2-lesson-button" data-lesson="${lesson.id}" ${lesson.id===current?'aria-current="step"':''}><span class="v2-lesson-mark ${summary.completed.includes(lesson.id)?'done':''}" aria-label="${summary.completed.includes(lesson.id)?'пройдено':'ещё не пройдено'}">${summary.completed.includes(lesson.id)?'✓':''}</span><span>${h(lesson.title)}</span></button>`).join('');
  }
  function choices(options,type,selected){return options.map(option=>`<button class="v2-choice" data-${type}="${option.id}" aria-pressed="${option.id===selected}">${h(option.label)}</button>`).join('');}
  function renderLesson(){
    const lesson=currentLesson(),state=draft(),completed=app.progress.summary().completed.includes(lesson.id),lessons=app.lessons.filter(l=>l.course===course),index=lessons.findIndex(l=>l.id===lesson.id);
    $('#academy-lesson').innerHTML=`<div class="v2-lesson-meta"><span>${h(app.courses.find(item=>item.id===course).title)} · ${index+1} / ${lessons.length}</span><span>${completed?'пройдено':`+${lesson.xp} XP`}</span></div><h3 id="academy-lesson-heading" tabindex="-1">${h(lesson.title)}</h3>${lesson.body.map(text=>`<p>${h(text)}</p>`).join('')}<div class="v2-examples">${lesson.examples.map(([title,code])=>`<div class="v2-example"><small>${h(title)}</small><pre><code>${h(code)}</code></pre></div>`).join('')}</div><div class="v2-practice"><h4>попробуй сам</h4><p>${h(lesson.practice.prompt)}</p>${lesson.practice.kind==='choice'?`<div class="v2-choice-group" role="group" aria-label="практическое задание">${choices(lesson.practice.options,'practice-choice',state.practice)}</div>`:`<div class="v2-practice-terminal"><pre id="practice-output" aria-live="polite">${h(practiceLog(state))}</pre><form id="practice-form" autocomplete="off"><label for="practice-input">$</label><input id="practice-input" aria-label="команда для практического задания" maxlength="500" spellcheck="false" autocapitalize="none" placeholder="команда в симуляторе"><button type="submit">выполнить</button></form></div><div class="v2-practice-tools"><button type="button" id="practice-reset">сбросить песочницу</button><a href="#terminal">открыть общий терминал</a></div>`}<p id="practice-feedback" class="v2-feedback" role="status">${h(state.practiceFeedback)}</p></div><div class="v2-lesson-quiz"><h4>мини-тест</h4><p>${h(lesson.quiz.question)}</p><div class="v2-choice-group" role="group" aria-label="мини-тест урока">${choices(lesson.quiz.options,'quiz-choice',state.quiz)}</div><p id="quiz-feedback" class="v2-feedback" role="status">${h(state.quizFeedback)}</p></div><div id="lesson-prerequisite" class="v2-prerequisite" hidden></div><div class="v2-lesson-actions"><button class="button primary" id="lesson-complete">${completed?'урок уже пройден':'проверить и завершить'}</button><button class="button" id="lesson-next">${index===lessons.length-1?'следующий курс':'следующий урок'}</button></div><p class="v2-form-status" id="lesson-status" role="status"></p>`;
    if(lesson.practice.kind==='terminal'){
      $('#practice-form').onsubmit=event=>{event.preventDefault();const value=$('#practice-input').value.trim();if(!value)return;root.DanLegacy.runCommand(value);$('#practice-input').value='';$('#practice-input').focus({preventScroll:true});};
      $('#practice-reset').onclick=()=>{app.shellUI.reset(lesson.practice.setup);state.practice=null;state.terminalLog='песочница сброшена. снова /home/guest.';state.terminalEntries=[];state.includePrompt=false;state.practiceFeedback='';$('#practice-output').textContent=practiceLog(state);$('#practice-feedback').textContent='';};
    }
    $('#academy-lesson').onclick=event=>{
      const practice=event.target.closest('[data-practice-choice]'),quiz=event.target.closest('[data-quiz-choice]');
      if(practice){state.practice=practice.dataset.practiceChoice;const option=lesson.practice.options.find(item=>item.id===state.practice);state.practiceFeedback=option.why;app.$$('[data-practice-choice]',$('#academy-lesson')).forEach(button=>button.setAttribute('aria-pressed',String(button===practice)));setFeedback('#practice-feedback',state.practiceFeedback,state.practice===lesson.practice.answer);}
      if(quiz){state.quiz=quiz.dataset.quizChoice;const option=lesson.quiz.options.find(item=>item.id===state.quiz);state.quizFeedback=option.why;app.$$('[data-quiz-choice]',$('#academy-lesson')).forEach(button=>button.setAttribute('aria-pressed',String(button===quiz)));setFeedback('#quiz-feedback',state.quizFeedback,state.quiz===lesson.quiz.answer);}
    };
    $('#lesson-complete').onclick=completeLesson;
    $('#lesson-next').onclick=()=>{
      if(!app.progress.summary().completed.includes(lesson.id)){setStatus('сначала заверши практику и мини-тест этого урока.',true);return;}
      const next=lessons[index+1]||app.lessons.find(item=>item.course===app.courses[(app.courses.findIndex(c=>c.id===course)+1)%app.courses.length].id);selectLesson(next.id,true);
    };
    updatePrerequisite();
    if(state.practiceFeedback)setFeedback('#practice-feedback',state.practiceFeedback,lesson.practice.kind==='choice'?state.practice===lesson.practice.answer:!!state.practice);
    if(state.quizFeedback)setFeedback('#quiz-feedback',state.quizFeedback,state.quiz===lesson.quiz.answer);
  }
  function setStatus(text,error=false){$('#lesson-status').textContent=text;$('#lesson-status').classList.toggle('error',error);}
  function setFeedback(selector,text,correct){const box=$(selector);box.textContent=text;box.classList.toggle('success',correct);box.classList.toggle('error',!correct);}
  function updatePrerequisite(){
    if(!$('#lesson-prerequisite'))return;const lesson=currentLesson(),completed=app.progress.summary().completed,missing=lesson.prerequisite&&!completed.includes(lesson.prerequisite);
    $('#lesson-prerequisite').hidden=!missing;if(missing)$('#lesson-prerequisite').textContent='читать можно уже сейчас. чтобы получить XP, сначала заверши «'+app.lessons.find(item=>item.id===lesson.prerequisite).title+'».';
    const done=completed.includes(lesson.id);$('#lesson-complete').disabled=done;$('#lesson-complete').textContent=done?'урок уже пройден':'проверить и завершить';
  }
  async function completeLesson(){
    const lesson=currentLesson(),state=draft(),practice=lesson.practice.kind==='terminal'?app.shell.proof(lesson.practice):state.practice;
    if(!practice||(lesson.practice.kind==='choice'&&practice!==lesson.practice.answer)){setStatus('практика пока не выполнена. посмотри пример и объяснение задания.',true);return;}
    if(state.quiz!==lesson.quiz.answer){setStatus('ответь на мини-тест. под каждым вариантом есть объяснение.',true);return;}
    const button=$('#lesson-complete');button.disabled=true;setStatus(app.backend.session?'сервер проверяет ответ…':'проверяем задание…');
    try{await app.progress.complete(lesson,practice,state.quiz);renderOverview();updatePrerequisite();setStatus(app.backend.session?'урок завершён. XP подтверждён сервером.':'урок завершён. прогресс сохранён в этом браузере.');}
    catch(error){button.disabled=false;setStatus(error.message,true);}
  }
  function selectLesson(id,focus=false){
    current=id;const lesson=currentLesson();course=lesson.course;app.store.write('dan-academy-last-lesson',current);
    app.shellUI.reset(lesson.practice.setup||{});const state=draft();if(lesson.practice.kind==='terminal'){state.practice=null;state.practiceFeedback='';state.terminalLog='песочница /home/guest готова.';state.terminalEntries=[];state.includePrompt=true;}
    renderOverview();renderLesson();if(focus){$('#academy-lesson').scrollIntoView({block:'start'});$('#academy-lesson-heading').focus({preventScroll:true});}
  }
  $('#academy-courses').onclick=event=>{const button=event.target.closest('[data-course]');if(!button)return;const summary=app.progress.summary();const lessons=app.lessons.filter(item=>item.course===button.dataset.course);selectLesson((lessons.find(item=>!summary.completed.includes(item.id))||lessons[0]).id);};
  $('#academy-lessons').onclick=event=>{const button=event.target.closest('[data-lesson]');if(button)selectLesson(button.dataset.lesson,true);};
  $('#academy-resume').onclick=()=>{const completed=app.progress.summary().completed;selectLesson((app.lessons.find(lesson=>!completed.includes(lesson.id))||app.lessons[0]).id,true);};
  root.addEventListener('dan:command',event=>{
    const lesson=currentLesson();if(lesson.practice.kind!=='terminal')return;
    const state=draft(),{source,result}=event.detail;state.terminalEntries.push({source,result});state.terminalEntries=state.terminalEntries.slice(-80);while(state.terminalEntries.length>1&&state.terminalEntries.reduce((size,entry)=>size+entry.source.length+entry.result.output.length,0)>9000)state.terminalEntries.shift();
    if($('#practice-output')){$('#practice-output').textContent=practiceLog(state);$('#practice-output').scrollTop=$('#practice-output').scrollHeight;}
    state.practice=app.shell.proof(lesson.practice);
    if(state.practice){state.practiceFeedback='практика выполнена: результат в виртуальной системе соответствует заданию.';setFeedback('#practice-feedback',state.practiceFeedback,true);}
    else if(!result.ok){state.practiceFeedback=result.output;setFeedback('#practice-feedback',state.practiceFeedback,false);}
  });
  root.addEventListener('dan:progress',()=>{renderOverview();updatePrerequisite();});
  root.addEventListener('dan-language-changed',()=>{if($('#practice-output'))$('#practice-output').textContent=practiceLog();});
  app.academy={selectLesson,currentLesson,renderOverview};
  selectLesson(current);
})(globalThis);
