-- Keep privileged implementations outside the exposed API schema.
-- Public RPCs are invoker wrappers; implementations retain their explicit grants
-- and the same auth.uid()/role validation. No data or role assignment is changed.
begin;
do $boundary$
declare f record; arguments text; body text; impl text; allow_anon boolean;allow_user boolean;allow_service boolean;
begin
 for f in
  select p.oid,p.proname,p.pronargs,pg_catalog.pg_get_function_identity_arguments(p.oid) identity_args,
   pg_catalog.pg_get_function_arguments(p.oid) declaration_args,pg_catalog.pg_get_function_result(p.oid) result_type
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef and p.proname=any(array[
   'my_dashboard','submit_lesson','claim_chocolate','save_profile','cast_vote','voting_results',
   'share_context','share_feed','share_thread','share_submit_post','share_finish_upload','share_submit_comment',
   'share_my_content','share_withdraw','share_moderation_queue','share_review','share_find_users','share_admins',
   'share_set_admin','share_image_access','share_account_deletion_lock','share_account_images'])
 loop
  allow_anon:=pg_catalog.has_function_privilege('anon',f.oid,'EXECUTE');
  allow_user:=pg_catalog.has_function_privilege('authenticated',f.oid,'EXECUTE');
  allow_service:=f.proname in ('share_account_deletion_lock','share_account_images');
  impl:='api_'||f.proname;
  select coalesce(string_agg('$'||i,','),'') into arguments from generate_series(1,f.pronargs)i;
  execute pg_catalog.format('alter function public.%I(%s) set schema dan_private',f.proname,f.identity_args);
  execute pg_catalog.format('alter function dan_private.%I(%s) rename to %I',f.proname,f.identity_args,impl);
  body:=pg_catalog.format('select * from dan_private.%I(%s)',impl,arguments);
  execute pg_catalog.format('create function public.%I(%s) returns %s language sql security invoker set search_path='''' as %L',f.proname,f.declaration_args,f.result_type,body);
  execute pg_catalog.format('revoke all on function public.%I(%s) from public,anon,authenticated,service_role',f.proname,f.identity_args);
  if allow_anon then execute pg_catalog.format('grant execute on function public.%I(%s) to anon',f.proname,f.identity_args);end if;
  if allow_user then execute pg_catalog.format('grant execute on function public.%I(%s) to authenticated',f.proname,f.identity_args);end if;
  if allow_service then execute pg_catalog.format('grant execute on function public.%I(%s) to service_role',f.proname,f.identity_args);end if;
 end loop;
end;
$boundary$;
grant usage on schema dan_private to anon,authenticated,service_role;
create policy dan_private_deny_client on dan_private.api_limits for all to anon,authenticated using(false) with check(false);
create policy dan_private_deny_client on dan_private.lesson_answers for all to anon,authenticated using(false) with check(false);
create policy dan_private_deny_client on dan_private.share_roles for all to anon,authenticated using(false) with check(false);
create policy dan_private_deny_client on dan_private.share_audit for all to anon,authenticated using(false) with check(false);
create policy dan_private_deny_client on dan_private.share_deleting for all to anon,authenticated using(false) with check(false);
commit;
