# devdex 🃏

spaced repetition flashcards, but housed 🏡 in your terminal.

study, learn and review from anywhere - especially your favourite text editor like vscode 😼. no browser, no mouse, no gui. just you, your keyboard, and a deck of cards quietly making you smarter.

## what it does ✦

- **decks** - organize cards however you want. make 'em, fill 'em, delete 'em.
- **cards** - create, edit, and delete flashcards (a front + a back). that simple.
- **spaced repetition** - the whole point. devdex schedules each card so it comes back *right before* you'd forget it. less cramming, more remembering.
- **review sessions** - pick a deck (or "all decks"), flip through whatever's due, rate how well you knew it. done.
- **saved to the cloud** - log in with github, your cards follow you everywhere. per-user, nothing shared.

## motive 🔺

**llm thinking time:** why scroll when you can flip?

**reduce friction:** no resistance. take a break from building, coding & spend 2 minutes on something you wanna master.

**minimalist:** no gui, no mouse, no browser - just a keyboard-driven tui in your terminal & our brains are growing.

## how it works (under the hood) 🛠️

the fun part - here's what's actually happening:

**the algorithm — SM-2, from scratch.**
every card carries four numbers: `repetitions`, `ease_factor` (starts at 2.5), `interval`, and `next_review`. when you rate a card:

- **again** (forgot) → the card resets, you see it again tomorrow, and its ease takes a hit.
- **hard / good / easy** → the interval grows `1 day → 6 days → interval × ease`, and the ease nudges up or down based on how it felt.

so the harder a card is for you, the more often it comes back; the easier it is, the longer it rests. ~40 lines, no library, just the math → [src/engine/sm2.js](src/engine/sm2.js).

**login — github oauth, the diy way.**
devdex spins up a tiny local http server on `localhost:54321`, opens github in your browser, catches the redirect, and trades the code for a session (PKCE flow via supabase). the session is cached to `~/.study-terminal/` so you stay logged in between runs. no passwords, ever.

**storage — supabase postgres.**
two tables (`decks`, `cards`) with row-level security, so you only ever see your own stuff. each card's scheduling state lives right on its row, so "what should i study today?" is just a query for what's due.

**the ui — neo-blessed.**
the whole thing is a TUI: centered panels, cyan borders, arrow-key lists, fully keyboard-driven. handles terminal resize, runs anywhere a terminal does.

## controls ⌨️

| where | keys |
|---|---|
| **everywhere** | arrow keys + `enter` to navigate · `ctrl-c` to quit |
| **decks** | `enter` open · `n` new deck · `d` delete (twice to confirm) · `esc` back |
| **inside a deck** | `n` new card · `e` edit · `r` review · `d` delete card · `esc` back |
| **new / edit card** | type the front, `enter`, type the back, `enter` to save · `esc` cancels |
| **review** | `space` / `enter` to flip · then rate: `1` again · `2` hard · `3` good · `4` easy |

## run it 🏃‍♂️

too simple. clone -> nav in -> install -> start.

```bash
git clone https://github.com/wrufay/devdex.git
cd devdex
npm install
npm start
```

first run opens github to sign in. approve it, come back to your terminal, you're in.

## stack ~

- **runtime:** node.js 20+ (esm)
- **ui:** [neo-blessed](https://github.com/embarklabs/neo-blessed)
- **auth + db:** [supabase](https://supabase.com) — github oauth + postgres
- **algorithm:** SM-2, hand-rolled

## lmk 💬

f26wu@uwaterloo[dot]ca
