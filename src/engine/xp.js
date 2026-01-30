export const XP_VALUES = {
  CARD_REVIEWED: 10,
  CARD_CORRECT: 5,
  CARD_PERFECT: 10,
  QUIZ_CORRECT: 15,
  QUIZ_PERFECT_SCORE: 50,
  STREAK_DAY: 25,
  STREAK_MILESTONE_7: 100,
  STREAK_MILESTONE_30: 500,
  PDF_IMPORTED: 50,
};

export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function calculateLevel(totalXp) {
  let level = 1;
  let xpAccumulated = 0;

  while (true) {
    const needed = xpForLevel(level + 1);
    if (xpAccumulated + needed > totalXp) break;
    xpAccumulated += needed;
    level++;
  }

  return {
    level,
    currentXp: totalXp - xpAccumulated,
    xpToNext: xpForLevel(level + 1),
    totalXp,
  };
}

export function getLevelTitle(level) {
  if (level <= 2) return 'Beginner';
  if (level <= 5) return 'Apprentice';
  if (level <= 10) return 'Scholar';
  if (level <= 15) return 'Expert';
  if (level <= 20) return 'Master';
  if (level <= 30) return 'Grandmaster';
  return 'Legend';
}
