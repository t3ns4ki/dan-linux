/* Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
(function(root){
  'use strict';
  const app=root.DanV2;
  app.shareModel={
    kinds:{rice:'райс',question:'вопрос',discussion:'обсуждение'},
    statuses:{draft:'загрузка изображения',pending:'ждёт проверки',approved:'опубликовано',rejected:'отклонено',withdrawn:'снято с публикации'},
    validatePost({title,body,kind}){
      title=String(title||'').trim();body=String(body||'').trim();
      if(title.length<5||title.length>120)throw new Error('заголовок: от 5 до 120 символов.');
      if(body.length<2||body.length>6000)throw new Error('текст: от 2 до 6000 символов.');
      if(!['rice','question','discussion'].includes(kind))throw new Error('выбери тип записи.');
      if(/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(title+body))throw new Error('убери управляющие символы из текста.');
      return {title,body,kind};
    },
    validateComment(body){body=String(body||'').trim();if(body.length<2||body.length>3000)throw new Error('комментарий: от 2 до 3000 символов.');return body;},
    roleLabel(role){return role==='owner'?'owner':role==='admin'?'admin':'';},
    canReview(role,authorRole,requiresOwner=false){return role==='owner'||(role==='admin'&&!requiresOwner&&!authorRole);}
  };
})(globalThis);
