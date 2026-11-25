import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('all 3888 legacy distro quiz routes still return three distinct explained recommendations',()=>{
  const source=read('app.js'),context=vm.createContext({});
  vm.runInContext(read('data.js'),context);
  vm.runInContext(source.slice(source.indexOf('const questions='),source.indexOf('let answers='))+source.slice(source.indexOf('function recommend('),source.indexOf('function renderQuiz(')),context);
  const choices=vm.runInContext('questions.map(q=>q[1].map(a=>a[0]))',context);
  const routes=choices.reduce((rows,values)=>rows.flatMap(row=>values.map(value=>[...row,value])),[[]]);
  assert.equal(routes.length,3888);
  for(const answers of routes){context.input=answers;const result=vm.runInContext('recommend(input)',context);assert.equal(result.length,3);assert.equal(new Set(result.map(r=>r.d.id)).size,3);assert.ok(result.every(r=>r.reasons.length>0));if(answers[3]==='no')assert.ok(result.every(r=>r.d.level==='простая'));}
});
test('all original section IDs, scripts, local assets and license files are preserved',()=>{
  const baseline=JSON.parse(fs.readFileSync(new URL('./fixtures/legacy-contract.json',import.meta.url),'utf8')),after=read('index.html');
  const ids=text=>[...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  for(const id of baseline.ids)assert.ok(ids(after).includes(id),'missing original ID '+id);
  assert.equal(ids(after).length,new Set(ids(after)).size,'duplicate IDs');
  for(const match of after.matchAll(/(?:src|href)="([^"#]+)"/g)){
    const target=match[1];if(/^(https?:|data:|mailto:)/.test(target)||target.endsWith('.zip'))continue;
    assert.ok(fs.existsSync(new URL('../'+target,import.meta.url)),target);
  }
  assert.ok(after.includes('Content-Security-Policy'));assert.ok(read('v2/platform.css').includes('prefers-reduced-motion'));
  for(const [file,sha] of Object.entries(baseline.unchangedFiles))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+file,import.meta.url))).digest('hex'),sha,'modified original asset: '+file);
});
