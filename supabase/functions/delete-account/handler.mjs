// Dependency injection keeps authorization testable without exposing any secret.
export function createDeleteHandler({getUser, deleteUser, allowedOrigins, now=()=>Date.now()}) {
  return async function handle(request) {
    const origin=request.headers.get('origin')||'';
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
    const respond=(status,body)=>new Response(JSON.stringify(body),{status,headers});
    if(!allowedOrigins.includes(origin))return respond(403,{error:'источник запроса не разрешён.'});
    headers['Access-Control-Allow-Origin']=origin;
    headers['Access-Control-Allow-Headers']='authorization, apikey, content-type, x-client-info';
    headers['Access-Control-Allow-Methods']='POST, OPTIONS';
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return respond(405,{error:'нужен POST-запрос.'});
    const authorization=request.headers.get('authorization')||'';
    if(!/^Bearer [A-Za-z0-9_.-]+$/.test(authorization))return respond(401,{error:'войдите в аккаунт снова.'});
    let body;
    try{const text=await request.text();if(text.length>1024)return respond(413,{error:'запрос слишком большой.'});body=JSON.parse(text);}catch{return respond(400,{error:'неверный формат запроса.'});}
    if(body?.confirmation!=='DELETE MY ACCOUNT')return respond(400,{error:'подтверди удаление аккаунта.'});
    let user;
    try{user=await getUser(authorization.slice(7));}catch{return respond(401,{error:'войдите в аккаунт снова.'});}
    if(!user?.id||!user.email_confirmed_at)return respond(401,{error:'подтверди почту и войди в аккаунт.'});
    const signedIn=Date.parse(user.last_sign_in_at||'');
    if(!Number.isFinite(signedIn)||now()-signedIn>15*60*1000)return respond(401,{error:'для удаления аккаунта выйди и войди снова; затем повтори удаление.'});
    try{
      // The target is ALWAYS the verified caller. Ignore all user IDs in the body.
      await deleteUser(user.id);
      return respond(200,{ok:true});
    }catch{return respond(500,{error:'не удалось удалить аккаунт. попробуй позже.'});}
  };
}
