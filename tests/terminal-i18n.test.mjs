import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
function setup(){const context=vm.createContext({});for(const file of ['data.js','v2/core.js','v2/academy-data.js','v2/playground-data.js','v2/simulator.js','v2/terminal-i18n.js','v2/english.js','v2/english-content.js','v2/english-academy.js'])vm.runInContext(read(file),context);const app=context.DanV2;app.i18n={language:'en',t:(text,lang='en')=>lang==='en'?(app.english[text]||text):text};return app;}
test('terminal diagnostics, help, packages and secrets have English displays and reversible Russian originals',()=>{
 const app=setup(),shell=new app.Simulator();
 const commands=['help','id','sudo id','fastfetch','neofetch','sl','fortune','sudo pacman -S firefox','sudo pacman -R firefox','sudo apt update','sudo makepkg -si','makepkg -si','cc hello.c -o hello','./hello','chocolate trapezoid','i use arch btw','not-found','cat missing','cd /etc','chmod nope notes.txt','cp notes.txt notes.txt','mkdir Documents','ls --invalid','grep','ps','cc','makepkg','echo "unclosed','ls |','echo ok; reboot','echo test >','sudo','echo '+ 'a'.repeat(501)];
 for(const command of commands){const result=shell.execute(command),snapshot=JSON.stringify(result);const english=app.terminalOutput(result,'en');assert.ok(!/[а-яё]/i.test(english),command+': '+english);assert.equal(app.terminalOutput(result,'ru'),result.output);assert.equal(JSON.stringify(result),snapshot,'localization mutated the simulation result');}
 assert.match(app.terminalOutput(shell.execute('help'),'en'),/learning shell/);
 assert.match(app.terminalOutput(shell.execute('cat missing'),'en'),/no such file/);
});
test('echo, variables, files, grep pipelines and Unicode paths are never translated as interface text',()=>{
 const app=setup(),shell=new app.Simulator(),text='пакет собран и установлен [симуляция].';
 const echo=shell.execute('echo "'+text+'"');assert.equal(app.terminalOutput(echo,'en'),text+'\n');assert.equal(echo.verbatim,true);
 shell.execute('echo "'+text+'" > заметки.txt');assert.equal(app.terminalOutput(shell.execute('cat заметки.txt'),'en'),text+'\n');assert.equal(app.terminalOutput(shell.execute('cat заметки.txt | grep пакет'),'en'),text+'\n');assert.match(app.terminalOutput(shell.execute('ls'),'en'),/заметки.txt/);
 shell.execute('name="команда не найдена"');assert.equal(app.terminalOutput(shell.execute('echo "$name"'),'en'),'команда не найдена\n');
 assert.equal(app.terminalOutput(shell.execute('cat неизвестный'),'en'),'no such file or directory: /home/guest/неизвестный. check pwd and ls.');
 assert.equal(app.terminalOutput(shell.execute('привет'),'en'),'привет: command not found in the simulator. type help.');
 assert.equal(app.terminalOutput(shell.execute('echo "<img src=x onerror=alert(1)>"'),'en'),'<img src=x onerror=alert(1)>\n');
});
test('localized Academy output retains every accepted practice proof and identical virtual filesystem',()=>{
 const app=setup();for(const lesson of app.lessons.filter(x=>x.practice.kind==='terminal'))for(const sequence of lesson.practice.accepted){
  const shell=new app.Simulator();shell.reset(lesson.practice.setup);
  for(const command of sequence){const result=shell.execute(command),before=JSON.stringify([...shell.fs]);app.terminalOutput(result,'en');app.terminalOutput(result,'ru');assert.equal(JSON.stringify([...shell.fs]),before);assert.equal(result.ok,true,lesson.id);}
  assert.ok(shell.proof(lesson.practice),lesson.id);
 }
});
