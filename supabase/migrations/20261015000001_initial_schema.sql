-- =====================================================================
-- Tinder for Food: initial schema
--
-- Key ideas:
--   * foods = WHAT a dish is (one row per UCLA recipe/ingredient ID)
--   * menu_appearances = WHEN/WHERE it's served (many rows per food)
--   * swipe_events = append-only log; never updated or deleted.
--     user_food_preferences (view) = each user's LATEST opinion per food.
-- =====================================================================

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- dining_halls ----------
create table public.dining_halls (
  slug           text primary key,                -- 'bruin-plate'
  name           text not null,
  source_url     text not null,
  is_residential boolean not null default true,
  created_at     timestamptz not null default now()
);

insert into public.dining_halls (slug, name, source_url) values
  ('bruin-plate',    'Bruin Plate',       'https://dining.ucla.edu/bruin-plate/'),
  ('de-neve',        'De Neve Dining',    'https://dining.ucla.edu/de-neve-dining/'),
  ('epicuria-covel', 'Epicuria at Covel', 'https://dining.ucla.edu/epicuria-at-covel/'),
  ('feast-rieber',   'Feast at Rieber',   'https://dining.ucla.edu/spice-kitchen/');

-- ---------- foods ----------
create table public.foods (
  id               uuid primary key default gen_random_uuid(),
  -- UCLA links each item as /menu-item/?recipe=881 or ?ingredient=8618.
  -- (source_type, source_id) is the dedup key: one row per dish, forever.
  source_type      text not null check (source_type in ('recipe', 'ingredient')),
  source_id        text not null,
  name             text not null,

  -- Copied from UCLA. NULL means "not collected / unknown", never "none".
  ingredients_text text,
  allergens        text[],                           -- e.g. {dairy,tree_nuts}
  dietary_tags     text[],                           -- e.g. {vegan,halal}
  carbon_footprint text check (carbon_footprint in ('low', 'high')),
  serving_size     text,
  nutrition        jsonb,                            -- {"calories": "174", "protein_g": "14.25", ...}

  -- Team-assigned labels (UCLA doesn't publish these).
  cuisine          text,
  protein_category text,
  labels_source    text check (labels_source in ('team', 'derived')),

  first_seen_on    date,
  last_seen_on     date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (source_type, source_id)
);

create trigger foods_set_updated_at
  before update on public.foods
  for each row execute function public.set_updated_at();

-- ---------- menu_appearances ----------
create table public.menu_appearances (
  id               bigint generated always as identity primary key,
  food_id          uuid not null references public.foods (id) on delete cascade,
  dining_hall_slug text not null references public.dining_halls (slug),
  service_date     date not null,
  meal_period      text not null check (meal_period in
                     ('breakfast', 'brunch', 'lunch', 'dinner', 'extended_dinner', 'late_night')),
  station          text,                              -- e.g. 'Freshly Bowled'
  source_url       text,
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),

  unique (food_id, dining_hall_slug, service_date, meal_period)
);

-- "What's on the menu at <hall> for <date>/<meal>?" (recommendations, deck)
create index menu_appearances_lookup_idx
  on public.menu_appearances (service_date, meal_period, dining_hall_slug);

-- ---------- food_photos ----------
create table public.food_photos (
  id           uuid primary key default gen_random_uuid(),
  food_id      uuid references public.foods (id) on delete set null,  -- NULL until matched
  storage_path text not null unique,                 -- path inside the 'food-photos' bucket
  public_url   text,                                 -- filled in by the upload script
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_primary   boolean not null default false,
  taken_at     date,
  notes        text,                                 -- e.g. "Bruin Plate dinner, team trip week 3"
  created_at   timestamptz not null default now()
);

-- At most one primary photo per food.
create unique index food_photos_one_primary_idx
  on public.food_photos (food_id) where is_primary;

-- ---------- profiles ----------
create table public.profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  display_name            text,
  dietary_restrictions    text[] not null default '{}',   -- values from app vocab, e.g. {vegetarian}
  onboarding_cuisines     text[] not null default '{}',   -- cold-start hints
  onboarding_completed_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile row automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- swipe_events (append-only) ----------
-- Every swipe is a new row. Swiping the same food again later (a changed
-- opinion) adds another row; history is never lost. This lets us evaluate
-- "after the user's first 5/10/20/40 swipes" by ordering on created_at.
create table public.swipe_events (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  food_id       uuid not null references public.foods (id) on delete cascade,
  liked         boolean not null,
  source        text not null default 'deck' check (source in ('deck', 'onboarding', 'recommendations')),
  deck_strategy text,                                 -- which /deck strategy served the card
  created_at    timestamptz not null default now()
);

create index swipe_events_user_time_idx on public.swipe_events (user_id, created_at);
create index swipe_events_food_idx on public.swipe_events (food_id);

-- Latest opinion per (user, food). Use this for recommendations and Food DNA.
-- security_invoker = RLS of the person querying applies (users see only their own rows).
create view public.user_food_preferences
with (security_invoker = true) as
select distinct on (user_id, food_id)
  user_id,
  food_id,
  liked,
  created_at as decided_at,
  id as swipe_event_id
from public.swipe_events
order by user_id, food_id, created_at desc, id desc;

-- Foods plus their primary approved photo URL (the shape of the API `Food` contract).
create view public.foods_with_photo
with (security_invoker = true) as
select
  f.id, f.name, f.source_type, f.source_id,
  f.ingredients_text, f.allergens, f.dietary_tags, f.carbon_footprint,
  f.cuisine, f.protein_category,
  p.public_url as image_url
from public.foods f
left join public.food_photos p
  on p.food_id = f.id and p.is_primary and p.status = 'approved';

-- ---------- ingestion_runs ----------
create table public.ingestion_runs (
  id           bigint generated always as identity primary key,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  service_date date,
  counts       jsonb not null default '{}',   -- {"pages_fetched": 4, "foods_created": 12, ...}
  warnings     jsonb not null default '[]',
  errors       jsonb not null default '[]'
);
