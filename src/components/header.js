import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { getUserProgress } from '../db/queries.js';
import { calculateLevel, getLevelTitle } from '../engine/xp.js';

export default function Header() {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    getUserProgress().then(setProgress).catch(console.error);
  }, []);

  if (!progress) return null;

  const levelInfo = calculateLevel(progress.total_xp);
  const title = getLevelTitle(levelInfo.level);
  const barWidth = 20;
  const filled = Math.round((levelInfo.currentXp / levelInfo.xpToNext) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="blue" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="cyan">Study Terminal</Text>
        <Text><Text color="yellow">Lv.{levelInfo.level}</Text><Text color="gray"> {title}</Text></Text>
      </Box>
      <Box justifyContent="space-between">
        <Text><Text color="green">XP: {levelInfo.currentXp}/{levelInfo.xpToNext}</Text><Text color="gray"> {bar}</Text></Text>
        <Text color="red">Streak: {progress.current_streak} day{progress.current_streak !== 1 ? 's' : ''}</Text>
      </Box>
    </Box>
  );
}
