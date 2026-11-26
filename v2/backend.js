(function (root) {
  'use strict';
  const app=root.DanV2,config=root.DAN_CONFIG||{};
  const url=String(config.supabaseUrl||'').replace(/\/$/,''),key=String(config.supabasePublishableKey||'');
  const valid=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)&&/^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  const memory=new Map();
  let pending=null,generation=0,lastToken=null;
  const backend=app.backend={configured:valid,status:valid?'idle':'unconfigured',client:null,session:null,dashboard:null,recovery:false,error:''};
  const announce=()=>app.emit('dan:account',{status:backend.status,userId:backend.session?.user.id||null});
  const currentStorage=()=>{try{return app.store.read('dan-remember-session-v2',true)?localStorage:sessionStorage;}catch{return null;}};
  const authStorage={
    getItem(name){try{return currentStorage()?.getItem(name)??memory.get(name)??null;}catch{return memory.get(name)??null;}},
    setItem(name,value){memory.set(name,value);try{const active=currentStorage();active?.setItem(name,value);for(const other of [localStorage,sessionStorage])if(other!==active)other.removeItem(name);}catch{}},
    removeItem(name){memory.delete(name);try{localStorage.removeItem(name);sessionStorage.removeItem(name);}catch{}}
  };
  function message(error){
    const raw=String(error?.message||error||'');
    if(/Failed to fetch|NetworkError|Load failed|fetch failed/i.test(raw))return 'не удалось связаться с сервером. проверь интернет и попробуй ещё раз.';
    if(/Invalid login credentials/i.test(raw))return 'неверная почта или пароль.';
    if(/Email not confirmed/i.test(raw))return 'сначала подтверди электронную почту.';
    if(/rate limit|too many/i.test(raw))return 'слишком много запросов. подожди немного и повтори.';
    if(/does not exist|schema cache|function .*not found/i.test(raw))return 'серверная часть ещё не настроена или нуждается в обновлении.';
    return raw.slice(0,240)||'запрос не выполнен. попробуй ещё раз.';
  }
  backend.errorMessage=message;
  backend.baseURL=()=>new URL('./',document.baseURI).href;
  async function loadSDK(){
    if(root.supabase?.createClient)return;
    await new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=new URL('vendor/supabase-2.119.2.js',document.baseURI).href;
      script.onload=()=>root.supabase?.createClient?resolve():reject(new Error('не удалось загрузить модуль аккаунтов.'));
      script.onerror=()=>reject(new Error('не удалось загрузить модуль аккаунтов.'));document.head.append(script);
    });
  }
  async function handleSession(session,event){
    if(event==='PASSWORD_RECOVERY'){backend.recovery=true;app.emit('dan:recovery',{});}
    const token=session?.access_token||null;
    if(token===lastToken&&event!=='USER_UPDATED')return;
    lastToken=token;const requestGeneration=++generation;
    backend.session=session;backend.dashboard=null;announce();
    if(session?.user?.email_confirmed_at){
      try{const {data,error}=await backend.client.rpc('my_dashboard');if(error)throw error;if(requestGeneration!==generation)return;backend.dashboard=data;backend.status='ready';backend.error='';}
      catch(error){if(requestGeneration!==generation)return;backend.error=message(error);backend.status='error';}
    }
    announce();
  }
  backend.init=async()=>{
    if(!valid)return null;
    if(pending)return pending;
    pending=(async()=>{
      backend.status='connecting';announce();
      try{
        await loadSDK();
        backend.client=root.supabase.createClient(url,key,{auth:{persistSession:true,storage:authStorage,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
        backend.client.auth.onAuthStateChange((event,session)=>{setTimeout(()=>{void handleSession(session,event);},0);});
        const {data,error}=await backend.client.auth.getSession();if(error)throw error;
        backend.status='ready';await handleSession(data.session,'INITIAL_SESSION');announce();return backend.client;
      }catch(error){backend.status='error';backend.error=message(error);pending=null;announce();throw new Error(backend.error);}
    })();return pending;
  };
  backend.rpc=async(name,params={})=>{
    const client=await backend.init();if(!client)throw new Error('сервис аккаунтов и голосования пока не подключён. обучение доступно гостям.');
    const expectedUser=backend.session?.user.id||null;
    const {data,error}=await client.rpc(name,params);if(error)throw new Error(message(error));
    if(data&&data.ok===false)throw new Error(data.error||'сервер отклонил запрос.');
    if(data?.dashboard){if(!expectedUser||backend.session?.user.id!==expectedUser)throw new Error('сеанс изменился. повтори действие после входа.');backend.dashboard=data.dashboard;backend.error='';backend.status='ready';announce();}
    return data;
  };
  backend.refresh=async()=>{
    if(!backend.session)return null;const expected=backend.session.user.id;
    const data=await backend.rpc('my_dashboard');
    if(backend.session?.user.id===expected){backend.dashboard=data;announce();}return data;
  };
  backend.setRemember=value=>app.store.write('dan-remember-session-v2',!!value);
  backend.signIn=async(email,password)=>{const client=await backend.init();if(!client)throw new Error('вход пока не подключён.');const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw new Error(message(error));await handleSession(data.session,'SIGNED_IN');return data;};
  backend.signUp=async(email,password)=>{const client=await backend.init();if(!client)throw new Error('регистрация пока не подключена.');const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:backend.baseURL()}});if(error)throw new Error(message(error));return data;};
  backend.resetPassword=async email=>{const client=await backend.init();if(!client)throw new Error('восстановление пока не подключено.');const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:backend.baseURL()});if(error)throw new Error(message(error));};
  backend.resend=async email=>{const client=await backend.init();if(!client)throw new Error('сервис не подключён.');const {error}=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:backend.baseURL()}});if(error)throw new Error(message(error));};
  backend.updatePassword=async password=>{const client=await backend.init();if(!client)throw new Error('сервис не подключён.');const {error}=await client.auth.updateUser({password});if(error)throw new Error(message(error));backend.recovery=false;app.emit('dan:recovery-complete',{});};
  backend.oauth=async provider=>{if(!['google','github'].includes(provider)||!(config.oauthProviders||[]).includes(provider))throw new Error('этот способ входа пока не настроен.');const client=await backend.init();if(!client)throw new Error('сервис не подключён.');const {error}=await client.auth.signInWithOAuth({provider,options:{redirectTo:backend.baseURL()}});if(error)throw new Error(message(error));};
  backend.signOut=async(scope='local')=>{
    const client=await backend.init();if(client){const {error}=await client.auth.signOut({scope});if(error)throw new Error(message(error));}
    generation++;lastToken=null;backend.session=null;backend.dashboard=null;backend.recovery=false;announce();
  };
  backend.deleteAccount=async confirmation=>{
    const client=await backend.init();if(!client||!backend.session)throw new Error('сначала войди в аккаунт.');
    const {data,error}=await client.functions.invoke(config.deleteAccountFunction||'delete-account',{body:{confirmation}});
    if(error){let detail;try{detail=await error.context?.json();}catch{}throw new Error(detail?.error||'удаление не выполнено. проверь подключение и войди в аккаунт заново.');}
    if(!data?.ok)throw new Error(data?.error||'удаление не подтверждено сервером.');
    try{await client.auth.signOut({scope:'local'});}catch{}
    generation++;lastToken=null;backend.session=null;backend.dashboard=null;backend.recovery=false;announce();
    return data;
  };
})(globalThis);
