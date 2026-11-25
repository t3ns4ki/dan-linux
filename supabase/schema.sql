-- Dan Linux 2.0 · initial migration for a NEW Supabase project.
-- Execute once in SQL Editor. No keys or passwords belong in this file.
begin;

create schema dan_private;
revoke all on schema dan_private from public, anon, authenticated;

create table public.distros (
  id text primary key check (id ~ '^[a-z0-9-]{1,48}$'),
  name text not null check (length(name) between 1 and 80),
  kind text not null check (kind in ('distro','de','wm')),
  family text not null,
  logo text not null check (logo ~ '^assets/[a-zA-Z0-9_.-]+\.(svg|png|ico)$'),
  active boolean not null default true
);
create table public.voting_categories (
  id text primary key check (id ~ '^[a-z0-9-]{1,48}$'),
  name text not null,
  kind text not null check (kind in ('distro','de','wm')),
  position integer not null unique,
  active boolean not null default true
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (length(nickname) between 2 and 24 and nickname = btrim(nickname) and nickname !~ '[[:cntrl:]<>]'),
  avatar_id text not null default 'arch' check (avatar_id in ('arch','gentoo','void','omarchy','zorin','pop','mint','debian','ubuntu','fedora','cachy','endeavour','alpine','nixos','bazzite','opensuse','artix','linux')),
  favorite_distro text references public.distros(id),
  favorite_de text references public.distros(id),
  favorite_wm text references public.distros(id),
  is_private boolean not null default true check (is_private),
  preferences jsonb not null default '{"celebrate_achievements":true,"show_xp":true}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  xp integer not null default 0 check (xp between 0 and 1000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.academy_lessons (
  id text primary key,
  course text not null check (course in ('basics','terminal','packages','advanced')),
  title text not null,
  xp integer not null check (xp between 0 and 100),
  revision integer not null default 1 check (revision > 0),
  prerequisite text references public.academy_lessons(id)
);
create table dan_private.lesson_answers (
  lesson_id text primary key references public.academy_lessons(id) on delete cascade,
  practice_answers jsonb not null check (jsonb_typeof(practice_answers) = 'array'),
  quiz_answer text not null
);
create table public.academy_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.academy_lessons(id),
  revision integer not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create table public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  bonus integer not null check (bonus between 0 and 100),
  secret boolean not null default false
);
create table public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id),
  earned_at timestamptz not null default now(),
  primary key (user_id,achievement_id)
);
create table public.votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id text not null references public.voting_categories(id),
  distro_id text not null references public.distros(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, category_id)
);
create index votes_category_candidate on public.votes(category_id,distro_id);
create table public.vote_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id text not null references public.voting_categories(id),
  distro_id text references public.distros(id),
  action text not null check (action in ('vote','change','withdraw')),
  created_at timestamptz not null default clock_timestamp()
);
create index vote_history_user_date on public.vote_history(user_id,created_at desc);
create table dan_private.api_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  uses integer not null check (uses between 1 and 10000),
  primary key (user_id,action)
);

alter table public.profiles enable row level security;
alter table public.academy_progress enable row level security;
alter table public.user_achievements enable row level security;
alter table public.votes enable row level security;
alter table public.vote_history enable row level security;
alter table public.achievements enable row level security;
alter table public.academy_lessons enable row level security;
alter table public.distros enable row level security;
alter table public.voting_categories enable row level security;
alter table dan_private.lesson_answers enable row level security;
alter table dan_private.api_limits enable row level security;

-- Personal rows are readable only by their owner. Mutations go through narrow RPCs.
create policy own_profile on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy own_progress on public.academy_progress for select to authenticated using (user_id = (select auth.uid()));
create policy own_achievements on public.user_achievements for select to authenticated using (user_id = (select auth.uid()));
create policy own_votes on public.votes for select to authenticated using (user_id = (select auth.uid()));
create policy own_vote_history on public.vote_history for select to authenticated using (user_id = (select auth.uid()));
create policy visible_achievements on public.achievements for select to anon,authenticated using (not secret);
create policy readable_lessons on public.academy_lessons for select to anon,authenticated using (true);
create policy active_distros on public.distros for select to anon,authenticated using (active);
create policy active_categories on public.voting_categories for select to anon,authenticated using (active);

revoke all on public.profiles, public.academy_progress, public.user_achievements, public.votes, public.vote_history,
  public.achievements, public.academy_lessons, public.distros, public.voting_categories from public,anon,authenticated;
