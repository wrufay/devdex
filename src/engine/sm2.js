/**
 * SM-2 Spaced Repetition Algorithm
 * Based on Piotr Wozniak's SuperMemo 2 algorithm.
 *
 * Quality ratings:
 *   0 - Complete blackout
 *   1 - Incorrect, but recognized answer
 *   2 - Incorrect, but easy to recall once shown
 *   3 - Correct with serious difficulty
 *   4 - Correct with some hesitation
 *   5 - Perfect recall
 */
export function sm2(quality, repetitions, easeFactor, interval) {
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval;
  let newReps;

  if (quality >= 3) {
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
    newReps = repetitions + 1;
  } else {
    newReps = 0;
    newInterval = 1;
    newEF = easeFactor;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);
  const nextReviewStr = nextReview.toISOString().split('T')[0];

  return {
    repetitions: newReps,
    easeFactor: Math.round(newEF * 100) / 100,
    interval: newInterval,
    nextReview: nextReviewStr,
  };
}
