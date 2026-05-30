import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import Header from '../components/header.js';
import { getDueCardCount, getMcqCards } from '../db/queries.js';

export default function MainMenu({ onNavigate }) {
  const [dueCount, setDueCount] = useState(0);
  const [mcqCount, setMcqCount] = useState(0);

  useEffect(() => {
    Promise.all([getDueCardCount(), getMcqCards(null, 999)]).then(([due, mcqs]) => {
      setDueCount(due);
      setMcqCount(mcqs.length);
    });
  }, []);

  const items = [
    { label: `Study${dueCount > 0 ? ` (${dueCount} cards due)` : ''}`, value: 'study' },
    { label: `Quiz Mode${mcqCount > 0 ? ` (${mcqCount} questions)` : ''}`, value: 'quiz' },
    { label: 'Cram Mode', value: 'cram' },
    { label: 'Create Flashcard', value: 'create' },
    { label: 'Browse Decks', value: 'decks' },
    { label: 'Dashboard & Stats', value: 'dashboard' },
    { label: 'Quit', value: 'quit' },
  ];

  return (
    <Box flexDirection="column">
      <Header />
      <Box marginTop={1} marginBottom={1} paddingX={1}>
        <Text bold color="white">What would you like to do?</Text>
      </Box>
      <Box paddingX={1}>
        <SelectInput items={items} onSelect={(item) => onNavigate(item.value)} />
      </Box>
    </Box>
  );
}
