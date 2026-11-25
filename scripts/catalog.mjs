import fs from 'node:fs';
import vm from 'node:vm';
export function loadCatalog(){
  const context=vm.createContext({});
  for(const file of ['data.js','v2/core.js','v2/academy-data.js','v2/playground-data.js','v2/community-data.js','v2/commands.js','v2/simulator.js'])vm.runInContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),context,{filename:file});
  return context.DanV2;
}
export function catalogSQL(){
  const app=loadCatalog();
  const quote=value=>value==null?'null':"'"+String(value).replaceAll("'","''")+"'";
  const json=value=>quote(JSON.stringify(value))+'::jsonb';
  const rows=[];
  for(const d of app.votingCandidates)rows.push(`insert into public.distros(id,name,kind,family,logo) values(${[d.id,d.name,d.kind,d.family,d.logo].map(quote).join(',')});`);
  app.votingCategories.forEach((category,index)=>rows.push(`insert into public.voting_categories(id,name,kind,position) values(${[category.id,category.name,category.kind].map(quote).join(',')},${index});`));
  for(const a of app.achievements)rows.push(`insert into public.achievements(id,name,description,bonus,secret) values(${[a.id,a.name,a.description].map(quote).join(',')},${a.bonus},${!!a.secret});`);
  for(const l of app.lessons){
    rows.push(`insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values(${[l.id,l.course,l.title].map(quote).join(',')},${l.xp},${l.revision},${quote(l.prerequisite)});`);
    const accepted=l.practice.kind==='choice'?[l.practice.answer]:l.practice.accepted;
    rows.push(`insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values(${quote(l.id)},${json(accepted)},${quote(l.quiz.answer)});`);
  }
  return rows.join('\n');
}
if(process.argv[1]&&import.meta.url===new URL(process.argv[1],'file:').href){
  const file=new URL('../supabase/schema.sql',import.meta.url);
  const sql=fs.readFileSync(file,'utf8');
  fs.writeFileSync(file,sql.replace(/-- BEGIN GENERATED CATALOG[\s\S]*?-- END GENERATED CATALOG/,'-- BEGIN GENERATED CATALOG\n'+catalogSQL()+'\n-- END GENERATED CATALOG'));
  console.log('SQL catalog generated from the same 26 lessons and community data used by the client.');
}
