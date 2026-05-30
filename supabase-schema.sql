-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Decks
create table decks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  topic text,
  is_public boolean default false,
  card_count integer default 0,
  created_at timestamptz default now()
);

-- Cards
create table cards (
  id uuid primary key default uuid_generate_v4(),
  deck_id uuid not null references decks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check(type in ('flashcard', 'mcq', 'elaboration')),
  front text not null,
  back text not null,
  choices jsonb,
  correct_choice integer,
  tags jsonb,
  difficulty_tier text default 'medium',
  repetitions integer default 0,
  ease_factor real default 2.5,
  interval integer default 0,
  next_review date default current_date,
  times_reviewed integer default 0,
  times_correct integer default 0,
  created_at timestamptz default now()
);

-- Review logs
create table review_logs (
  id uuid primary key default uuid_generate_v4(),
  card_id uuid not null references cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  quality integer not null check(quality between 0 and 5),
  ease_factor_before real,
  ease_factor_after real,
  interval_before integer,
  interval_after integer,
  reviewed_at timestamptz default now()
);

-- User progress (one row per user)
create table user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp integer default 0,
  level integer default 1,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_study_date date,
  total_cards_reviewed integer default 0,
  total_sessions integer default 0,
  created_at timestamptz default now()
);

-- RLS
alter table decks enable row level security;
alter table cards enable row level security;
alter table review_logs enable row level security;
alter table user_progress enable row level security;

-- Decks: own + public
create policy "users can manage own decks" on decks
  for all using (auth.uid() = user_id);

create policy "anyone can read public decks" on decks
  for select using (is_public = true);

-- Cards: own only (public deck cards readable too)
create policy "users can manage own cards" on cards
  for all using (auth.uid() = user_id);

create policy "anyone can read cards of public decks" on cards
  for select using (
    exists (select 1 from decks where decks.id = cards.deck_id and decks.is_public = true)
  );

-- Review logs: own only
create policy "users can manage own review logs" on review_logs
  for all using (auth.uid() = user_id);

-- User progress: own only
create policy "users can manage own progress" on user_progress
  for all using (auth.uid() = user_id);

-- Auto-create user_progress row on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_progress (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
