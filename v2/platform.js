(function (root) {
  'use strict';
  const app=root.DanV2,legacy=root.DanLegacy;
  if(!app||!legacy)return;

  app.shell=new app.Simulator();
  const outputRecords=new WeakMap();
  const welcome=legacy.output.querySelector('pre');if(welcome)outputRecords.set(welcome,{output:welcome.textContent});
  function printResult(result,style){legacy.terminalPrint(app.terminalOutput(result),style);const node=legacy.output.lastElementChild;if(node)outputRecords.set(node,result);}
  function refreshLanguage(){for(const node of legacy.output.querySelectorAll('pre')){const record=outputRecords.get(node);if(record)node.textContent=app.terminalOutput(record);}}
  root.addEventListener('dan-language-changed',refreshLanguage);
  let activeAnimation=null;
  function stopAnimation(){if(activeAnimation){clearInterval(activeAnimation.timer);activeAnimation.observer?.disconnect();activeAnimation.button?.remove();activeAnimation=null;}}
  function animateChocolate(){
    stopAnimation();
    const figure=document.createElement('div');figure.className='v2-chocolate-figure';
    const label=document.createElement('span');label.className='v2-chocolate-label';label.textContent='chocolate trapezoid · ASCII edition';
    const accessible=document.createElement('span');accessible.className='v2-sr-only';accessible.textContent='вращающаяся шоколадная трапеция из ASCII-символов.';
    const pre=document.createElement('pre');pre.className='v2-chocolate-frame';pre.setAttribute('aria-hidden','true');
    const button=document.createElement('button');button.type='button';
    figure.append(label,accessible,pre,button);legacy.output.append(figure);
    const media=matchMedia('(prefers-reduced-motion: reduce)');let paused=media.matches,angle=-.3,visible=true;
    const updateLabel=()=>{button.textContent=paused?'вращать трапецию':'пауза';button.setAttribute('aria-pressed',String(!paused));};
    pre.textContent=app.renderChocolate(angle);updateLabel();button.onclick=()=>{paused=!paused;updateLabel();};
    let observer=null;if('IntersectionObserver' in root){observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});observer.observe(figure);}
    const timer=setInterval(()=>{if(!figure.isConnected){clearInterval(timer);observer?.disconnect();return;}if(paused||!visible||document.hidden)return;angle+=.12;pre.textContent=app.renderChocolate(angle);},120);
    activeAnimation={timer,observer,button};legacy.output.scrollTop=legacy.output.scrollHeight;
  }
  app.shellUI={
    run(source){
      const previousCwd=app.shell.cwd.replace('/home/guest','~');
      const result=app.shell.execute(source);
      if(result.special==='clear'){stopAnimation();legacy.output.replaceChildren();}
      else {legacy.terminalPrint(`guest@linux:${previousCwd}$ ${source}`,'prompt');if(result.output)printResult(result,result.ok?'terminal-success':'');}
      if(result.special==='chocolate'){
        animateChocolate();void app.progress.chocolate(result.canonical).catch(error=>app.notify('секрет найден, но достижение пока не сохранено: '+error.message));
      }
      if(result.special==='arch')app.notify('i use arch btw.');
      const label=document.querySelector('#terminal-form label');label.textContent='guest@linux:'+app.shell.cwd.replace('/home/guest','~')+'$';
      app.emit('dan:command',{source,result});return result;
    },
    stopAnimation,
    refreshLanguage,
    reset(setup){app.shell.reset(setup);app.emit('dan:sandbox-reset',{});}
  };
  root.addEventListener('pagehide',stopAnimation);
})(globalThis);
