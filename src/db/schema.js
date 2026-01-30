import { getDb } from './connection.js';

export function initSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      source_pdf TEXT,
      topic TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      card_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('flashcard', 'mcq', 'elaboration')),
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      choices TEXT,
      correct_choice INTEGER,
      tags TEXT,
      difficulty_tier TEXT DEFAULT 'medium',
      created_at TEXT DEFAULT (datetime('now')),
      repetitions INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 0,
      next_review TEXT DEFAULT (date('now')),
      times_reviewed INTEGER DEFAULT 0,
      times_correct INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS review_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      quality INTEGER NOT NULL CHECK(quality BETWEEN 0 AND 5),
      ease_factor_before REAL,
      ease_factor_after REAL,
      interval_before INTEGER,
      interval_after INTEGER,
      reviewed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      total_xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_study_date TEXT,
      total_cards_reviewed INTEGER DEFAULT 0,
      total_sessions INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cards_next_review ON cards(next_review);
    CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
    CREATE INDEX IF NOT EXISTS idx_review_logs_card_id ON review_logs(card_id);
  `);

  const row = db.prepare('SELECT id FROM user_progress WHERE id = 1').get();
  if (!row) {
    db.prepare('INSERT INTO user_progress (id) VALUES (1)').run();
  }
}
