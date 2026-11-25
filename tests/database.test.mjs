import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {loadCatalog} from '../scripts/catalog.mjs';
const app=loadCatalog();
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',unconfirmed='33333333-3333-4333-8333-333333333333';
test('PostgreSQL migration, RPC validation, RLS, immutable XP, voting uniqueness, rate limits and deletion',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon nologin; create role authenticated nologin;
      create schema auth; grant usage on schema auth to anon,authenticated;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant execute on function auth.uid() to anon,authenticated;`);
    await db.exec(fs.readFileSync(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
    await db.exec(`insert into auth.users values('${a}','private-a@example.invalid',now()),('${b}','private-b@example.invalid',now()),('${unconfirmed}','unconfirmed@example.invalid',null);`);
    const asUser=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);await db.exec('set role '+(id?'authenticated':'anon'));};
    const rpc=async(name,values=[])=>{const placeholders=values.map((_,i)=>'$'+(i+1)).join(',');return (await db.query(`select public.${name}(${placeholders}) as result`,values)).rows[0].result;};
    await asUser(null);
    const results=(await db.query('select * from public.voting_results()')).rows;
    assert.ok(results.length>0);assert.ok(results.every(row=>Number(row.vote_count)===0));
    assert.equal((await db.query('select * from public.achievements')).rows.length,6);
    await assert.rejects(()=>db.query('select * from public.votes'));
    await assert.rejects(()=>rpc('my_dashboard'));
    await asUser(a);
    assert.equal((await db.query('select * from public.profiles')).rows.length,1);
    assert.equal((await db.query('select * from public.profiles')).rows[0].id,a);
    await assert.rejects(()=>db.query('update public.profiles set xp=999999'));
    await assert.rejects(()=>db.query(`insert into public.academy_progress(user_id,lesson_id,revision) values('${a}','linux',1)`));
    await assert.rejects(()=>db.query('select * from dan_private.lesson_answers'));
    const first=app.lessons[0];
    let response=await rpc('submit_lesson',[first.id,JSON.stringify('wrong'),'wrong',1]);assert.equal(response.ok,false);
    assert.equal((await rpc('my_dashboard')).profile.xp,0);
    response=await rpc('submit_lesson',[first.id,JSON.stringify(first.practice.answer),first.quiz.answer,1]);assert.equal(response.ok,true);assert.equal(response.dashboard.profile.xp,50);
    response=await rpc('submit_lesson',[first.id,JSON.stringify(first.practice.answer),first.quiz.answer,1]);assert.equal(response.dashboard.profile.xp,50);
    const late=app.lessons.find(l=>l.id==='opensource');response=await rpc('submit_lesson',[late.id,JSON.stringify(late.practice.answer),late.quiz.answer,1]);assert.equal(response.ok,false);
    for(const lesson of app.lessons.slice(1)){
      const answer=lesson.practice.kind==='choice'?lesson.practice.answer:lesson.practice.accepted[0];
      response=await rpc('submit_lesson',[lesson.id,JSON.stringify(answer),lesson.quiz.answer,lesson.revision]);assert.equal(response.ok,true,lesson.id+': '+JSON.stringify(response));
    }
    response=await rpc('claim_chocolate',['chocolate-trapezoid']);assert.equal(response.ok,true);
    const expected=app.progressSummary({completed:Object.fromEntries(app.lessons.map(l=>[l.id,{}])),secrets:['chocolate']});assert.equal(response.dashboard.profile.xp,expected.xp);
    const fullXP=response.dashboard.profile.xp;response=await rpc('claim_chocolate',['chocolate trapezoid']);assert.equal(response.dashboard.profile.xp,fullXP);
    response=await rpc('save_profile',["Dan's Linux",'arch','arch','gnome','hyprland',JSON.stringify({celebrate_achievements:true,show_xp:true})]);assert.equal(response.ok,true);assert.equal(response.dashboard.profile.is_private,true);
    response=await rpc('save_profile',['<img src=x>', 'arch',null,null,null,JSON.stringify({celebrate_achievements:true,show_xp:true})]);assert.equal(response.ok,false);
    response=await rpc('cast_vote',['favorite','arch']);assert.equal(response.ok,true);
    response=await rpc('cast_vote',['favorite','void']);assert.equal(response.ok,true);
    assert.equal((await db.query('select * from public.votes')).rows.length,1);
    assert.equal((await db.query('select * from public.votes')).rows[0].distro_id,'void');
    response=await rpc('cast_vote',['desktop','arch']);assert.equal(response.ok,false);
    await assert.rejects(()=>db.query(`insert into public.votes(user_id,category_id,distro_id) values('${a}','favorite','arch')`));
    assert.equal((await db.query('select * from public.vote_history')).rows.length,2);
    await asUser(b);assert.equal((await db.query('select * from public.vote_history')).rows.length,0);assert.equal((await db.query('select * from public.votes')).rows.length,0);assert.equal((await db.query('select * from public.academy_progress')).rows.length,0);assert.equal((await rpc('my_dashboard')).profile.xp,0);
    for(let i=0;i<8;i++){response=await rpc('cast_vote',['favorite',i%2?'arch':'void']);assert.equal(response.ok,true);}
    response=await rpc('cast_vote',['favorite','mint']);assert.equal(response.ok,false);assert.match(response.error,/лимит/);
    await asUser(unconfirmed);await assert.rejects(()=>rpc('cast_vote',['favorite','arch']));
    await asUser(a);response=await rpc('cast_vote',['favorite',null]);assert.equal(response.ok,true);assert.equal(response.dashboard.votes.length,0);
    await db.exec('reset role');await db.query('delete from auth.users where id=$1',[a]);
    for(const table of ['profiles','academy_progress','user_achievements','votes','vote_history']){const key=table==='profiles'?'id':'user_id';assert.equal((await db.query(`select count(*)::int as n from public.${table} where ${key}=$1`,[a])).rows[0].n,0);}
    assert.equal((await db.query('select count(*)::int as n from dan_private.api_limits where user_id=$1',[a])).rows[0].n,0);
    await asUser(a);await assert.rejects(()=>rpc('my_dashboard'));
    await asUser(null);const totals=await db.query('select * from public.voting_results()');assert.ok(!JSON.stringify(totals.rows).includes('example.invalid'));assert.ok(!JSON.stringify(totals.rows).includes(b));
  }finally{await db.close();}
});
