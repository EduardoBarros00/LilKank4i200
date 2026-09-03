-- LilKank: configurable site background
alter table public.lilkank_settings
  add column if not exists background_image_url text,
  add column if not exists background_overlay smallint not null default 46,
  add column if not exists background_position text not null default 'center';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lilkank_settings_background_overlay_check'
  ) then
    alter table public.lilkank_settings
      add constraint lilkank_settings_background_overlay_check
      check (background_overlay between 0 and 85);
  end if;
end $$;

comment on column public.lilkank_settings.background_image_url is 'Optional public URL for a custom LilKank background; null uses bundled default art.';
comment on column public.lilkank_settings.background_overlay is 'Background overlay opacity percentage, from 0 to 85.';
comment on column public.lilkank_settings.background_position is 'CSS background-position value used across public, auth and admin views.';
