-- Career-interest results (Holland code and six scores) plus the jobs people have done and how they
-- felt about them. One profile per device.
create table public.fit_profiles (
  id uuid primary key default gen_random_uuid(),
  device_hash text not null unique,
  code text not null check (code ~ '^[RIASEC]{3}$'),
  r smallint not null check (r between 0 and 100),
  i smallint not null check (i between 0 and 100),
  a smallint not null check (a between 0 and 100),
  s smallint not null check (s between 0 and 100),
  e smallint not null check (e between 0 and 100),
  c smallint not null check (c between 0 and 100),
  mbti text check (mbti ~ '^[EI][SN][TF][JP]$'),
  country text not null check (country ~ '^[a-z]{2,10}$'),
  age_band text not null check (age_band in ('<22', '22-25', '26-30', '31-35', '36-40', '41-50', '50+')),
  ip_hash text not null,
  submitted_on date not null,
  source text check (source ~ '^[a-z0-9._-]{1,40}$'),
  created_at timestamptz not null default now()
);

create table public.fit_jobs (
  profile_id uuid not null references public.fit_profiles (id) on delete cascade,
  position smallint not null check (position between 0 and 4),
  job_id text check (job_id ~ '^[a-z0-9-]{1,40}$'),
  custom text check (length(custom) between 1 and 30),
  status text not null check (status in ('current', 'past')),
  years text not null check (years in ('<1', '1-3', '3-5', '5-10', '10+')),
  income text check (income in ('much_lower', 'lower', 'same', 'higher', 'much_higher')),
  satisfaction smallint not null check (satisfaction between 1 and 5),
  reason text check (length(reason) <= 80),
  primary key (profile_id, position),
  check (job_id is not null or custom is not null)
);
create index fit_jobs_job_idx on public.fit_jobs (job_id);

alter table public.fit_profiles enable row level security;
alter table public.fit_jobs enable row level security;
revoke all on table public.fit_profiles, public.fit_jobs from anon, authenticated;

create or replace function public.fit_submit(p jsonb) returns json
language plpgsql
set search_path = public
as $$
declare
  pid uuid;
begin
  select id into pid from fit_profiles where device_hash = p->>'device_hash';
  if found then
    return json_build_object('id', pid, 'created', false);
  end if;
  insert into fit_profiles (device_hash, code, r, i, a, s, e, c, mbti, country, age_band, ip_hash, submitted_on, source)
  values (p->>'device_hash', p->>'code', (p->>'r')::smallint, (p->>'i')::smallint, (p->>'a')::smallint, (p->>'s')::smallint,
          (p->>'e')::smallint, (p->>'c')::smallint, p->>'mbti', p->>'country', p->>'age_band', p->>'ip_hash',
          (p->>'submitted_on')::date, p->>'source')
  returning id into pid;
  insert into fit_jobs (profile_id, position, job_id, custom, status, years, income, satisfaction, reason)
  select pid, (x->>'position')::smallint, x->>'job_id', x->>'custom', x->>'status', x->>'years', x->>'income',
         (x->>'satisfaction')::smallint, x->>'reason'
  from jsonb_array_elements(p->'jobs') x;
  return json_build_object('id', pid, 'created', true);
exception when unique_violation then
  select id into pid from fit_profiles where device_hash = p->>'device_hash';
  return json_build_object('id', pid, 'created', false);
end;
$$;

-- What people like this profile do and how they feel about it, in three groups: same main type (first
-- letter), same top two types (either order), and same self-reported MBTI.
create or replace function public.fit_stats(p_id uuid) returns json
language sql
stable
set search_path = public
as $$
  with me as (select * from fit_profiles where id = p_id),
  pair as (select least(substr(code, 1, 1), substr(code, 2, 1)) || greatest(substr(code, 1, 1), substr(code, 2, 1)) as k from me),
  groups as (
    select 'main' as g, p.id from fit_profiles p, me where substr(p.code, 1, 1) = substr(me.code, 1, 1)
    union all
    select 'pair', p.id from fit_profiles p, pair
      where least(substr(p.code, 1, 1), substr(p.code, 2, 1)) || greatest(substr(p.code, 1, 1), substr(p.code, 2, 1)) = pair.k
    union all
    select 'mbti', p.id from fit_profiles p, me where me.mbti is not null and p.mbti = me.mbti
  ),
  rated as (
    select g.g, coalesce(j.job_id, 'custom:' || lower(trim(j.custom))) as job, j.custom, j.satisfaction, j.reason, j.income, p.created_at
    from groups g join fit_jobs j on j.profile_id = g.id join fit_profiles p on p.id = g.id
  ),
  per_job as (
    select g, job, min(custom) as custom, count(*) as n, round(avg(satisfaction)::numeric, 2) as avg,
           count(*) filter (where satisfaction >= 4) as happy,
           (select coalesce(json_agg(json_build_object('text', x.reason, 'satisfaction', x.satisfaction) order by x.created_at desc), '[]'::json)
            from (select r2.reason, r2.satisfaction, r2.created_at from rated r2
                  where r2.g = r.g and r2.job = r.job and r2.reason is not null order by r2.created_at desc limit 3) x) as reasons
    from rated r group by g, job
  )
  select case when not exists (select 1 from me) then null else json_build_object(
    'total', (select count(*) from fit_profiles),
    'sizes', (select coalesce(json_object_agg(g, n), '{}'::json) from (select g, count(*) as n from groups group by g) s),
    'jobs', (select coalesce(json_object_agg(g, items), '{}'::json) from (
               select g, json_agg(json_build_object('job', job, 'custom', custom, 'n', n, 'avg', avg, 'happy', happy, 'reasons', reasons)
                                  order by avg desc, n desc) as items
               from per_job group by g) t),
    'typeShare', (select json_object_agg(t, n) from (select substr(code, 1, 1) as t, count(*) as n from fit_profiles group by 1) x)
  ) end;
$$;

revoke all on function public.fit_submit, public.fit_stats from public, anon, authenticated;
