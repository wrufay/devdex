-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Flashcards (one table, with SM-2 spaced-repetition fields)
create table cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null,
  back text not null,
  -- SM-2 state
  repetitions integer default 0,
  ease_factor real default 2.5,
  interval integer default 0,
  next_review date default current_date,
  created_at timestamptz default now()
);

create index cards_user_due_idx on cards (user_id, next_review);

-- Row level security: a user can only see and manage their own cards
alter table cards enable row level security;

create policy "users can manage own cards" on cards
  for all using (auth.uid() = user_id);
