import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Header from '../components/header.js';
import { createDeck, createCard, getAllDecks, updateDeckCardCount, addXp } from '../db/queries.js';

export default function CreateCard({ onNavigate }) {
  const [step, setStep] = useState('deck-select'); // deck-select | new-deck | front | back | success
  const [deckId, setDeckId] = useState(null);
  const [newDeckName, setNewDeckName] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const decks = getAllDecks();

  if (step === 'deck-select') {
    const items = [
      ...decks.map(d => ({ label: `${d.name} (${d.card_count} cards)`, value: d.id })),
      { label: '+ Create New Deck', value: 'new' },
      { label: '← Back to Menu', value: 'back' }
    ];

    const handleSelect = (item) => {
      if (item.value === 'back') {
        onNavigate('menu');
      } else if (item.value === 'new') {
        setStep('new-deck');
      } else {
        setDeckId(item.value);
        setStep('front');
      }
    };

    return (
      <Box flexDirection="column">
        <Header />
        <Box marginTop={1} marginBottom={1} paddingX={1}>
          <Text bold color="cyan">Create a Flashcard</Text>
        </Box>
        <Box marginBottom={1} paddingX={1}>
          <Text color="gray">Select a deck or create a new one:</Text>
        </Box>
        <Box paddingX={1}>
          <SelectInput items={items} onSelect={handleSelect} />
        </Box>
      </Box>
    );
  }

  if (step === 'new-deck') {
    return (
      <Box flexDirection="column">
        <Header />
        <Box marginTop={1} marginBottom={1} paddingX={1}>
          <Text bold color="cyan">Create a New Deck</Text>
        </Box>
        <Box marginBottom={1} paddingX={1}>
          <Text color="gray">Enter deck name:</Text>
        </Box>
        <Box paddingX={1}>
          <TextInput
            value={newDeckName}
            onChange={setNewDeckName}
            onSubmit={(value) => {
              if (value.trim()) {
                const id = createDeck(value.trim(), 'manual', value.trim());
                setDeckId(id);
                setStep('front');
              }
            }}
          />
        </Box>
        <Box marginTop={1} paddingX={1}>
          <Text color="gray" dimColor>(Press Esc to go back)</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'front') {
    return (
      <Box flexDirection="column">
        <Header />
        <Box marginTop={1} marginBottom={1} paddingX={1}>
          <Text bold color="cyan">Create a Flashcard</Text>
        </Box>
        <Box marginBottom={1} paddingX={1}>
          <Text color="gray">Enter the question (front of card):</Text>
        </Box>
        <Box paddingX={1}>
          <TextInput
            value={front}
            onChange={setFront}
            onSubmit={(value) => {
              if (value.trim()) {
                setStep('back');
              }
            }}
          />
        </Box>
        <Box marginTop={1} paddingX={1}>
          <Text color="gray" dimColor>(Press Enter to continue)</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'back') {
    return (
      <Box flexDirection="column">
        <Header />
        <Box marginTop={1} marginBottom={1} paddingX={1}>
          <Text bold color="cyan">Create a Flashcard</Text>
        </Box>
        <Box marginBottom={1} paddingX={1}>
          <Text color="yellow">Question: {front}</Text>
        </Box>
        <Box marginBottom={1} paddingX={1}>
          <Text color="gray">Enter the answer (back of card):</Text>
        </Box>
        <Box paddingX={1}>
          <TextInput
            value={back}
            onChange={setBack}
            onSubmit={(value) => {
              if (value.trim()) {
                // Create the card
                createCard(deckId, 'flashcard', front.trim(), value.trim(), {
                  tags: ['manual'],
                  difficultyTier: 'medium'
                });
                updateDeckCardCount(deckId);
                addXp(5); // Small XP reward for creating a card
                setStep('success');
              }
            }}
          />
        </Box>
        <Box marginTop={1} paddingX={1}>
          <Text color="gray" dimColor>(Press Enter to save)</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'success') {
    return (
      <Box flexDirection="column">
        <Header />
        <Box marginTop={1} marginBottom={1} paddingX={1}>
          <Text bold color="green">✓ Flashcard Created!</Text>
        </Box>
        <Box marginBottom={1} paddingX={1}>
          <Text color="gray">Front: {front}</Text>
        </Box>
        <Box marginBottom={1} paddingX={1}>
          <Text color="gray">Back: {back}</Text>
        </Box>
        <Box marginTop={1} paddingX={1}>
          <Text color="cyan">+5 XP earned</Text>
        </Box>
        <Box marginTop={2} paddingX={1}>
          <SelectInput
            items={[
              { label: 'Create Another Card', value: 'again' },
              { label: 'Back to Menu', value: 'menu' }
            ]}
            onSelect={(item) => {
              if (item.value === 'again') {
                setFront('');
                setBack('');
                setStep('deck-select');
              } else {
                onNavigate('menu');
              }
            }}
          />
        </Box>
      </Box>
    );
  }

  return null;
}
