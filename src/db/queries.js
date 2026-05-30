import { supabase } from './connection.js';

// === Decks ===

export async function createDeck(name, topic) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('decks')
    .insert({ name, topic, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

export async function getAllDecks() {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDeck(id) {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDeck(id) {
  const { error } = await supabase.from('decks').delete().eq('id', id);
  if (error) throw error;
}

export async function updateDeckCardCount(deckId) {
  const { count, error } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('deck_id', deckId);
  if (error) throw error;
  await supabase.from('decks').update({ card_count: count }).eq('id', deckId);
}

// === Cards ===

export async function createCard(deckId, type, front, back, opts = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  const { choices, correctChoice, tags, difficultyTier } = opts;
  const { data, error } = await supabase
    .from('cards')
    .insert({
      deck_id: deckId,
      user_id: user.id,
      type,
      front,
      back,
      choices: choices ?? null,
      correct_choice: correctChoice ?? null,
      tags: tags ?? null,
      difficulty_tier: difficultyTier || 'medium',
    })
    .select()
    .single();
  if (error) throw error;
  await updateDeckCardCount(deckId);
  return data.id;
}

export async function getCardsByDeck(deckId) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function getDueCards(limit = 20) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('cards')
    .select('*, decks(name)')
    .lte('next_review', today)
    .order('next_review')
    .order('ease_factor')
    .limit(limit);
  if (error) throw error;
  return data.map(c => ({ ...c, deck_name: c.decks?.name }));
}

export async function getDueCardCount() {
  const today = new Date().toISOString().split('T')[0];
  const { count, error } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .lte('next_review', today);
  if (error) throw error;
  return count;
}

export async function getCardById(cardId) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateCardSchedule(cardId, repetitions, easeFactor, interval, nextReview) {
  const { data } = await supabase.from('cards').select('times_reviewed').eq('id', cardId).single();
  const { error } = await supabase
    .from('cards')
    .update({
      repetitions,
      ease_factor: easeFactor,
      interval,
      next_review: nextReview,
      times_reviewed: (data?.times_reviewed ?? 0) + 1,
    })
    .eq('id', cardId);
  if (error) throw error;
}

export async function markCardCorrect(cardId) {
  const { data } = await supabase.from('cards').select('times_correct').eq('id', cardId).single();
  await supabase.from('cards').update({ times_correct: (data?.times_correct ?? 0) + 1 }).eq('id', cardId);
}

export async function getMcqCards(deckId, limit = 10) {
  let query = supabase
    .from('cards')
    .select('*, decks(name)')
    .eq('type', 'mcq')
    .limit(limit);
  if (deckId) query = query.eq('deck_id', deckId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(c => ({ ...c, deck_name: c.decks?.name }));
}

export async function getTotalCardCount() {
  const { count, error } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count;
}

export async function getMasteredCardCount() {
  const { count, error } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .gte('interval', 21);
  if (error) throw error;
  return count;
}

// === Review Logs ===

export async function insertReviewLog(cardId, quality, efBefore, efAfter, intBefore, intAfter) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('review_logs').insert({
    card_id: cardId,
    user_id: user.id,
    quality,
    ease_factor_before: efBefore,
    ease_factor_after: efAfter,
    interval_before: intBefore,
    interval_after: intAfter,
  });
  if (error) throw error;
}

// === User Progress ===

export async function getUserProgress() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function addXp(amount) {
  const progress = await getUserProgress();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('user_progress').update({ total_xp: progress.total_xp + amount }).eq('user_id', user.id);
}

export async function incrementReviewCount(count = 1) {
  const progress = await getUserProgress();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('user_progress').update({ total_cards_reviewed: progress.total_cards_reviewed + count }).eq('user_id', user.id);
}

export async function incrementSessionCount() {
  const progress = await getUserProgress();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('user_progress').update({ total_sessions: progress.total_sessions + 1 }).eq('user_id', user.id);
}

export async function updateStreak() {
  const progress = await getUserProgress();
  const today = new Date().toISOString().split('T')[0];

  if (progress.last_study_date === today) return progress.current_streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const newStreak = progress.last_study_date === yesterdayStr
    ? progress.current_streak + 1
    : 1;

  const longestStreak = Math.max(newStreak, progress.longest_streak);

  const { data: { user } } = await supabase.auth.getUser();
  await supabase
    .from('user_progress')
    .update({ current_streak: newStreak, longest_streak: longestStreak, last_study_date: today })
    .eq('user_id', user.id);

  return newStreak;
}

export async function getUpcomingReviewCounts() {
  const today = new Date();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const [{ count: tomorrowCount }, { count: weekCount }] = await Promise.all([
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('next_review', tomorrowStr),
    supabase.from('cards').select('*', { count: 'exact', head: true }).gt('next_review', todayStr).lte('next_review', weekEndStr),
  ]);

  return { tomorrow: tomorrowCount, thisWeek: weekCount };
}
