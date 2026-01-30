import { getDb } from './connection.js';

// === Decks ===

export function createDeck(name, sourcePdf, topic) {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO decks (name, source_pdf, topic) VALUES (?, ?, ?)'
  ).run(name, sourcePdf, topic);
  return result.lastInsertRowid;
}

export function getAllDecks() {
  const db = getDb();
  return db.prepare('SELECT * FROM decks ORDER BY created_at DESC').all();
}

export function getDeck(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM decks WHERE id = ?').get(id);
}

export function deleteDeck(id) {
  const db = getDb();
  db.prepare('DELETE FROM cards WHERE deck_id = ?').run(id);
  db.prepare('DELETE FROM decks WHERE id = ?').run(id);
}

export function updateDeckCardCount(deckId) {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM cards WHERE deck_id = ?').get(deckId).c;
  db.prepare('UPDATE decks SET card_count = ? WHERE id = ?').run(count, deckId);
}

// === Cards ===

export function createCard(deckId, type, front, back, opts = {}) {
  const db = getDb();
  const { choices, correctChoice, tags, difficultyTier } = opts;
  const result = db.prepare(`
    INSERT INTO cards (deck_id, type, front, back, choices, correct_choice, tags, difficulty_tier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    deckId, type, front, back,
    choices ? JSON.stringify(choices) : null,
    correctChoice ?? null,
    tags ? JSON.stringify(tags) : null,
    difficultyTier || 'medium'
  );
  return result.lastInsertRowid;
}

export function getCardsByDeck(deckId) {
  const db = getDb();
  return db.prepare('SELECT * FROM cards WHERE deck_id = ? ORDER BY id').all(deckId);
}

export function getDueCards(limit = 20) {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT c.*, d.name as deck_name
    FROM cards c
    JOIN decks d ON c.deck_id = d.id
    WHERE c.next_review <= ?
    ORDER BY c.next_review ASC, c.ease_factor ASC
    LIMIT ?
  `).all(today, limit);
}

export function getDueCardCount() {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  return db.prepare('SELECT COUNT(*) as c FROM cards WHERE next_review <= ?').get(today).c;
}

export function getCardById(cardId) {
  const db = getDb();
  return db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId);
}

export function updateCardSchedule(cardId, repetitions, easeFactor, interval, nextReview) {
  const db = getDb();
  db.prepare(`
    UPDATE cards SET
      repetitions = ?, ease_factor = ?, interval = ?, next_review = ?,
      times_reviewed = times_reviewed + 1
    WHERE id = ?
  `).run(repetitions, easeFactor, interval, nextReview, cardId);
}

export function markCardCorrect(cardId) {
  const db = getDb();
  db.prepare('UPDATE cards SET times_correct = times_correct + 1 WHERE id = ?').run(cardId);
}

export function getMcqCards(deckId, limit = 10) {
  const db = getDb();
  if (deckId) {
    return db.prepare(`
      SELECT c.*, d.name as deck_name FROM cards c
      JOIN decks d ON c.deck_id = d.id
      WHERE c.type = 'mcq' AND c.deck_id = ?
      ORDER BY RANDOM() LIMIT ?
    `).all(deckId, limit);
  }
  return db.prepare(`
    SELECT c.*, d.name as deck_name FROM cards c
    JOIN decks d ON c.deck_id = d.id
    WHERE c.type = 'mcq'
    ORDER BY RANDOM() LIMIT ?
  `).all(limit);
}

export function getTotalCardCount() {
  const db = getDb();
  return db.prepare('SELECT COUNT(*) as c FROM cards').get().c;
}

export function getMasteredCardCount() {
  const db = getDb();
  return db.prepare('SELECT COUNT(*) as c FROM cards WHERE interval >= 21').get().c;
}

// === Review Logs ===

export function insertReviewLog(cardId, quality, efBefore, efAfter, intBefore, intAfter) {
  const db = getDb();
  db.prepare(`
    INSERT INTO review_logs (card_id, quality, ease_factor_before, ease_factor_after,
      interval_before, interval_after)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(cardId, quality, efBefore, efAfter, intBefore, intAfter);
}

// === User Progress ===

export function getUserProgress() {
  const db = getDb();
  return db.prepare('SELECT * FROM user_progress WHERE id = 1').get();
}

export function addXp(amount) {
  const db = getDb();
  db.prepare('UPDATE user_progress SET total_xp = total_xp + ? WHERE id = 1').run(amount);
}

export function incrementReviewCount(count = 1) {
  const db = getDb();
  db.prepare('UPDATE user_progress SET total_cards_reviewed = total_cards_reviewed + ? WHERE id = 1').run(count);
}

export function incrementSessionCount() {
  const db = getDb();
  db.prepare('UPDATE user_progress SET total_sessions = total_sessions + 1 WHERE id = 1').run();
}

export function updateStreak() {
  const db = getDb();
  const progress = getUserProgress();
  const today = new Date().toISOString().split('T')[0];

  if (progress.last_study_date === today) return progress.current_streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak;
  if (progress.last_study_date === yesterdayStr) {
    newStreak = progress.current_streak + 1;
  } else {
    newStreak = 1;
  }

  const longestStreak = Math.max(newStreak, progress.longest_streak);

  db.prepare(`
    UPDATE user_progress SET
      current_streak = ?, longest_streak = ?, last_study_date = ?
    WHERE id = 1
  `).run(newStreak, longestStreak, today);

  return newStreak;
}

export function getUpcomingReviewCounts() {
  const db = getDb();
  const today = new Date();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const tomorrowCount = db.prepare(
    'SELECT COUNT(*) as c FROM cards WHERE next_review = ?'
  ).get(tomorrowStr).c;

  const weekCount = db.prepare(
    'SELECT COUNT(*) as c FROM cards WHERE next_review > ? AND next_review <= ?'
  ).get(todayStr, weekEndStr).c;

  return { tomorrow: tomorrowCount, thisWeek: weekCount };
}
