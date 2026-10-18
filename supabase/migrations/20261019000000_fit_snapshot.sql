-- Same-type job stats for every main type and every top-two pair, for the offline mini-tool build,
-- which cannot query the API and ships a snapshot instead.
create or replace function public.fit_snapshot() returns json
language sql
stable
set search_path = public
as $$
  with base as (
    select id, created_at, substr(code, 1, 1) as m,
           least(substr(code, 1, 1), substr(code, 2, 1)) || greatest(substr(code, 1, 1), substr(code, 2, 1)) as pk
    from fit_profiles
  ),
  rated as (
    select b.m, b.pk, coalesce(j.job_id, 'custom:' || lower(trim(j.custom))) as job, j.custom, j.satisfaction, j.reason, b.created_at
    from base b join fit_jobs j on j.profile_id = b.id
  ),
  grouped as (
    select 'main' as kind, m as k, job, custom, satisfaction, reason, created_at from rated
    union all
    select 'pair', pk, job, custom, satisfaction, reason, created_at from rated
  ),
  per_job as (
    select kind, k, job, min(custom) as custom, count(*) as n, round(avg(satisfaction)::numeric, 2) as avg,
           count(*) filter (where satisfaction >= 4) as happy,
           coalesce(to_json((array_agg(json_build_object('text', reason, 'satisfaction', satisfaction) order by created_at desc)
                             filter (where reason is not null))[1:3]), '[]'::json) as reasons
    from grouped group by kind, k, job
  ),
  lists as (
    select kind, k, json_agg(json_build_object('job', job, 'custom', custom, 'n', n, 'avg', avg, 'happy', happy, 'reasons', reasons)
                             order by avg desc, n desc) as items
    from per_job group by kind, k
  )
  select json_build_object(
    'total', (select count(*) from base),
    'typeShare', (select coalesce(json_object_agg(m, n), '{}'::json) from (select m, count(*) as n from base group by m) x),
    'sizes', json_build_object(
      'main', (select coalesce(json_object_agg(m, n), '{}'::json) from (select m, count(*) as n from base group by m) x),
      'pair', (select coalesce(json_object_agg(pk, n), '{}'::json) from (select pk, count(*) as n from base group by pk) x)),
    'jobs', json_build_object(
      'main', (select coalesce(json_object_agg(k, items), '{}'::json) from lists where kind = 'main'),
      'pair', (select coalesce(json_object_agg(k, items), '{}'::json) from lists where kind = 'pair'))
  );
$$;

revoke all on function public.fit_snapshot from public, anon, authenticated;
