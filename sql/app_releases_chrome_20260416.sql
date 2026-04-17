-- ProjectTrack Chrome private release metadata.
-- Stores only lightweight release information. The zip remains in GitHub Releases.

create extension if not exists pgcrypto;

create table if not exists public.app_releases (
  id uuid primary key default gen_random_uuid(),
  app_name text not null,
  version text not null,
  release_id text,
  release_name text,
  release_url text not null,
  download_url text,
  asset_name text not null default 'ProjectTrack-Chrome.zip',
  active boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_releases_app_version_unique unique (app_name, version)
);

create index if not exists app_releases_active_lookup_idx
on public.app_releases (app_name, active, published_at desc);

alter table public.app_releases enable row level security;

grant select on table public.app_releases to authenticated;

drop policy if exists app_releases_select_active_authenticated on public.app_releases;

create policy app_releases_select_active_authenticated
on public.app_releases
for select
to authenticated
using (active = true);

insert into public.app_releases (
  app_name,
  version,
  release_id,
  release_name,
  release_url,
  download_url,
  asset_name,
  active,
  published_at
) values (
  'projecttrack-chrome',
  '0.1.0',
  'v0.1.0',
  'ProjectTrack Chrome 0.1.0',
  'https://github.com/jmirsteinban/ProjectTack/releases/tag/v0.1.0',
  'https://github.com/jmirsteinban/ProjectTack/releases/tag/v0.1.0',
  'ProjectTrack-Chrome.zip',
  true,
  '2026-04-16T00:00:00Z'
)
on conflict (app_name, version) do update
set
  release_id = excluded.release_id,
  release_name = excluded.release_name,
  release_url = excluded.release_url,
  download_url = excluded.download_url,
  asset_name = excluded.asset_name,
  active = excluded.active,
  published_at = excluded.published_at,
  updated_at = now();
