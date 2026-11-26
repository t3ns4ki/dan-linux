/* Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
(function(root){
 'use strict';const app=root.DanV2;let generation=0,owner=null,loading=false,lastRole=null;
 app.shareContext={role:null,pending_count:0,ready:false,error:''};
 app.roleBadge=role=>['owner','admin'].includes(role)?'<span class="share-role '+role+'">'+role+'</span>':'';
 app.refreshShareContext=async()=>{
  const uid=app.backend.session?.user.id||null;
  if(!uid||!app.backend.session.user.email_confirmed_at){generation++;owner=null;app.shareContext={role:null,pending_count:0,ready:false,error:''};app.emit('dan:share-role',{});return;}
  if(loading)return;loading=true;const current=++generation;
  try{const context=await app.backend.rpc('share_context');if(current!==generation||app.backend.session?.user.id!==uid)return;owner=uid;app.shareContext={...context,ready:true,error:''};}
  catch(error){if(current!==generation)return;app.shareContext={role:null,pending_count:0,ready:false,error:error.message};}
  finally{loading=false;if(current===generation)app.emit('dan:share-role',{});}
 };
 root.addEventListener('dan:account',()=>{const uid=app.backend.session?.user.id||null;if(uid!==owner)void app.refreshShareContext();});
 const timer=setInterval(()=>{if(!document.hidden&&app.backend.session)void app.refreshShareContext();},30000);
 root.addEventListener('pagehide',()=>clearInterval(timer));
 root.addEventListener('dan:share-role',()=>{const changed=lastRole!==app.shareContext.role;lastRole=app.shareContext.role;const dialog=document.querySelector('#platform-dialog');if(changed&&dialog?.open&&app.backend.dashboard)app.profile?.draw();});
})(globalThis);