grant select on public.profiles, public.academy_progress, public.user_achievements, public.votes, public.vote_history to authenticated;
grant select on public.achievements, public.academy_lessons, public.distros, public.voting_categories to anon,authenticated;
revoke all on all tables in schema dan_private from public,anon,authenticated;

create function dan_private.new_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,nickname) values (new.id,'linux-user-' || substr(new.id::text,1,6));
  return new;
end;
$$;
create trigger dan_linux_new_user after insert on auth.users for each row execute function dan_private.new_profile();
insert into public.profiles(id,nickname)
  select id,'linux-user-' || substr(id::text,1,6) from auth.users on conflict(id) do nothing;

create function dan_private.require_user() returns uuid language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not exists (select 1 from auth.users where id=uid and email_confirmed_at is not null) then
    raise exception 'подтверди почту и войди в аккаунт' using errcode='42501';
  end if;
  if not exists(select 1 from public.profiles where id=uid) then
    raise exception 'аккаунт удалён или недоступен' using errcode='42501';
  end if;
  return uid;
end;
$$;

create function dan_private.consume_budget(uid uuid, operation text, maximum integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare used integer; current_window timestamptz := date_trunc('minute',clock_timestamp());
begin
  insert into dan_private.api_limits(user_id,action,window_start,uses) values(uid,operation,current_window,1)
  on conflict(user_id,action) do update set
    uses=case when api_limits.window_start=excluded.window_start then least(api_limits.uses+1,10000) else 1 end,
    window_start=excluded.window_start returning uses into used;
  return used <= maximum;
end;
$$;

create function dan_private.recompute_awards(uid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare course_id text; badge_id text;
begin
  if exists(select 1 from public.academy_progress where user_id=uid) then
    insert into public.user_achievements(user_id,achievement_id) values(uid,'hello-linux') on conflict do nothing;
  end if;
  if exists(select 1 from public.academy_progress where user_id=uid and lesson_id='pkg-pacman') then
    insert into public.user_achievements(user_id,achievement_id) values(uid,'arch-btw') on conflict do nothing;
  end if;
  for course_id,badge_id in select * from (values
    ('basics','open-source'),('terminal','terminal-enjoyer'),('packages','package-master'),('advanced','kernel-master')
  ) as courses(course,badge) loop
    if exists(select 1 from public.academy_lessons where course=course_id)
      and not exists(select 1 from public.academy_lessons l where l.course=course_id
        and not exists(select 1 from public.academy_progress p where p.user_id=uid and p.lesson_id=l.id)) then
      insert into public.user_achievements(user_id,achievement_id) values(uid,badge_id) on conflict do nothing;
    end if;
  end loop;
  update public.profiles set xp =
    coalesce((select sum(l.xp) from public.academy_progress p join public.academy_lessons l on l.id=p.lesson_id where p.user_id=uid),0)
    + coalesce((select sum(a.bonus) from public.user_achievements ua join public.achievements a on a.id=ua.achievement_id where ua.user_id=uid),0),
    updated_at=now() where id=uid;
end;
$$;

create function public.my_dashboard() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := dan_private.require_user(); profile_json jsonb;
begin
  select to_jsonb(p) || jsonb_build_object('level',1+p.xp/150) into profile_json from public.profiles p where p.id=uid;
  return jsonb_build_object(
    'profile',profile_json,
    'progress',coalesce((select jsonb_agg(to_jsonb(p) - 'user_id' order by p.completed_at) from public.academy_progress p where p.user_id=uid),'[]'::jsonb),
    'achievements',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'name',a.name,'description',a.description,'bonus',a.bonus,'earned_at',ua.earned_at) order by ua.earned_at) from public.user_achievements ua join public.achievements a on a.id=ua.achievement_id where ua.user_id=uid),'[]'::jsonb),
    'votes',coalesce((select jsonb_agg(jsonb_build_object('category_id',v.category_id,'distro_id',v.distro_id,'category_name',c.name,'candidate_name',d.name,'updated_at',v.updated_at) order by c.position) from public.votes v join public.voting_categories c on c.id=v.category_id join public.distros d on d.id=v.distro_id where v.user_id=uid),'[]'::jsonb),
    'vote_history',coalesce((select jsonb_agg(to_jsonb(h) order by h.created_at desc) from
      (select vh.category_id,vh.distro_id,vh.action,vh.created_at,c.name category_name,d.name candidate_name
       from public.vote_history vh join public.voting_categories c on c.id=vh.category_id left join public.distros d on d.id=vh.distro_id
       where vh.user_id=uid order by vh.created_at desc limit 50) h),'[]'::jsonb)
  );
