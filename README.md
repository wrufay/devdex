# Flashcards

A barebones terminal flashcard app: sign in with GitHub, create cards, delete
cards, and review them with the SM-2 spaced-repetition algorithm. Built with
[neo-blessed](https://github.com/embarklabs/neo-blessed) and
[Supabase](https://supabase.com).

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a Supabase project and run the schema in `supabase-schema.sql` (SQL
   Editor → paste → run).

3. In Supabase, enable the **GitHub** auth provider (Authentication → Providers).
   Create a GitHub OAuth app with the callback URL pointing at your Supabase
   project's `/auth/v1/callback`, and add `http://localhost:54321` to the
   allowed redirect URLs (Authentication → URL Configuration).

4. Copy `.env.example` to `.env` and fill in your project credentials:

   ```sh
   cp .env.example .env
   ```

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Run

```sh
npm start
```

The app opens GitHub in your browser for sign-in. Your session is cached in
`~/.study-terminal/session.json`, so you stay logged in between runs.

## Controls

- **Menu** — arrow keys + Enter.
- **Create** — type the front, Enter, type the back, Enter to save. Esc cancels.
- **My cards** — arrow keys to select, `d` or Enter to delete, Esc to go back.
- **Review** — Space/Enter reveals the answer, then rate recall:
  `1` Again · `2` Hard · `3` Good · `4` Easy. Esc returns to the menu.

Ctrl-C quits from anywhere.

## How scheduling works

Each card tracks SM-2 state (`repetitions`, `ease_factor`, `interval`,
`next_review`). When you rate a card, `src/engine/sm2.js` computes the next
interval and review date. The review screen only shows cards whose `next_review`
is today or earlier.
