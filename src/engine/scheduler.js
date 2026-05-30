import { sm2 } from './sm2.js';
import { XP_VALUES } from './xp.js';
import * as queries from '../db/queries.js';

export async function getDueCards(limit = 20) {
  const cards = await queries.getDueCards(limit);
  return shuffle(cards);
}

export async function processReview(cardId, quality) {
  const card = await queries.getCardById(cardId);
  if (!card) throw new Error(`Card ${cardId} not found`);

  const result = sm2(quality, card.repetitions, card.ease_factor, card.interval);

  await Promise.all([
    queries.insertReviewLog(card.id, quality, card.ease_factor, result.easeFactor, card.interval, result.interval),
    queries.updateCardSchedule(card.id, result.repetitions, result.easeFactor, result.interval, result.nextReview),
    quality >= 3 ? queries.markCardCorrect(card.id) : Promise.resolve(),
    queries.incrementReviewCount(1),
  ]);

  let xpEarned = XP_VALUES.CARD_REVIEWED;
  if (quality >= 3) xpEarned += XP_VALUES.CARD_CORRECT;
  if (quality === 5) xpEarned += XP_VALUES.CARD_PERFECT;

  await queries.addXp(xpEarned);

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
