# _devDex_ 𓏵‧₊˚ ┊ flashcards in your terminal

### hey dev... how's it been?

no no, not your code, work, or side projects. how have YOU been.

**how long has it _really_ been since you tended to:**

༝ that language you've always wanted to learn

༝ the scriptures you can never seem to memorize

༝ those niche interests that just never get your time ˙◠˙

### i get you with the grind but... there's more to life than that llm 😭

## and certainly more to the terminal than meets the command line.

with **_devDex_**, review + learn + memorize all without leaving your favourite text editor.

powered by spaced repetition, it's like Anki - but integrated seamlessly into your everyday workflow. building up here 🧠 and down here 💻 in parallel.

## ꕤ features

- **cards and decks** - traditional front and back. create, review, update, delete; full CRUD, Deck's Version

- **spaced repetition** - the meta for active recall. each card is scheduled so it comes back _right before_ you'd forget it. all for less cramming, more remembering!

- **review sessions** - pick a deck, go through what's due, respond with how well you knew it.

- **saved to the cloud** - log in with GitHub. your cards are for you, and with you - wherever you go.

## ꕤ motive

**llm thinking time:** why scroll when you can flip?

**reduce friction:** no resistance. take a break from building, coding & spend 2 minutes on something you wanna master.

**minimalist:** no gui, no popup window, no browser. a text-based user interface is enough to get those gears turning and that streak burning

## ꕤ built with:

- **Node.js** runtime
- **[neo-blessed](https://github.com/embarklabs/neo-blessed)** ui
- **[Supabase](https://supabase.com) - GitHub OAuth + Postgres** auth and db
- **SM-2, hand-rolled** spaced repetition algorithm

## ꕤ what's under the hood, explained

**SM-2 algo**
every card carries four numbers: `repetitions`, `ease_factor` (starts at 2.5), `interval`, and `next_review`. when you rate a card:

- **again** (forgot) → the card resets, you see it again tomorrow, and its ease takes a hit.
- **hard / good / easy** → the interval grows `1 day → 6 days → interval × ease`, and the ease nudges up or down based on how it felt.

so the harder a card is for you, the more often it comes back; the easier it is, the longer it rests.

**GitHub OAuth**
devDex spins up a mini local http server on `localhost:54321`, opens GitHub in your browser, catches the redirect, and trades the code for a session (PKCE flow via Supabase). the session is cached to `~/.study-terminal/` so you stay logged in between runs.

**Supabase Postgres.**
two tables (`decks`, `cards`) with row-level security, so you only ever see your own stuff. each card's scheduling state lives right on its row, so "what should i study today?" is just a query for what's due.

**neo-blessed.**
the whole thing is a TUI: centered panels, cyan borders, arrow-key lists, fully keyboard-driven. handles terminal resize, runs anywhere a terminal does.

## ꕤ nav tips

| where               | keys                                                                              |
| ------------------- | --------------------------------------------------------------------------------- |
| **everywhere**      | arrow keys + `enter` to navigate · `ctrl-c` to quit                               |
| **decks**           | `enter` open · `n` new deck · `e` rename · `d` delete (twice to confirm) · `esc` back |
| **inside a deck**   | `n` new card · `e` edit · `r` review · `d` delete card · `esc` back               |
| **new / edit card** | type the front, `enter`, type the back, `enter` to save · `esc` cancels           |
| **review**          | `space` / `enter` to flip · then rate: `1` again · `2` hard · `3` good · `4` easy |

## run it 🏃‍♂️

too simple. clone -> nav in -> install -> start.

```bash
git clone https://github.com/wrufay/devdex.git
cd devdex
npm install
npm start
```

first run opens GitHub to sign in. once you approve it, come back to your terminal & you're ready to go!

## lmk ˙ᵕ˙

f26wu@uwaterloo[dot]ca
