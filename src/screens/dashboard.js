import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import {
  getUserProgress, getDueCardCount, getTotalCardCount,
  getMasteredCardCount, getUpcomingReviewCounts, getAllDecks,
} from '../db/queries.js';
import { calculateLevel, getLevelTitle } from '../engine/xp.js';

export default function Dashboard({ onBack }) {
  const [data, setData] = useState(null);

  useInput((_input, key) => {
    if (key.escape || key.return) onBack();
  });

  useEffect(() => {
    const load = async () => {
      const [progress, dueCount, totalCards, mastered, upcoming, decks] = await Promise.all([
        getUserProgress(),
        getDueCardCount(),
        getTotalCardCount(),
        getMasteredCardCount(),
        getUpcomingReviewCounts(),
        getAllDecks(),
      ]);
      setData({ progress, dueCount, totalCards, mastered, upcoming, decks });
    };
    load();
  }, []);

  if (!data) return <Box paddingX={1}><Text>Loading...</Text></Box>;

  const { progress, dueCount, totalCards, mastered, upcoming, decks } = data;
  const levelInfo = calculateLevel(progress.total_xp);
  const title = getLevelTitle(levelInfo.level);
  const barWidth = 25;
  const filled = Math.round((levelInfo.currentXp / levelInfo.xpToNext) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
  const accuracy = totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="double" borderColor="blue" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">Dashboard & Stats</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text><Text bold color="yellow">Level {levelInfo.level}</Text><Text color="gray"> - {title}</Text></Text>
        <Text><Text color="green">{bar}</Text><Text color="gray"> {levelInfo.currentXp}/{levelInfo.xpToNext} XP</Text></Text>
        <Text>
          <Text color="red">Streak: {progress.current_streak} day{progress.current_streak !== 1 ? 's' : ''}</Text>
          <Text color="gray">  (Best: {progress.longest_streak})</Text>
        </Text>
      </Box>

      <Box borderStyle="single" borderColor="green" paddingX={1} flexDirection="column" marginBottom={1}>
        <Text bold color="green">Today</Text>
        <Text>Cards due: <Text bold>{dueCount}</Text></Text>
        <Text>Total XP: <Text bold color="yellow">{progress.total_xp}</Text></Text>
      </Box>

      <Box borderStyle="single" borderColor="cyan" paddingX={1} flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">All Time</Text>
        <Text>Total reviews: <Text bold>{progress.total_cards_reviewed}</Text></Text>
        <Text>Sessions: <Text bold>{progress.total_sessions}</Text></Text>
        <Text>Cards mastered: <Text bold color="green">{mastered}/{totalCards}</Text> {totalCards > 0 ? `(${accuracy}%)` : ''}</Text>
        <Text>Decks: <Text bold>{decks.length}</Text></Text>
      </Box>

      <Box borderStyle="single" borderColor="yellow" paddingX={1} flexDirection="column" marginBottom={1}>
        <Text bold color="yellow">Upcoming Reviews</Text>
        <Text>Tomorrow: <Text bold>{upcoming.tomorrow}</Text> cards</Text>
        <Text>This week: <Text bold>{upcoming.thisWeek}</Text> cards</Text>
      </Box>

      <Text color="gray">Press Enter or ESC to go back</Text>
    </Box>
  );
}
