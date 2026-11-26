(function (root) {
  'use strict';
  const app = root.DanV2;
  class SimError extends Error {}
  const fail = message => { throw new SimError(message); };
  function tokenize(source) {
    const tokens = [];
    let fragments = [], part = '', quote = '', started = false;
    function fragment(expand = true) { if (part) { fragments.push({text:part,expand}); part = ''; } }
    function flush() { fragment(); if (started) tokens.push({raw:fragments.map(item => item.text).join(''),fragments}); fragments=[]; started=false; }
    if (source.length > 500) fail('команда слишком длинная: максимум 500 символов.');
    for (let index = 0; index < source.length; index++) {
      const char = source[index];
      if (quote) {
        if (char === quote) { fragment(quote !== "'"); quote = ''; }
        else if (char === '\\' && quote === '"' && ['"','\\','$'].includes(source[index + 1])) {
          fragment(true); fragments.push({text:source[++index],expand:false});
        } else part += char;
        continue;
      }
      if (char === '"' || char === "'") { fragment(); quote=char; started=true; continue; }
      if (/\s/.test(char)) { flush(); continue; }
      if (char === '\\') { fragment(); if (index + 1 >= source.length) fail('после \\ нужен символ.'); fragments.push({text:source[++index],expand:false}); started=true; continue; }
      if (char === ';' || char === '&' || char === '<' || char === '`') fail('эта конструкция не поддерживается учебной оболочкой. команды выполняются только в симуляции.');
      if (char === '|' || char === '>') {
        flush(); const op = char === '>' && source[index + 1] === '>' ? (index++, '>>') : char;
        if (op === '|' && source[index + 1] === '|') fail('|| пока не поддерживается; попробуй обычный пайп |.');
        tokens.push({op,raw:op}); continue;
      }
      part += char; started=true;
    }
    if (quote) fail('закрой кавычки в конце команды.');
    flush();
    return tokens;
  }
  class Simulator {
    constructor() { this.reset(); }
    reset(setup = {}) {
      this.cwd = '/home/guest'; this.vars = {USER:'guest',HOME:'/home/guest',XDG_SESSION_TYPE:'wayland',XDG_CURRENT_DESKTOP:'GNOME'};
      this.fs = new Map([
        ['/home/guest',{kind:'dir',mode:'755'}],
        ['/home/guest/Desktop',{kind:'dir',mode:'755'}],
        ['/home/guest/Documents',{kind:'dir',mode:'755'}],
        ['/home/guest/notes.txt',{kind:'file',mode:'600',text:'hello Linux\nhello Windows\nLinux is fun\n'}],
        ['/home/guest/freedom.txt',{kind:'file',mode:'644',text:'freedom is a feature, not an option.\n'}],
        ['/home/guest/hello.c',{kind:'file',mode:'644',text:'#include <stdio.h>\nint main(void) { puts("hello, Linux!"); return 0; }\n'}],
        ['/home/guest/arch-wiki.url',{kind:'file',mode:'644',text:'https://wiki.archlinux.org/\n'}],
        ['/home/guest/chocolate-trapezoid.recipe',{kind:'file',mode:'644',text:'chocolate + curiosity = ?\n'}]
      ]);
      for (const [path,text] of Object.entries(setup.files || {})) this.fs.set(this.path(path),{kind:'file',mode:'644',text:String(text).slice(0,8192)});
      this.packages = new Set(['python','coreutils']); this.events=[]; this.last=null;
    }
    path(value) {
      if (!value || value.includes('\0')) fail('нужен путь к файлу или папке.');
      if (value === '~') value='/home/guest';
      else if (value.startsWith('~/')) value='/home/guest/'+value.slice(2);
      const parts = (value.startsWith('/') ? value : this.cwd+'/'+value).split('/'); const normalized=[];
      for (const part of parts) { if (part === '..') normalized.pop(); else if (part && part !== '.') normalized.push(part); }
      const path='/'+normalized.join('/');
      if (path !== '/home/guest' && !path.startsWith('/home/guest/')) fail('песочница ограничена /home/guest. реальные каталоги компьютера недоступны.');
      if (path.length > 240) fail('слишком длинное имя пути.');
      return path;
    }
    parent(path) { return path.slice(0,path.lastIndexOf('/')) || '/'; }
    get(path, kind) { const item=this.fs.get(path); if (!item) fail('нет такого файла или папки: '+path+'. проверь pwd и ls.'); if (kind && item.kind !== kind) fail(kind==='file'?'это папка, а нужен файл.':'это файл, а нужна папка.'); return item; }
    write(path,text) { if (this.fs.size >= 128 && !this.fs.has(path)) fail('учебный лимит: 128 файлов и папок. сбрось песочницу.'); if (text.length>8192) fail('учебный файл ограничен 8192 символами.'); this.get(this.parent(path),'dir'); if (this.fs.get(path)?.kind==='dir') fail('нельзя записать текст вместо папки.'); this.fs.set(path,{kind:'file',mode:this.fs.get(path)?.mode||'644',text}); }
    execute(source) {
      try {
        const tokens=tokenize(source.trim());
        if (!tokens.length) return {ok:true,output:'',canonical:'',cwd:this.cwd};
        const canonical=tokens.map(token=>token.raw).join(' ');
        const groups=[[]];
        for (const token of tokens) { if (token.op==='|') { if (!groups.at(-1).length) fail('перед | нужна команда.'); groups.push([]); } else groups.at(-1).push(token); }
        if (groups.length>4 || !groups.at(-1).length) fail('нужны команды с обеих сторон пайпа, максимум четыре.');
        let output='', special=null,verbatim=false;
        for (const group of groups) {
          let redirect=null;
          const redirectIndex=group.findIndex(token=>token.op==='>'||token.op==='>>');
          let actual=group;
          if (redirectIndex>=0) {
            if (redirectIndex!==group.length-2 || group.at(-1).op) fail('после > или >> укажи ровно один файл.');
            redirect={append:group[redirectIndex].op==='>>',path:this.path(this.expand(group.at(-1)))};
            actual=group.slice(0,redirectIndex);
          }
          if (actual.some(token=>token.op)) fail('неподдерживаемое перенаправление.');
          const words=actual.map(token=>this.expand(token));
          if (!words.length) fail('перед перенаправлением нужна команда.');
          const result=this.command(words,output); output=result.output||''; special=result.special||special;verbatim=!!result.verbatim;
          if (redirect) { const previous=redirect.append&&this.fs.has(redirect.path)?this.get(redirect.path,'file').text:''; this.write(redirect.path,previous+output); output=''; }
        }
        const result={ok:true,output:output.slice(0,12000),verbatim,special,canonical,cwd:this.cwd,pipeline:groups.length>1};
        this.last=result;this.events.push(result);this.events=this.events.slice(-80);return result;
      } catch (error) {
        const result={ok:false,output:error instanceof SimError?error.message:'симулятор не смог разобрать команду. попробуй help.',canonical:source.slice(0,500),cwd:this.cwd};
        this.last=result;return result;
      }
    }
    expand(token) { return token.fragments.map(part=>part.expand?part.text.replace(/\$([A-Za-z_][A-Za-z_0-9]*)/g,(_,key)=>key==='PWD'?this.cwd:(this.vars[key]||'')):part.text).join(''); }
    command(words,stdin='') {
      const result=output=>({output}),data=output=>({output,verbatim:true}); let [name,...args]=words; let elevated=false;
      if (name==='sudo') { elevated=true; [name,...args]=args; if (!name) fail('после sudo нужна команда. реальный пароль здесь не нужен.'); }
      if (/^[A-Za-z_][A-Za-z_0-9]*=/.test(name)) { if (args.length) fail('для первого упражнения используй одно присваивание без пробелов.'); const index=name.indexOf('=');this.vars[name.slice(0,index)]=name.slice(index+1);return result(''); }
      const need=(count)=>{if(args.length!==count)fail(name+': ожидается '+count+' аргумент(а). посмотри пример урока.');};
      switch(name) {
        case 'help': return result('учебная оболочка: ls, cd, pwd, mkdir, touch, cat, cp, mv, grep, chmod, whoami, id, sudo whoami, echo, uname, ps, cc, makepkg.\nпайпы | и перенаправления > >> работают с виртуальными файлами.\nпакеты: pacman, apt, dnf, xbps-install/query/remove, emerge, yay, paru, apk, zypper — только имитация.\nещё: fastfetch, neofetch, clear, sl, fortune, i use arch btw, chocolate-trapezoid.\nэто не полный Bash. файлы, пакеты и сведения о системе вымышленные.');
        case 'sl':need(0);return {output:'choo choo! Tux Express прибыл в симулятор.\n',special:'train'};
        case 'fortune':need(0);return result(app.fortunes[Math.floor(Math.random()*app.fortunes.length)]+'\n');
        case 'pwd':need(0);return data(this.cwd+'\n');
        case 'cd': if(args.length>1)fail('cd: укажи одну папку.');{const target=this.path(args[0]||'/home/guest');this.get(target,'dir');this.cwd=target;return result('');}
        case 'ls': {
          const flags=args.filter(arg=>arg.startsWith('-'));if(flags.some(flag=>!['-l','-a','-la','-al'].includes(flag)))fail('учебный ls поддерживает -l и -a.');
          const paths=args.filter(arg=>!arg.startsWith('-'));if(paths.length>1)fail('для упражнения укажи одну папку.');
          const path=this.path(paths[0]||this.cwd),item=this.get(path);const long=flags.some(flag=>flag.includes('l'));
          const names=item.kind==='file'?[path]:[...this.fs.keys()].filter(key=>this.parent(key)===path&&key!==path);
          return data(names.map(key=>{const file=this.fs.get(key),label=key.slice(key.lastIndexOf('/')+1)+(file.kind==='dir'?'/':'');return long?`${file.kind==='dir'?'d':'-'}${this.modeText(file.mode)} guest guest ${file.text?.length||0} ${label}`:label;}).join(long?'\n':'  ')+'\n');
        }
        case 'mkdir': { const recursive=args[0]==='-p';if(recursive)args=args.slice(1);need(1);const path=this.path(args[0]);if(this.fs.has(path)&&!recursive)fail('папка или файл с таким именем уже есть.');if(this.fs.size>=128)fail('песочница заполнена; сбрось её.');if(recursive){if(path==='/home/guest')return result('');const parts=path.slice('/home/guest/'.length).split('/');let prefix='/home/guest';const missing=[];for(const part of parts){prefix+='/'+part;if(this.fs.has(prefix))this.get(prefix,'dir');else missing.push(prefix);}if(this.fs.size+missing.length>128)fail('песочница заполнена; сбрось её.');for(const entry of missing)this.fs.set(entry,{kind:'dir',mode:'755'});}else {this.get(this.parent(path),'dir');this.fs.set(path,{kind:'dir',mode:'755'});}return result(''); }
        case 'touch':need(1);{const path=this.path(args[0]);if(!this.fs.has(path))this.write(path,'');else this.get(path,'file');return result('');}
        case 'cat': {if(!args.length)return data(stdin);return data(args.map(arg=>this.get(this.path(arg),'file').text).join(''));}
        case 'cp':case 'mv':need(2);{const from=this.path(args[0]),to=this.path(args[1]);const file=this.get(from,'file');if(this.fs.has(to))fail('цель уже существует. в этой песочнице выбери новое имя, чтобы не затереть файл.');this.write(to,file.text);this.fs.get(to).mode=file.mode;if(name==='mv')this.fs.delete(from);return result('');}
        case 'grep': {
          let insensitive=false;if(args[0]==='-i'){insensitive=true;args=args.slice(1);}if(args.length<1||args.length>2)fail('пример: grep Linux notes.txt или cat notes.txt | grep Linux');
          const query=args[0],input=args[1]?this.get(this.path(args[1]),'file').text:stdin;
          const found=input.split('\n').filter(line=>(insensitive?line.toLowerCase():line).includes(insensitive?query.toLowerCase():query));
          return data(found.length?found.join('\n')+'\n':'');
        }
        case 'chmod':need(2);if(!/^[0-7]{3}$/.test(args[0]))fail('учебный chmod принимает три восьмеричные цифры, например 644.');this.get(this.path(args[1])).mode=args[0];return result('');
        case 'whoami':need(0);return result(elevated?'root\n':'guest\n');
        case 'id':return result(elevated?'uid=0(root) [симуляция]\n':'uid=1000(guest) gid=1000(guest) [симуляция]\n');
        case 'echo':return data(args.join(' ')+'\n');
        case 'clear':return {output:'',special:'clear'};
        case 'uname':return result(args.includes('-r')?'6.x-dan-simulator\n':args.includes('-a')?'Linux freedom 6.x-dan-simulator browser GNU/fun\n':'Linux (browser simulator)\n');
        case 'ps':if(args.join(' ')==='-p 1 -o comm=')return result('systemd\n');fail('учебный пример: ps -p 1 -o comm=');break;
        case 'cc':need(3);if(args[1]!=='-o')fail('пример: cc hello.c -o hello');this.get(this.path(args[0]),'file');this.write(this.path(args[2]),'SIMULATED_EXECUTABLE');this.fs.get(this.path(args[2])).mode='755';return result('учебный исполняемый файл создан. настоящая компиляция не выполнялась.\n');
        case './hello': {const executable=this.get(this.path('hello'),'file');if(executable.text!=='SIMULATED_EXECUTABLE')fail('сначала изобрази сборку: cc hello.c -o hello');return result('hello, Linux!\n');}
        case 'makepkg':if(elevated)fail('makepkg не запускают от root: PKGBUILD выполняет команды и не должен получать лишние права. попробуй makepkg -si без sudo.');if(args.join(' ')!=='-si')fail('учебный пример: makepkg -si');return result('пакет собран и установлен [симуляция].\n');
        case 'fastfetch':case 'neofetch':return result(app.archAscii+'\n\nguest@freedom\nOS: Arch Linux (browser edition)\nKernel: 6.x-dan-simulator\nDE: your choice\nMemory: enough for one chocolate trapezoid\nPackages: freedom + a few cookies\n\nэто шутка, а не данные твоего компьютера.\n');
        case 'i':if(args.join(' ').replace(/\.$/,'')==='use arch btw')return {output:'i use arch btw. теперь все знают.\n',special:'arch'};break;
        case 'chocolate-trapezoid':if(!args.length)return {output:'шоколадная трапеция материализована.\nS = (a + b) × h / 2.\n',special:'chocolate'};break;
        case 'chocolate':if(args.join(' ')==='trapezoid')return {output:'шоколадная трапеция материализована.\nS = (a + b) × h / 2.\n',special:'chocolate'};break;
        default: if(['pacman','apt','dnf','xbps-install','xbps-query','xbps-remove','emerge','yay','paru','apk','zypper'].includes(name))return this.packageCommand(name,args,elevated);
      }
      fail(name+': команда не найдена в симуляторе. напиши help.');
    }
    packageCommand(name,args,elevated) {
      const command=args.join(' '),values=args.filter(arg=>!arg.startsWith('-')),raw=values.at(-1)||'firefox',pkg=raw.split('/').at(-1);
      const install=(['pacman','yay','paru'].includes(name)&&args.includes('-S'))||(name==='apt'&&args[0]==='install')||(name==='dnf'&&args[0]==='install')||(name==='xbps-install'&&!args.some(arg=>arg.includes('u')&&arg.startsWith('-'))&&values.length)||(name==='emerge'&&values.length&&!args.includes('--search'))||(name==='apk'&&args[0]==='add')||(name==='zypper'&&args[0]==='install');
      const remove=(['pacman','yay','paru'].includes(name)&&args.includes('-R'))||(['apt','dnf','zypper'].includes(name)&&args[0]==='remove')||name==='xbps-remove'||(name==='apk'&&args[0]==='del');
      if(install||remove){if(!elevated&&!['yay','paru'].includes(name))fail('эта операция в примере использует sudo. реальный пароль здесь не запрашивается.');if(elevated&&['yay','paru'].includes(name))fail('yay и paru запускают обычным пользователем, без sudo.');if(!/^[A-Za-z0-9][A-Za-z0-9+_.@-]*$/.test(pkg))fail('укажи простое имя пакета, например firefox.');if(remove){this.packages.delete(pkg);return {output:pkg+' удалён [симуляция].\n'};}if(this.packages.size>=128&&!this.packages.has(pkg))fail('учебный лимит: 128 пакетов. сбрось песочницу.');this.packages.add(pkg);return {output:pkg+' установлен [симуляция: сеть и устройство не используются].\n'};}
      if(command.includes('-Q')||command==='list --installed'||command==='-l'||(name==='apk'&&command==='info'))return {output:[...this.packages].sort().join('\n')+'\n'};
      return {output:'учебная имитация: '+name+' '+command+'\nв реальной системе сверь параметры в генераторе команд. изменений на компьютере нет.\n'};
    }
    modeText(mode) {return [...mode].map(n=>{const value=Number(n);return (value&4?'r':'-')+(value&2?'w':'-')+(value&1?'x':'-');}).join('');}
    meets(goal) {
      switch(goal.type){
        case 'cwd':return this.cwd===goal.path;
        case 'exists':return this.fs.get(goal.path)?.kind===goal.kind;
        case 'copied':return this.fs.get(goal.path)?.text===this.fs.get(goal.original)?.text&&this.fs.has(goal.path)&&!this.fs.has('/home/guest/backup.txt');
        case 'output':return !!this.last?.ok&&this.last.output.includes(goal.text);
        case 'grep':return !!this.last?.ok&&this.last.canonical.startsWith('grep ')&&this.last.output.includes(goal.text)&&!this.last.output.includes('Windows');
        case 'mode':return this.fs.get(goal.path)?.mode===goal.mode;
        case 'pipeline':return this.last?.ok&&this.last.pipeline&&this.fs.get(goal.path)?.text.trim()===goal.text&&this.last.output.trim()===goal.text;
        case 'package':return this.packages.has(goal.name);
        case 'variable':return this.vars[goal.name]===goal.value&&this.last?.output.trim()===goal.value;
        case 'compiled':return this.fs.get(goal.path)?.text==='SIMULATED_EXECUTABLE'&&this.last?.output.includes(goal.text);
        default:return false;
      }
    }
    proof(practice) {
      if(practice.kind!=='terminal'||!this.meets(practice.goal))return null;
      for(const expected of practice.accepted){let index=0;for(const event of this.events){if(event.ok&&event.canonical===expected[index])index++;if(index===expected.length)return [...expected];}}
      return null;
    }
  }
  app.Simulator=Simulator;
  app.tokenize=tokenize;
  app.archAscii=['                   /\\','                  /  \\','                 /\\   \\','                /      \\','               /   ,,   \\','              /   |  |  -\\',"             /_-''    ''-_\\"].join('\n');
  app.renderChocolate=function(angle,width=44,height=16){
    const cy=Math.cos(angle),sy=Math.sin(angle),tilt=.25,ct=Math.cos(tilt),st=Math.sin(tilt);
    const inverse=(x,y,z)=>{const xx=cy*x-sy*z,zz=sy*x+cy*z;return[xx,ct*y+st*zz,-st*y+ct*zz];};
    const origin=inverse(0,0,6),light=inverse(-.45,.65,.8),planes=[[1,5/12,0,1.525],[-1,5/12,0,1.525],[0,1,0,.9],[0,-1,0,.9],[0,0,1,.29],[0,0,-1,.29]],ramp=' .:-=+*#%@';
    const scale=Math.min(width/8.8,height/4.8),rows=[];
    for(let row=0;row<height;row++){let line='';for(let col=0;col<width;col++){
      const dir=inverse((col-(width-1)/2)/(2*scale),((height-1)/2-row)/scale,-6);let enter=0,leave=Infinity,face=-1;
      for(let index=0;index<planes.length;index++){const p=planes[index],den=p[0]*dir[0]+p[1]*dir[1]+p[2]*dir[2],remaining=p[3]-p[0]*origin[0]-p[1]*origin[1]-p[2]*origin[2];if(Math.abs(den)<1e-9){if(remaining<0){leave=-1;break;}continue;}const t=remaining/den;if(den<0&&t>enter){enter=t;face=index;}else if(den>0)leave=Math.min(leave,t);}
      if(face<0||enter>leave||leave<=0){line+=' ';continue;}
      const p=planes[face];let shade=.22+.65*Math.max(0,(p[0]*light[0]+p[1]*light[1]+p[2]*light[2])/Math.hypot(...p.slice(0,3)));
      if(face>=4){const x=origin[0]+enter*dir[0],y=origin[1]+enter*dir[1],u=((x/(1.525-5*y/12)+1)/2*5)%1,v=((y+.9)/1.8*3)%1;if(Math.min(u,1-u,v,1-v)<.075)shade*=.3;}
      line+=ramp[Math.max(1,Math.min(9,Math.floor(shade*9)))];
    }rows.push(line);}return rows.join('\n');
  };
})(globalThis);
