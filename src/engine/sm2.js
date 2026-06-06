// SM-2 spaced repetition algorithm.
// Given a card's current state and a review quality (0-5), returns the new
// scheduling state: { repetitions, easeFactor, interval, nextReview }.
//
// Quality scale (what we expose in the UI):
//   0 = Again (forgot)   -> resets the card
//   3 = Hard
//   4 = Good
//   5 = Easy

const MIN_EASE = 1.3;

export function schedule(card, quality) {
  let { repetitions, ease_factor: easeFactor, interval } = card;

  if (quality < 3) {
    // Failed recall: reset repetitions, review again tomorrow.
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Adjust ease factor based on quality (clamped to a sane minimum).
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < MIN_EASE) easeFactor = MIN_EASE;

  const next = new Date();
  next.setDate(next.getDate() + interval);
  const nextReview = next.toISOString().slice(0, 10); // YYYY-MM-DD

  return { repetitions, easeFactor, interval, nextReview };
}
