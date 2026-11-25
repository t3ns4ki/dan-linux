import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../v2/backend.js',import.meta.url),'utf8');
function setup(config={}){
  const emitted=[],calls=[],local=new Map(),session=new Map();let callback;
  const store=map=>({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});
  const user={id:'account-a',email_confirmed_at:'2026-11-25T00:00:00Z'},signed={user,access_token:'access-a'};
  const dashboard={profile:{id:user.id,xp:0,level:1},progress:[],achievements:[],votes:[]};
  const auth={onAuthStateChange(fn){callback=fn;},getSession:async()=>({data:{session:null}}),signInWithPassword:async args=>{calls.push(['signIn',args]);return {data:{session:signed}};},signUp:async args=>{calls.push(['signUp',args]);return {data:{session:null}};},resetPasswordForEmail:async(...args)=>{calls.push(['reset',...args]);return {};},resend:async args=>{calls.push(['resend',args]);return {};},updateUser:async args=>{calls.push(['update',args]);return {};},signInWithOAuth:async args=>{calls.push(['oauth',args]);return {};},signOut:async args=>{calls.push(['signOut',args]);return {};}};
  const client={auth,rpc:async(name,args)=>{calls.push(['rpc',name,args]);return {data:dashboard};},functions:{invoke:async(name,args)=>{calls.push(['function',name,args]);return {data:{ok:true}};}}};
  let clientOptions;
  const ctx=vm.createContext({URL,Map,Promise,setTimeout,localStorage:store(local),sessionStorage:store(session),document:{baseURI:'https://t3ns4ki.github.io/dan-linux/'},location:{href:'https://t3ns4ki.github.io/dan-linux/?code=test'},DAN_CONFIG:config,DanV2:{emit:(...args)=>emitted.push(args),store:{read:(_,fallback)=>fallback,write:()=>true}},supabase:{createClient:(url,key,options)=>{clientOptions=options;return client;}}});
  vm.runInContext(code,ctx);
  return {backend:ctx.DanV2.backend,calls,client,user,signed,dashboard,get options(){return clientOptions;},event:(event,value)=>callback(event,value)};
}
const configured={supabaseUrl:'https://configured-project.supabase.co',supabasePublishableKey:'sb_publishable_testOnly',oauthProviders:['github']};
test('missing config never loads SDK, invents results or permits authentication',async()=>{
  const {backend}=setup();assert.equal(backend.configured,false);assert.equal(await backend.init(),null);assert.equal(backend.session,null);
  await assert.rejects(()=>backend.signIn('x@example.invalid','password'));await assert.rejects(()=>backend.rpc('cast_vote'));
});
test('Auth adapter uses PKCE, exact Pages callback, real session identity and configured OAuth only',async()=>{
  const s=setup(configured),b=s.backend;await b.init();assert.equal(s.options.auth.flowType,'pkce');assert.equal(s.options.auth.persistSession,true);
  await b.signUp('user@example.invalid','test-password');await b.resetPassword('user@example.invalid');await b.resend('user@example.invalid');
  assert.equal(s.calls.find(c=>c[0]==='signUp')[1].options.emailRedirectTo,'https://t3ns4ki.github.io/dan-linux/');
  await assert.rejects(()=>b.oauth('google'));await assert.rejects(()=>b.oauth('invalid'));await b.oauth('github');
  await b.signIn('user@example.invalid','test-password');assert.equal(b.session.user.id,s.user.id);assert.equal(b.dashboard.profile.id,s.user.id);
  await b.signOut('global');assert.equal(b.session,null);assert.equal(b.dashboard,null);assert.equal(s.calls.at(-1)[1].scope,'global');
  await assert.rejects(()=>b.deleteAccount('DELETE MY ACCOUNT'));
});
test('an in-flight dashboard cannot restore data after logout',async()=>{
  const s=setup(configured);await s.backend.init();let finish;
  s.client.rpc=()=>new Promise(resolve=>finish=resolve);
  const signingIn=s.backend.signIn('user@example.invalid','test-password');await new Promise(resolve=>setTimeout(resolve,0));
  await s.backend.signOut();finish({data:s.dashboard});await signingIn;
  assert.equal(s.backend.session,null);assert.equal(s.backend.dashboard,null);
});
