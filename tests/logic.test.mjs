import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../scripts/catalog.mjs';
const app=loadCatalog();
test('all 26 lessons have separate practice and explained quizzes',()=>{
  assert.equal(app.lessons.length,26);assert.equal(new Set(app.lessons.map(l=>l.id)).size,26);
  for(const lesson of app.lessons){assert.ok(lesson.body.length>=2);assert.ok(lesson.examples.length);assert.ok(lesson.quiz.options.some(o=>o.id===lesson.quiz.answer));assert.ok(lesson.quiz.options.every(o=>o.why));assert.equal(lesson.xp,30);}
});
test('every accepted terminal exercise works against the shared real simulation engine',()=>{
  for(const lesson of app.lessons.filter(l=>l.practice.kind==='terminal'))for(const commands of lesson.practice.accepted){
    const shell=new app.Simulator();shell.reset(lesson.practice.setup);
    for(const command of commands){const result=shell.execute(command);assert.equal(result.ok,true,lesson.id+': '+command+' / '+result.output);}
    assert.ok(shell.proof(lesson.practice),lesson.id);assert.equal(JSON.stringify(shell.proof(lesson.practice)),JSON.stringify(commands));
  }
});
test('safe shell handles pipes, quoting, append, errors, limits and root makepkg refusal',()=>{
  const shell=new app.Simulator();
  assert.equal(shell.execute('echo "hello world" > output.txt').ok,true);
  assert.equal(shell.execute('echo Linux >> output.txt').ok,true);
  assert.equal(shell.execute('cat output.txt | grep Linux').output,'Linux\n');
  shell.execute('name=Dan');assert.equal(shell.execute('echo "$name"').output,'Dan\n');assert.equal(shell.execute("echo '$name'").output,'$name\n');
  assert.equal(shell.execute('cd nonexistent').ok,false);assert.equal(shell.cwd,'/home/guest');
  assert.equal(shell.execute('cat /etc/passwd').ok,false);
  assert.equal(shell.execute('sudo makepkg -si').ok,false);
  assert.equal(shell.execute('echo ok; touch attacked').ok,false);assert.equal(shell.fs.has('/home/guest/attacked'),false);
  const rendered=app.renderChocolate(.2);assert.notEqual(rendered,app.renderChocolate(1.4));assert.ok([...rendered].every(c=>c.charCodeAt(0)<128));
  assert.equal(shell.execute('chocolate trapezoid').special,'chocolate');assert.equal(shell.execute('chocolate-trapezoid').special,'chocolate');
});
test('all package manager combinations generate explained commands without accepting injection',()=>{
  let combinations=0;
  for(const [distro,,family] of app.commandDistros)for(const [action] of app.commandActions){
    const helpers=family==='pacman'?['official','yay','paru']:['official'];
    for(const aur of helpers)for(const suse of distro==='opensuse'?['leap','tumbleweed']:['tumbleweed']){
      const result=app.generateCommand({distro,action,aur,suse,packageName:family==='emerge'?'www-client/firefox':'firefox'});
      assert.ok(result.text);assert.ok(result.arguments.length);assert.ok(result.arguments.every(item=>item.description));assert.ok(result.source.startsWith('https://'));combinations++;
    }
  }
  assert.equal(app.generateCommand({distro:'arch',action:'install',packageName:'firefox'}).text,'sudo pacman -S firefox');
  assert.equal(app.generateCommand({distro:'ubuntu',action:'install',packageName:'firefox'}).text,'sudo apt install firefox');
  assert.equal(app.generateCommand({distro:'fedora',action:'install',packageName:'firefox'}).text,'sudo dnf install firefox');
  assert.match(app.generateCommand({distro:'opensuse',action:'update',suse:'tumbleweed'}).text,/zypper dup$/);
  assert.match(app.generateCommand({distro:'opensuse',action:'update',suse:'leap'}).text,/zypper update$/);
  for(const packageName of ['--root','firefox;reboot','$(id)','a\nb','a b','x|cat','`id`'])assert.throws(()=>app.generateCommand({distro:'arch',action:'install',packageName}));
  assert.throws(()=>app.generateCommand({distro:'ubuntu',action:'install',packageName:'firefox',aur:'yay'}));
  console.log('checked command combinations:',combinations);
});
test('guest XP is derived from bounded known completions and unique achievements',()=>{
  const state={completed:{linux:{},madeup:{},kernel:{}},secrets:['chocolate','chocolate'],xp:999999};
  const summary=app.progressSummary(state);assert.equal(summary.completed.length,2);assert.equal(summary.xp,100);assert.equal(summary.level,1);
});
