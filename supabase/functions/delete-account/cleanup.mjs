/* Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
export async function deleteWithShareCleanup(admin,userId){
 let locked=false;
 try{
  const lock=await admin.rpc('share_account_deletion_lock',{p_user_id:userId,p_locked:true});
  if(lock.error&&lock.error.code!=='PGRST202')throw new Error('Deletion lock failed');
  locked=!lock.error;
  if(locked){
   const images=await admin.rpc('share_account_images',{p_user_id:userId});
   if(images.error||!Array.isArray(images.data))throw new Error('Image list unavailable');
   for(let index=0;index<images.data.length;index+=100){
    const paths=images.data.slice(index,index+100);if(paths.some(path=>!/^[-a-f0-9]{36}\.webp$/.test(path)))throw new Error('Invalid image path');
    const removed=await admin.storage.from('dan-share').remove(paths);if(removed.error)throw new Error('Image cleanup failed');
   }
  }
  const result=await admin.auth.admin.deleteUser(userId);if(result.error)throw new Error('Deletion failed');
 }catch(error){if(locked)await admin.rpc('share_account_deletion_lock',{p_user_id:userId,p_locked:false});throw error;}
}
