import test from 'node:test';
import assert from 'node:assert/strict';
import {createDeleteHandler} from '../supabase/functions/delete-account/handler.mjs';
test('account deletion authenticates the caller, confirms intent, checks recent login and ignores injected target IDs',async()=>{
  const origin='https://t3ns4ki.github.io',deleted=[];
  let user={id:'verified-user',email_confirmed_at:new Date().toISOString(),last_sign_in_at:new Date().toISOString()};
  const handle=createDeleteHandler({allowedOrigins:[origin],getUser:async token=>{if(token!=='valid.jwt.token')throw Error();return user;},deleteUser:async id=>deleted.push(id)});
  const request=(body,token='valid.jwt.token',from=origin)=>new Request('https://project.invalid/functions/v1/delete-account',{method:'POST',headers:{Origin:from,Authorization:'Bearer '+token},body:JSON.stringify(body)});
  assert.equal((await handle(request({confirmation:'DELETE MY ACCOUNT'},'invalid'))).status,401);
  assert.equal((await handle(request({confirmation:'DELETE MY ACCOUNT'},'valid.jwt.token','https://untrusted.invalid'))).status,403);
  assert.equal((await handle(request({confirmation:'no'}))).status,400);
  user.last_sign_in_at='2020-01-01T00:00:00Z';assert.equal((await handle(request({confirmation:'DELETE MY ACCOUNT'}))).status,401);
  user.last_sign_in_at=new Date().toISOString();
  assert.equal((await handle(request({confirmation:'DELETE MY ACCOUNT',user_id:'someone-else'}))).status,200);
  assert.deepEqual(deleted,['verified-user']);
});
