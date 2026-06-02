import { addCoins } from '../db/queries.js';

export const ACHIEVEMENTS = [
  {
    id: 'first_study',
    label: 'First Steps',
    description: 'Complete your first study session',
    coins: 10,
    check: (progress) => progress.total_sessions >= 1,
  },
  {
    id: 'study_10_cards',
    label: 'Getting Started',
    description: 'Review 10 cards total',
    coins: 5,
    check: (progress) => progress.total_cards_reviewed >= 10,
  },
  {
    id: 'study_100_cards',
    label: 'Dedicated',
    description: 'Review 100 cards total',
    coins: 20,
    check: (progress) => progress.total_cards_reviewed >= 100,
  },
  {
    id: 'streak_3',
    label: 'On a Roll',
    description: '3-day study streak',
    coins: 15,
    check: (progress) => progress.current_streak >= 3,
  },
  {
    id: 'streak_7',
    label: 'Weekly Warrior',
    description: '7-day study streak',
    coins: 25,
    check: (progress) => progress.current_streak >= 7,
  },
  {
    id: 'streak_30',
    label: 'Unstoppable',
    description: '30-day study streak',
    coins: 100,
    check: (progress) => progress.current_streak >= 30,
  },
  {
    id: 'perfect_quiz',
    label: 'Perfect Score',
    description: 'Get 100% on a quiz',
    coins: 15,
    check: (progress, meta) => meta?.perfectQuiz,
  },
  {
    id: 'cram_complete',
    label: 'Crammer',
    description: 'Complete a cram session',
    coins: 10,
    check: (progress, meta) => meta?.cramComplete,
  },
  {
    id: 'sessions_10',
    label: 'Consistent',
    description: 'Complete 10 study sessions',
    coins: 30,
    check: (progress) => progress.total_sessions >= 10,
  },
];

export async function checkAchievements(progress, meta = {}) {
  const unlocked = progress.unlocked_achievements
    ? JSON.parse(progress.unlocked_achievements)
    : [];

  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.includes(achievement.id)) continue;
    if (achievement.check(progress, meta)) {
      unlocked.push(achievement.id);
      await addCoins(achievement.coins);
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length > 0) {
    const { supabase } = await import('../db/connection.js');
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('user_progress')
      .update({ unlocked_achievements: JSON.stringify(unlocked) })
      .eq('user_id', user.id);
  }

  return newlyUnlocked;
}