end;
$$;

create function public.submit_lesson(p_lesson_id text,p_practice_answer jsonb,p_quiz_answer text,p_revision integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := dan_private.require_user(); lesson public.academy_lessons%rowtype;
  answer dan_private.lesson_answers%rowtype; practice_ok boolean; quiz_ok boolean;
begin
  perform 1 from public.profiles where id=uid for update;
  if not dan_private.consume_budget(uid,'lessons',60) then return jsonb_build_object('ok',false,'error','слишком много попыток; подожди минуту.'); end if;
  if length(p_lesson_id)>64 or length(p_quiz_answer)>40 or octet_length(p_practice_answer::text)>1200 then
    return jsonb_build_object('ok',false,'error','неверный формат ответа.');
  end if;
  select * into lesson from public.academy_lessons where id=p_lesson_id;
  if not found or p_revision is distinct from lesson.revision then
    return jsonb_build_object('ok',false,'error','урок обновлён или не найден. обнови страницу.');
  end if;
  if exists(select 1 from public.academy_progress where user_id=uid and lesson_id=p_lesson_id) then
    return jsonb_build_object('ok',true,'already_completed',true,'dashboard',public.my_dashboard());
  end if;
  if lesson.prerequisite is not null and not exists(select 1 from public.academy_progress where user_id=uid and lesson_id=lesson.prerequisite) then
    return jsonb_build_object('ok',false,'error','сначала заверши предыдущий урок этого курса.');
  end if;
  select * into answer from dan_private.lesson_answers where lesson_id=p_lesson_id;
  practice_ok := exists(select 1 from jsonb_array_elements(answer.practice_answers) as candidate(value) where candidate.value=p_practice_answer);
  quiz_ok := answer.quiz_answer=p_quiz_answer;
  if not coalesce(practice_ok,false) or not coalesce(quiz_ok,false) then
    return jsonb_build_object('ok',false,'practice_ok',coalesce(practice_ok,false),'quiz_ok',coalesce(quiz_ok,false),'error','проверь практику и ответ на тест: XP начисляется после обеих частей.');
  end if;
  insert into public.academy_progress(user_id,lesson_id,revision) values(uid,p_lesson_id,lesson.revision) on conflict do nothing;
  perform dan_private.recompute_awards(uid);
  return jsonb_build_object('ok',true,'dashboard',public.my_dashboard());
end;
$$;

create function public.claim_chocolate(p_phrase text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := dan_private.require_user();
begin
  perform 1 from public.profiles where id=uid for update;
  if not dan_private.consume_budget(uid,'secrets',10) then return jsonb_build_object('ok',false,'error','подожди минуту перед следующей попыткой.'); end if;
  if p_phrase not in ('chocolate trapezoid','chocolate-trapezoid') then return jsonb_build_object('ok',false,'error','секрет не найден.'); end if;
  insert into public.user_achievements(user_id,achievement_id) values(uid,'chocolate') on conflict do nothing;
  perform dan_private.recompute_awards(uid);
  return jsonb_build_object('ok',true,'dashboard',public.my_dashboard());
end;
$$;

create function public.save_profile(p_nickname text,p_avatar_id text,p_favorite_distro text,p_favorite_de text,p_favorite_wm text,p_preferences jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := dan_private.require_user();
begin
  if not dan_private.consume_budget(uid,'profile',10) then return jsonb_build_object('ok',false,'error','слишком частые изменения; подожди минуту.'); end if;
  if p_nickname is null or length(btrim(p_nickname)) not between 2 and 24 or p_nickname ~ '[[:cntrl:]<>]' then return jsonb_build_object('ok',false,'error','никнейм: от 2 до 24 символов, без управляющих символов и угловых скобок.'); end if;
  if p_avatar_id is null or p_avatar_id not in ('arch','gentoo','void','omarchy','zorin','pop','mint','debian','ubuntu','fedora','cachy','endeavour','alpine','nixos','bazzite','opensuse','artix','linux') then return jsonb_build_object('ok',false,'error','выбери встроенный аватар.'); end if;
  if p_favorite_distro is not null and not exists(select 1 from public.distros where id=p_favorite_distro and kind='distro' and active) then return jsonb_build_object('ok',false,'error','неизвестный дистрибутив.'); end if;
  if p_favorite_de is not null and not exists(select 1 from public.distros where id=p_favorite_de and kind='de' and active) then return jsonb_build_object('ok',false,'error','неизвестное окружение.'); end if;
  if p_favorite_wm is not null and not exists(select 1 from public.distros where id=p_favorite_wm and kind='wm' and active) then return jsonb_build_object('ok',false,'error','неизвестный оконный менеджер.'); end if;
  if p_preferences is null or jsonb_typeof(p_preferences) is distinct from 'object'
    or jsonb_typeof(p_preferences->'celebrate_achievements') is distinct from 'boolean'
    or jsonb_typeof(p_preferences->'show_xp') is distinct from 'boolean'
    or (p_preferences - 'celebrate_achievements' - 'show_xp') <> '{}'::jsonb then
    return jsonb_build_object('ok',false,'error','неверный формат настроек.');
  end if;
  update public.profiles set nickname=btrim(p_nickname),avatar_id=p_avatar_id,favorite_distro=p_favorite_distro,
    favorite_de=p_favorite_de,favorite_wm=p_favorite_wm,preferences=p_preferences,updated_at=now() where id=uid;
  return jsonb_build_object('ok',true,'dashboard',public.my_dashboard());
end;
$$;

create function dan_private.validate_vote() returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists(select 1 from public.voting_categories c join public.distros d on d.kind=c.kind
      where c.id=new.category_id and d.id=new.distro_id and c.active and d.active) then
    raise exception 'кандидат не соответствует категории';
  end if;
  return new;
end;
$$;
create trigger dan_linux_vote_kind before insert or update on public.votes for each row execute function dan_private.validate_vote();

create function public.cast_vote(p_category_id text,p_distro_id text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := dan_private.require_user(); previous_choice text;
begin
  perform 1 from public.profiles where id=uid for update;
  if not dan_private.consume_budget(uid,'votes',8) then return jsonb_build_object('ok',false,'error','подожди минуту: лимит изменений голоса.'); end if;
  if not exists(select 1 from public.voting_categories where id=p_category_id and active) then return jsonb_build_object('ok',false,'error','категория не найдена.'); end if;
  select distro_id into previous_choice from public.votes where user_id=uid and category_id=p_category_id;
  if p_distro_id is null then
    delete from public.votes where user_id=uid and category_id=p_category_id;
    if previous_choice is not null then insert into public.vote_history(user_id,category_id,distro_id,action) values(uid,p_category_id,previous_choice,'withdraw'); end if;
  else
    if not exists(select 1 from public.voting_categories c join public.distros d on d.kind=c.kind where c.id=p_category_id and d.id=p_distro_id and c.active and d.active) then
      return jsonb_build_object('ok',false,'error','этот кандидат не подходит к категории.');
    end if;
    insert into public.votes(user_id,category_id,distro_id) values(uid,p_category_id,p_distro_id)
      on conflict(user_id,category_id) do update set distro_id=excluded.distro_id,updated_at=now();
    if previous_choice is distinct from p_distro_id then insert into public.vote_history(user_id,category_id,distro_id,action) values(uid,p_category_id,p_distro_id,case when previous_choice is null then 'vote' else 'change' end); end if;
  end if;
  return jsonb_build_object('ok',true,'dashboard',public.my_dashboard());
end;
$$;

-- Only aggregate counts are public: never expose the votes' user_id values.
create function public.voting_results() returns table(category_id text,distro_id text,vote_count bigint)
language sql stable security definer set search_path = '' as $$
  select c.id,d.id,count(v.user_id) from public.voting_categories c
    join public.distros d on d.kind=c.kind and d.active
    left join public.votes v on v.category_id=c.id and v.distro_id=d.id
  where c.active group by c.id,d.id;
$$;

revoke all on all functions in schema dan_private from public,anon,authenticated;
revoke all on function public.my_dashboard(), public.submit_lesson(text,jsonb,text,integer),
  public.claim_chocolate(text), public.save_profile(text,text,text,text,text,jsonb),
  public.cast_vote(text,text), public.voting_results() from public,anon,authenticated;
grant execute on function public.my_dashboard(), public.submit_lesson(text,jsonb,text,integer),
  public.claim_chocolate(text), public.save_profile(text,text,text,text,text,jsonb),public.cast_vote(text,text) to authenticated;
grant execute on function public.voting_results() to anon,authenticated;

-- BEGIN GENERATED CATALOG
insert into public.distros(id,name,kind,family,logo) values('arch','Arch Linux','distro','arch','assets/arch.svg');
insert into public.distros(id,name,kind,family,logo) values('gentoo','Gentoo','distro','independent','assets/gentoo.svg');
insert into public.distros(id,name,kind,family,logo) values('void','Void Linux','distro','independent','assets/void.svg');
insert into public.distros(id,name,kind,family,logo) values('omarchy','Omarchy','distro','arch','assets/omarchy.svg');
insert into public.distros(id,name,kind,family,logo) values('zorin','Zorin OS','distro','debian','assets/zorin.svg');
insert into public.distros(id,name,kind,family,logo) values('pop','Pop!_OS','distro','debian','assets/pop.svg');
insert into public.distros(id,name,kind,family,logo) values('mint','Linux Mint','distro','debian','assets/mint.svg');
insert into public.distros(id,name,kind,family,logo) values('debian','Debian','distro','debian','assets/debian.svg');
insert into public.distros(id,name,kind,family,logo) values('ubuntu','Ubuntu','distro','debian','assets/ubuntu.svg');
insert into public.distros(id,name,kind,family,logo) values('fedora','Fedora','distro','fedora','assets/fedora.svg');
insert into public.distros(id,name,kind,family,logo) values('cachy','CachyOS','distro','arch','assets/cachy.svg');
insert into public.distros(id,name,kind,family,logo) values('endeavour','EndeavourOS','distro','arch','assets/endeavour.svg');
insert into public.distros(id,name,kind,family,logo) values('alpine','Alpine Linux','distro','independent','assets/alpine.svg');
insert into public.distros(id,name,kind,family,logo) values('nixos','NixOS','distro','independent','assets/nixos.svg');
insert into public.distros(id,name,kind,family,logo) values('bazzite','Bazzite','distro','fedora','assets/bazzite.svg');
insert into public.distros(id,name,kind,family,logo) values('opensuse','openSUSE','distro','suse','assets/opensuse.svg');
insert into public.distros(id,name,kind,family,logo) values('artix','Artix Linux','distro','arch','assets/artix.svg');
insert into public.distros(id,name,kind,family,logo) values('manjaro','Manjaro','distro','arch','assets/manjaro.svg');
insert into public.distros(id,name,kind,family,logo) values('gnome','GNOME','de','desktop','assets/gnome.svg');
insert into public.distros(id,name,kind,family,logo) values('plasma','KDE Plasma','de','desktop','assets/kdeplasma.svg');
insert into public.distros(id,name,kind,family,logo) values('xfce','Xfce','de','desktop','assets/xfce.svg');
insert into public.distros(id,name,kind,family,logo) values('hyprland','Hyprland','wm','wm','assets/hyprland.svg');
insert into public.distros(id,name,kind,family,logo) values('sway','Sway','wm','wm','assets/sway.svg');
insert into public.distros(id,name,kind,family,logo) values('i3','i3','wm','wm','assets/i3.svg');
insert into public.voting_categories(id,name,kind,position) values('favorite','любимый дистрибутив','distro',0);
insert into public.voting_categories(id,name,kind,position) values('beginner','лучший для новичков','distro',1);
insert into public.voting_categories(id,name,kind,position) values('lightweight','лучший для слабых ПК','distro',2);
insert into public.voting_categories(id,name,kind,position) values('customization','лучший для кастомизации','distro',3);
insert into public.voting_categories(id,name,kind,position) values('developer','лучший для разработчиков','distro',4);
insert into public.voting_categories(id,name,kind,position) values('desktop','лучший Desktop Environment','de',5);
insert into public.voting_categories(id,name,kind,position) values('wm','лучший Window Manager','wm',6);
insert into public.achievements(id,name,description,bonus,secret) values('hello-linux','Hello, Linux!','первый пройденный урок',20,false);
insert into public.achievements(id,name,description,bonus,secret) values('terminal-enjoyer','Terminal Enjoyer','весь курс терминала',30,false);
insert into public.achievements(id,name,description,bonus,secret) values('package-master','Package Manager Master','все пакетные менеджеры',30,false);
insert into public.achievements(id,name,description,bonus,secret) values('open-source','Open Source Enthusiast','весь курс основ Linux',30,false);
insert into public.achievements(id,name,description,bonus,secret) values('arch-btw','I use Arch btw.','разобраться с pacman',20,false);
insert into public.achievements(id,name,description,bonus,secret) values('kernel-master','Kernel Master','весь продвинутый курс',40,false);
insert into public.achievements(id,name,description,bonus,secret) values('chocolate','Chocolate Trapezoid','найти шоколадный секрет терминала',20,true);
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('linux','basics','что такое Linux?',30,1,null);
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('linux','["kernel"]'::jsonb,'distribution');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('kernel','basics','зачем нужно ядро?',30,1,'linux');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('kernel','["driver"]'::jsonb,'resources');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('distribution','basics','что такое дистрибутив?',30,1,'kernel');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('distribution','["ready"]'::jsonb,'yes');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('windows','basics','Linux и Windows: выбираем по задачам',30,1,'distribution');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('windows','["check"]'::jsonb,'no');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('opensource','basics','Open Source — права, а не ценник',30,1,'windows');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('opensource','["report"]'::jsonb,'audit');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('term-navigation','terminal','ls, cd, pwd: где я?',30,1,null);
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('term-navigation','[["cd Documents"],["cd /home/guest/Documents"]]'::jsonb,'pwd');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('term-create','terminal','mkdir и touch: создаём своё',30,1,'term-navigation');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('term-create','[["mkdir projects","touch projects/hello.txt"]]'::jsonb,'time');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('term-read','terminal','cat: читаем текст',30,1,'term-create');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('term-read','[["cat notes.txt"]]'::jsonb,'path');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('term-copy','terminal','cp и mv: копия или переезд?',30,1,'term-read');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('term-copy','[["cp notes.txt backup.txt","mv backup.txt archive.txt"]]'::jsonb,'cp');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('term-grep','terminal','grep: найди нужные строки',30,1,'term-copy');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('term-grep','[["grep Linux notes.txt"],["grep -i linux notes.txt"]]'::jsonb,'ignore');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('term-permissions','terminal','права доступа: 644 — не пароль',30,1,'term-grep');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('term-permissions','[["chmod 644 notes.txt"]]'::jsonb,'rw');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('term-sudo','terminal','пользователи и sudo',30,1,'term-permissions');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('term-sudo','[["sudo whoami"]]'::jsonb,'least');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('term-pipes','terminal','перенаправление и пайпы',30,1,'term-sudo');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('term-pipes','[["echo Linux > result.txt","cat result.txt | grep Linux"]]'::jsonb,'append');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('pkg-pacman','packages','pacman: официальный путь Arch',30,1,null);
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('pkg-pacman','[["sudo pacman -S firefox"]]'::jsonb,'full');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('pkg-apt','packages','APT: Debian и Ubuntu',30,1,'pkg-pacman');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('pkg-apt','[["sudo apt install firefox"]]'::jsonb,'index');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('pkg-dnf','packages','DNF: семейство Fedora',30,1,'pkg-apt');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('pkg-dnf','[["sudo dnf install firefox"]]'::jsonb,'no');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('pkg-xbps','packages','XBPS: свой путь Void',30,1,'pkg-dnf');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('pkg-xbps','[["sudo xbps-install -S firefox"]]'::jsonb,'query');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('pkg-emerge','packages','Portage и emerge: сборка по рецепту',30,1,'pkg-xbps');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('pkg-emerge','[["sudo emerge --ask www-client/firefox"]]'::jsonb,'features');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('pkg-aur','packages','AUR, yay, paru и makepkg',30,1,'pkg-emerge');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('pkg-aur','[["makepkg -si"]]'::jsonb,'privilege');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('adv-kernel','advanced','ядро и системные вызовы',30,1,null);
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('adv-kernel','[["uname -r"]]'::jsonb,'syscall');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('adv-boot','advanced','GRUB и Limine: до запуска системы',30,1,'adv-kernel');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('adv-boot','["before"]'::jsonb,'bootloaders');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('adv-init','advanced','systemd и альтернативные init',30,1,'adv-boot');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('adv-init','[["ps -p 1 -o comm="]]'::jsonb,'no');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('adv-desktop','advanced','DE и WM: что рисует твой рабочий стол?',30,1,'adv-init');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('adv-desktop','["de"]'::jsonb,'no');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('adv-display','advanced','X11 и Wayland',30,1,'adv-desktop');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('adv-display','["compat"]'::jsonb,'different');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('adv-bash','advanced','Bash: переменные и сценарии',30,1,'adv-display');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('adv-bash','[["name=Dan","echo $name"]]'::jsonb,'compact');
insert into public.academy_lessons(id,course,title,xp,revision,prerequisite) values('adv-compile','advanced','компиляция: из исходника в программу',30,1,'adv-bash');
insert into dan_private.lesson_answers(lesson_id,practice_answers,quiz_answer) values('adv-compile','[["cc hello.c -o hello","./hello"]]'::jsonb,'output');
-- END GENERATED CATALOG
commit;
