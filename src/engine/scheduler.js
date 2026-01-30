import { sm2 } from './sm2.js';
import { XP_VALUES } from './xp.js';
import * as queries from '../db/queries.js';

/**
 * Get cards due for review, interleaved across decks.
 */
export function getDueCards(limit = 20) {
  const cards = queries.getDueCards(limit);
  return shuffle(cards);
}

/**
 * Process a review: update SM-2 schedule, log review, award XP.
 */
export function processReview(cardId, quality) {
  const card = queries.getCardById(cardId);
  if (!card) throw new Error(`Card ${cardId} not found`);

  const result = sm2(quality, card.repetitions, card.ease_factor, card.interval);

  queries.insertReviewLog(
    card.id, quality,
    card.ease_factor, result.easeFactor,
    card.interval, result.interval
  );

  queries.updateCardSchedule(
    card.id,
    result.repetitions,
    result.easeFactor,
    result.interval,
    result.nextReview
  );

  if (quality >= 3) {
    queries.markCardCorrect(card.id);
  }

  queries.incrementReviewCount(1);

  let xpEarned = XP_VALUES.CARD_REVIEWED;
  if (quality >= 3) xpEarned += XP_VALUES.CARD_CORRECT;
  if (quality === 5) xpEarned += XP_VALUES.CARD_PERFECT;

  queries.addXp(xpEarned);

  return { result, xpEarned };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
