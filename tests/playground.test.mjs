import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadCatalog} from '../scripts/catalog.mjs';
const app = loadCatalog();
test('all 512 permission modes agree with ls output in the shared simulator', () => {
  for (let value = 0; value < 512; value++) {
    const mode = value.toString(8).padStart(3, '0');
    const shell = new app.Simulator();
    assert.equal(shell.execute(app.permissionCommand(mode, 'notes.txt')).ok, true);
    const symbolic = app.permissionMode(mode).map(group => group.symbolic).join('');
    assert.ok(shell.execute('ls -l notes.txt').output.startsWith('-' + symbolic), mode);
  }
  for (const mode of ['7777','89x','7;1','44','']) assert.throws(() => app.permissionMode(mode));
  for (const filename of ['../notes','--help','x;reboot','a b','$(id)','<img>','a\nb','']) assert.throws(() => app.permissionCommand('644',filename));
});
test('daily lessons repeat predictably across the full 26-day rotation and validate dates', () => {
  const lessons = [];
  for (let i = 0; i < 26; i++) {
    const day = new Date(Date.UTC(2026,10,1+i)).toISOString().slice(0,10);
    const lesson = app.dailyLesson(day); lessons.push(lesson.id);
    assert.equal(app.dailyLesson(day).id,lesson.id);
  }
  assert.equal(new Set(lessons).size,26);
  for (const day of ['2026-02-31','not-a-date','2026-1-01']) assert.throws(() => app.dailyLesson(day));
});
test('new terminal commands are bounded, leave virtual files unchanged and do not grant XP', () => {
  const shell = new app.Simulator(), before = JSON.stringify([...shell.fs]);
  assert.equal(shell.execute('sl').special,'train');
  assert.equal(shell.execute('sl extra').ok,false);
  for (let i=0;i<30;i++) assert.ok(app.fortunes.includes(shell.execute('fortune').output.trim()));
  assert.equal(JSON.stringify([...shell.fs]),before);
  assert.equal(app.progressSummary({completed:{},secrets:[]}).xp,0);
  assert.ok([...app.trainArt].every(char=>char.charCodeAt(0)<128));
});
test('tab title is exact and integration remains idempotent', async () => {
  const {execFileSync} = await import('node:child_process');
  const path = new URL('../index.html',import.meta.url), before = fs.readFileSync(path,'utf8');
  assert.equal(before.match(/<title>(.*?)<\/title>/)[1],'OpenSource and Linux');
  execFileSync(process.execPath,['scripts/integrate.mjs'],{cwd:new URL('..',import.meta.url)});
  assert.equal(fs.readFileSync(path,'utf8'),before);
});
