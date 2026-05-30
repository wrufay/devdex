# CLI Flashcard Study App

A terminal-based flashcard app with spaced repetition, quiz mode, cram mode, and XP/streak tracking.

## Setup

1. Clone this repo
```bash
git clone https://github.com/<your-username-here>/cli_136.git
cd cli_136
```

2. Install dependencies
```bash
npm install
```

3. Start the application
```bash
npm start
```

### ENJOY ! 🩶

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js (ESM) |
| UI | React + [Ink](https://github.com/vadimdemedes/ink) |
| Database | SQLite via `better-sqlite3` |
| Build | esbuild |

## Architecture

```
src/
├── index.js          # Entry point — init DB, render app
├── app.js            # Root component, screen router
├── screens/          # One component per screen (study, quiz, cram, etc.)
├── engine/
│   ├── sm2.js        # SM-2 spaced repetition algorithm
│   ├── scheduler.js  # Card scheduling logic
│   └── xp.js         # XP calculation
├── db/
│   ├── schema.js     # Table definitions (decks, cards, review_logs, user_progress)
│   ├── queries.js    # All SQL queries
│   └── connection.js # SQLite connection singleton
└── components/       # Shared UI components (header, etc.)
```

**Data flow:** screens call engine functions → engine reads/writes via db/queries → SQLite persists to `data/study.db`

## Features

- Spaced repetition (SM-2 algorithm)
- Quiz mode (multiple choice)
- Cram mode
- XP and streak tracking
- Dashboard & stats
- Manual flashcard creation

## TODO / Roadmap

- [ ] Levels and progression based on XP
- [ ] Achievements and badges (streaks, milestones)
- [ ] Daily challenges with bonus XP
- [ ] Edit existing flashcards
- [ ] Add personal notes to flashcards
- [ ] Type-in answer mode
