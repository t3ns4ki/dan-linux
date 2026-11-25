-- DanLinux Share. Apply AFTER schema.sql. No owner is assigned automatically.
begin;
create table dan_private.share_roles(
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check(role in ('owner','admin')),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index share_one_owner on dan_private.share_roles(role) where role='owner';
create table dan_private.share_deleting(user_id uuid primary key references auth.users(id) on delete cascade);
create table public.share_posts(
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check(length(title) between 5 and 120),
  body text not null check(length(body) between 2 and 6000),
  kind text not null check(kind in ('rice','question','discussion')),
  status text not null default 'pending' check(status in ('draft','pending','approved','rejected','withdrawn')),
  image_path text unique,
  owner_review_required boolean not null default false,
  version integer not null default 1 check(version>0),
  reason text check(length(reason)<=500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_id uuid references auth.users(id) on delete set null
);
create index share_feed_date on public.share_posts(created_at desc,id) where status='approved';
create index share_posts_author on public.share_posts(author_id,created_at desc);
create index share_posts_queue on public.share_posts(created_at) where status='pending';
create table public.share_comments(
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.share_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check(length(body) between 2 and 3000),
  status text not null default 'pending' check(status in ('pending','approved','rejected','withdrawn')),
  owner_review_required boolean not null default false,
  version integer not null default 1 check(version>0),
  reason text check(length(reason)<=500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_id uuid references auth.users(id) on delete set null
);
create index share_comments_thread on public.share_comments(post_id,created_at) where status='approved';
create index share_comments_author on public.share_comments(author_id,created_at desc);
create index share_comments_queue on public.share_comments(created_at) where status='pending';
create table dan_private.share_audit(
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  target_id uuid not null,
  kind text not null,
  action text not null,
  created_at timestamptz not null default now()
);
alter table dan_private.share_roles enable row level security;
alter table dan_private.share_deleting enable row level security;
alter table dan_private.share_audit enable row level security;
alter table public.share_posts enable row level security;
alter table public.share_comments enable row level security;
revoke all on dan_private.share_roles,dan_private.share_deleting,dan_private.share_audit,public.share_posts,public.share_comments from public,anon,authenticated;
create policy share_own_posts on public.share_posts for select to authenticated using(author_id=(select auth.uid()));
create policy share_own_comments on public.share_comments for select to authenticated using(author_id=(select auth.uid()));
grant select on public.share_posts,public.share_comments to authenticated;

create function dan_private.share_role(uid uuid) returns text language sql stable security definer set search_path='' as $$
  select r.role from dan_private.share_roles r join auth.users u on u.id=r.user_id where r.user_id=uid and u.email_confirmed_at is not null
$$;
create function dan_private.share_user() returns uuid language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=dan_private.require_user();
begin
  if exists(select 1 from dan_private.share_deleting where user_id=uid) then raise exception 'аккаунт удаляется' using errcode='42501'; end if;
  return uid;
end; $$;
create function dan_private.share_reviewable(author uuid,owner_required boolean) returns boolean language sql stable security definer set search_path='' as $$
  select coalesce(dan_private.share_role(auth.uid())='owner' or (
    dan_private.share_role(auth.uid())='admin' and not owner_required
    and dan_private.share_role(author) is null and author<>auth.uid()),false)
$$;
create function dan_private.share_post_json(p public.share_posts,private_info boolean default false) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',p.id,'title',p.title,'body',p.body,'kind',p.kind,'image_path',p.image_path,
 'created_at',p.created_at,'updated_at',p.updated_at,'author_name',u.nickname,'avatar_id',u.avatar_id,
 'author_role',dan_private.share_role(p.author_id),'is_mine',coalesce(p.author_id=auth.uid(),false),
 'comment_count',(select count(*) from public.share_comments c where c.post_id=p.id and c.status='approved'))
 ||case when private_info then jsonb_build_object('status',p.status,'reason',p.reason,'version',p.version,
 'can_review',dan_private.share_reviewable(p.author_id,p.owner_review_required)) else '{}'::jsonb end
 from public.profiles u where u.id=p.author_id
$$;
create function dan_private.share_comment_json(c public.share_comments,private_info boolean default false) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',c.id,'post_id',c.post_id,'body',c.body,'created_at',c.created_at,
 'author_name',u.nickname,'avatar_id',u.avatar_id,'author_role',dan_private.share_role(c.author_id),'is_mine',coalesce(c.author_id=auth.uid(),false))
 ||case when private_info then jsonb_build_object('status',c.status,'reason',c.reason,'version',c.version,
 'can_review',dan_private.share_reviewable(c.author_id,c.owner_review_required)) else '{}'::jsonb end
 from public.profiles u where u.id=c.author_id
$$;
create function public.share_context() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=dan_private.share_user(); r text:=dan_private.share_role(uid); n integer:=0;
begin
 if r in ('owner','admin') then
  select (select count(*) from public.share_posts p where p.status='pending' and dan_private.share_reviewable(p.author_id,p.owner_review_required))+
   (select count(*) from public.share_comments c where c.status='pending' and dan_private.share_reviewable(c.author_id,c.owner_review_required)) into n;
 end if;
 return jsonb_build_object('role',r,'pending_count',n,'user_id',uid);
end; $$;
create function public.share_feed(p_kind text default 'all',p_query text default '',p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare rows jsonb; more boolean;
begin
 if p_kind is null or p_kind not in ('all','rice','question','discussion') or p_query is null or length(p_query)>80 or p_offset is null or p_offset<0 or p_offset>5000 then raise exception 'неверные параметры поиска'; end if;
 select coalesce(jsonb_agg(dan_private.share_post_json(p)),'[]'::jsonb) into rows from
  (select * from public.share_posts where status='approved' and (p_kind='all' or kind=p_kind)
   and (p_query='' or position(lower(p_query) in lower(title||' '||body))>0) order by created_at desc,id limit 20 offset p_offset) p;
 select exists(select 1 from public.share_posts where status='approved' and (p_kind='all' or kind=p_kind)
   and (p_query='' or position(lower(p_query) in lower(title||' '||body))>0) offset p_offset+20 limit 1) into more;
 return jsonb_build_object('posts',rows,'has_more',more);
end; $$;
create function public.share_thread(p_post_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p public.share_posts; comments_json jsonb;
begin
 select * into p from public.share_posts where id=p_post_id and status='approved';
 if not found then raise exception 'запись не опубликована или снята с публикации'; end if;
 select coalesce(jsonb_agg(dan_private.share_comment_json(c,dan_private.share_reviewable(c.author_id,c.owner_review_required)) order by c.created_at),'[]'::jsonb) into comments_json
  from (select * from public.share_comments where post_id=p_post_id and status='approved' order by created_at limit 200) c;
 return jsonb_build_object('post',dan_private.share_post_json(p,dan_private.share_reviewable(p.author_id,p.owner_review_required)),'comments',comments_json);
end; $$;
create function public.share_submit_post(p_title text,p_body text,p_kind text,p_has_image boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=dan_private.share_user();r text:=dan_private.share_role(uid);p public.share_posts; pid uuid:=gen_random_uuid();
begin
 perform 1 from public.profiles where id=uid for update;
 if not dan_private.consume_budget(uid,'share_posts',2) or (select count(*) from public.share_posts where author_id=uid and created_at>now()-interval '1 day')>=20 then
  return jsonb_build_object('ok',false,'error','лимит публикаций: подожди перед следующей записью.'); end if;
 if (select count(*) from public.share_posts where author_id=uid and status in ('draft','pending'))>=8 then return jsonb_build_object('ok',false,'error','у тебя уже 8 записей в очереди. дождись проверки или сними лишние.'); end if;
 if p_title is null or p_body is null or length(btrim(p_title)) not between 5 and 120 or length(btrim(p_body)) not between 2 and 6000
  or p_kind is null or p_kind not in ('rice','question','discussion') or (p_title||p_body) ~ '[\x01-\x08\x0b\x0c\x0e-\x1f]' then
  return jsonb_build_object('ok',false,'error','проверь заголовок, текст и тип записи.'); end if;
 insert into public.share_posts(id,author_id,title,body,kind,image_path,status,owner_review_required,reviewed_at,reviewer_id)
 values(pid,uid,btrim(p_title),btrim(p_body),p_kind,case when p_has_image then pid::text||'.webp' else null end,
 case when p_has_image then 'draft' when r='owner' then 'approved' else 'pending' end,coalesce(r='admin',false),case when not p_has_image and r='owner' then now() end,case when not p_has_image and r='owner' then uid end)
 returning * into p;
 if p.status='approved' then insert into dan_private.share_audit(author_id,actor_id,target_id,kind,action) values(uid,uid,p.id,'post','owner_publish'); end if;
 return jsonb_build_object('ok',true,'post',dan_private.share_post_json(p,true));
end; $$;
create function public.share_finish_upload(p_post_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=dan_private.share_user();r text:=dan_private.share_role(uid);p public.share_posts;
begin
 select * into p from public.share_posts where id=p_post_id and author_id=uid for update;
 if not found then raise exception 'запись не найдена' using errcode='42501'; end if;
 if p.status<>'draft' then return jsonb_build_object('ok',true,'post',dan_private.share_post_json(p,true)); end if;
 if not exists(select 1 from storage.objects where bucket_id='dan-share' and name=p.image_path and metadata->>'mimetype'='image/webp' and (metadata->>'size')::bigint between 1 and 4194304) then
  return jsonb_build_object('ok',false,'error','изображение ещё не загружено или не соответствует ограничениям.'); end if;
 update public.share_posts set status=case when r='owner' then 'approved' else 'pending' end,
 owner_review_required=coalesce(owner_review_required,false) or coalesce(r='admin',false),updated_at=now(),reviewed_at=case when r='owner' then now() end,reviewer_id=case when r='owner' then uid end where id=p.id returning * into p;
 if r='owner' then insert into dan_private.share_audit(author_id,actor_id,target_id,kind,action) values(uid,uid,p.id,'post','owner_publish'); end if;
 return jsonb_build_object('ok',true,'post',dan_private.share_post_json(p,true));
end; $$;
create function public.share_submit_comment(p_post_id uuid,p_body text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=dan_private.share_user();r text:=dan_private.share_role(uid);c public.share_comments;
begin
 perform 1 from public.profiles where id=uid for update;
 if not dan_private.consume_budget(uid,'share_comments',5) or (select count(*) from public.share_comments where author_id=uid and created_at>now()-interval '1 day')>=100 then return jsonb_build_object('ok',false,'error','слишком много комментариев. подожди немного.'); end if;
 if (select count(*) from public.share_comments where author_id=uid and status='pending')>=15 then return jsonb_build_object('ok',false,'error','дождись проверки предыдущих комментариев.'); end if;
 if p_body is null or length(btrim(p_body)) not between 2 and 3000 then return jsonb_build_object('ok',false,'error','комментарий: от 2 до 3000 символов.'); end if;
 if not exists(select 1 from public.share_posts where id=p_post_id and status='approved') then raise exception 'сначала выбери опубликованную запись'; end if;
 insert into public.share_comments(post_id,author_id,body,status,owner_review_required,reviewed_at,reviewer_id)
 values(p_post_id,uid,btrim(p_body),case when r='owner' then 'approved' else 'pending' end,coalesce(r='admin',false),case when r='owner' then now() end,case when r='owner' then uid end) returning * into c;
 if r='owner' then insert into dan_private.share_audit(author_id,actor_id,target_id,kind,action) values(uid,uid,c.id,'comment','owner_publish'); end if;
 return jsonb_build_object('ok',true,'comment',dan_private.share_comment_json(c,true));
end; $$;
create function public.share_my_content() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=dan_private.share_user();ps jsonb;cs jsonb;
begin
 select coalesce(jsonb_agg(dan_private.share_post_json(p,true) order by p.created_at desc),'[]'::jsonb) into ps from (select * from public.share_posts where author_id=uid order by created_at desc limit 100)p;
 select coalesce(jsonb_agg(dan_private.share_comment_json(c,true) order by c.created_at desc),'[]'::jsonb) into cs from (select * from public.share_comments where author_id=uid order by created_at desc limit 100)c;
 return jsonb_build_object('posts',ps,'comments',cs);
end; $$;
create function public.share_withdraw(p_kind text,p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=dan_private.share_user();n integer;
begin
 if p_kind='post' then update public.share_posts set status='withdrawn',updated_at=now(),version=version+1 where id=p_id and author_id=uid;get diagnostics n=row_count;
 elsif p_kind='comment' then update public.share_comments set status='withdrawn',updated_at=now(),version=version+1 where id=p_id and author_id=uid;get diagnostics n=row_count;
 else raise exception 'неверный тип записи'; end if;
 if n<>1 then raise exception 'можно снять только собственную запись' using errcode='42501'; end if;
 return jsonb_build_object('ok',true);
end; $$;
create function public.share_moderation_queue(p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=dan_private.share_user();r text:=dan_private.share_role(uid);ps jsonb;cs jsonb;
begin
 if r is null or r not in ('owner','admin') then raise exception 'нет прав модерации' using errcode='42501'; end if;
 if p_offset is null or p_offset<0 or p_offset>10000 then raise exception 'неверная страница очереди'; end if;
 select coalesce(jsonb_agg(dan_private.share_post_json(p,true) order by p.created_at),'[]'::jsonb) into ps from
 (select * from public.share_posts where status='pending' and dan_private.share_reviewable(author_id,owner_review_required) order by created_at limit 25 offset p_offset)p;
 select coalesce(jsonb_agg(dan_private.share_comment_json(c,true)||jsonb_build_object('parent_title',p.title,'parent_body',p.body) order by c.created_at),'[]'::jsonb) into cs
 from (select * from public.share_comments where status='pending' and dan_private.share_reviewable(author_id,owner_review_required) order by created_at limit 25 offset p_offset)c join public.share_posts p on p.id=c.post_id;
 return jsonb_build_object('posts',ps,'comments',cs,'has_more',
 (select count(*) from public.share_posts where status='pending' and dan_private.share_reviewable(author_id,owner_review_required))>p_offset+25 or
 (select count(*) from public.share_comments where status='pending' and dan_private.share_reviewable(author_id,owner_review_required))>p_offset+25);
end; $$;
create function public.share_review(p_kind text,p_id uuid,p_version integer,p_approve boolean,p_reason text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=dan_private.share_user();author uuid;needed boolean;v integer;st text;
begin
 if p_kind='post' then select author_id,owner_review_required,version,status into author,needed,v,st from public.share_posts where id=p_id for update;
 elsif p_kind='comment' then select author_id,owner_review_required,version,status into author,needed,v,st from public.share_comments where id=p_id for update;
 else raise exception 'неверный тип записи'; end if;
 if author is null or not dan_private.share_reviewable(author,needed) then raise exception 'эту запись может проверять только владелец или назначенный админ' using errcode='42501'; end if;
 if v is distinct from p_version or st not in ('pending','approved') then return jsonb_build_object('ok',false,'error','запись уже изменилась. обнови очередь.'); end if;
 if p_approve is null or (not p_approve and (p_reason is null or length(btrim(p_reason)) not between 3 and 500)) then return jsonb_build_object('ok',false,'error','для отклонения укажи причину от 3 до 500 символов.'); end if;
 if not dan_private.consume_budget(uid,'share_reviews',60) then return jsonb_build_object('ok',false,'error','подожди минуту перед следующей проверкой.'); end if;
 if p_kind='post' then update public.share_posts set status=case when p_approve then 'approved' else 'rejected' end,reason=case when p_approve then null else btrim(p_reason) end,reviewed_at=now(),reviewer_id=uid,version=version+1,updated_at=now() where id=p_id;
 else
  if p_approve and not exists(select 1 from public.share_comments c join public.share_posts p on p.id=c.post_id where c.id=p_id and p.status='approved') then return jsonb_build_object('ok',false,'error','родительская запись сейчас не опубликована.'); end if;
  update public.share_comments set status=case when p_approve then 'approved' else 'rejected' end,reason=case when p_approve then null else btrim(p_reason) end,reviewed_at=now(),reviewer_id=uid,version=version+1,updated_at=now() where id=p_id;
 end if;
 insert into dan_private.share_audit(author_id,actor_id,target_id,kind,action) values(author,uid,p_id,p_kind,case when p_approve then 'approve' else 'reject' end);
 return jsonb_build_object('ok',true);
end; $$;
create function public.share_find_users(p_nickname text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=dan_private.share_user();rows jsonb;
begin
 if dan_private.share_role(uid) is distinct from 'owner' then raise exception 'только owner назначает админов' using errcode='42501'; end if;
 if p_nickname is null or length(btrim(p_nickname)) not between 2 and 24 then raise exception 'введи точный никнейм'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'nickname',p.nickname,'avatar_id',p.avatar_id,'role',dan_private.share_role(p.id))),'[]'::jsonb) into rows
 from (select p.* from public.profiles p join auth.users u on u.id=p.id where lower(p.nickname)=lower(btrim(p_nickname)) and u.email_confirmed_at is not null limit 5)p;
 return rows;
end; $$;
create function public.share_admins() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=dan_private.share_user();rows jsonb;
begin
 if dan_private.share_role(uid) is distinct from 'owner' then raise exception 'доступно только владельцу' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'nickname',p.nickname,'avatar_id',p.avatar_id) order by r.created_at),'[]'::jsonb) into rows from dan_private.share_roles r join public.profiles p on p.id=r.user_id where r.role='admin';return rows;
end; $$;
create function public.share_set_admin(p_user_id uuid,p_enabled boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=dan_private.share_user();
begin
 if dan_private.share_role(uid) is distinct from 'owner' then raise exception 'только owner назначает админов' using errcode='42501'; end if;
 if p_user_id is null or p_user_id=uid or dan_private.share_role(p_user_id)='owner' or p_enabled is null then raise exception 'владельца нельзя изменить через эту кнопку'; end if;
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'нужен существующий аккаунт с подтверждённой почтой'; end if;
 if p_enabled then insert into dan_private.share_roles(user_id,role,granted_by) values(p_user_id,'admin',uid) on conflict(user_id) do update set role='admin',granted_by=uid;
 else delete from dan_private.share_roles where user_id=p_user_id and role='admin'; end if;
 return jsonb_build_object('ok',true);
end; $$;
-- Storage helpers expose only a yes/no permission result, never private content.
create function public.share_image_access(p_name text,p_operation text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare p public.share_posts;uid uuid:=auth.uid();
begin
 select * into p from public.share_posts where image_path=p_name;
 if not found then return false; end if;
 if p_operation='read' then return p.status='approved' or coalesce(p.author_id=uid,false) or (p.status='pending' and dan_private.share_reviewable(p.author_id,p.owner_review_required)); end if;
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null) or exists(select 1 from dan_private.share_deleting where user_id=uid) then return false; end if;
 if p_operation='insert' then return p.author_id=uid and p.status='draft' and p.created_at>now()-interval '30 minutes'; end if;
 if p_operation='delete' then return p.author_id=uid and p.status in ('draft','withdrawn'); end if;
 return false;
end; $$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('dan-share','dan-share',false,4194304,array['image/webp']);
create policy dan_share_images_read on storage.objects for select to anon,authenticated using(bucket_id='dan-share' and public.share_image_access(name,'read'));
create policy dan_share_images_insert on storage.objects for insert to authenticated with check(bucket_id='dan-share' and public.share_image_access(name,'insert'));
create policy dan_share_images_delete on storage.objects for delete to authenticated using(bucket_id='dan-share' and public.share_image_access(name,'delete'));
-- No UPDATE policy: approved image objects cannot be swapped after moderation.
create function public.share_account_deletion_lock(p_user_id uuid,p_locked boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_locked then insert into dan_private.share_deleting(user_id) values(p_user_id) on conflict do nothing;
 else delete from dan_private.share_deleting where user_id=p_user_id; end if;
end; $$;
create function public.share_account_images(p_user_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(image_path),'[]'::jsonb) from public.share_posts where author_id=p_user_id and image_path is not null
$$;
revoke all on all functions in schema dan_private from public,anon,authenticated;
revoke all on function public.share_context(),public.share_feed(text,text,integer),public.share_thread(uuid),
 public.share_submit_post(text,text,text,boolean),public.share_finish_upload(uuid),public.share_submit_comment(uuid,text),public.share_my_content(),public.share_withdraw(text,uuid),
 public.share_moderation_queue(integer),public.share_review(text,uuid,integer,boolean,text),public.share_find_users(text),public.share_admins(),public.share_set_admin(uuid,boolean),
 public.share_image_access(text,text),public.share_account_deletion_lock(uuid,boolean),public.share_account_images(uuid) from public,anon,authenticated;
grant execute on function public.share_feed(text,text,integer),public.share_thread(uuid),public.share_image_access(text,text) to anon,authenticated;
grant execute on function public.share_context(),public.share_submit_post(text,text,text,boolean),public.share_finish_upload(uuid),public.share_submit_comment(uuid,text),public.share_my_content(),public.share_withdraw(text,uuid),
 public.share_moderation_queue(integer),public.share_review(text,uuid,integer,boolean,text),public.share_find_users(text),public.share_admins(),public.share_set_admin(uuid,boolean) to authenticated;
grant execute on function public.share_account_deletion_lock(uuid,boolean),public.share_account_images(uuid) to service_role;
commit;
