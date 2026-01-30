import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { getAllDecks, deleteDeck, getCardsByDeck } from '../db/queries.js';

export default function DeckBrowser({ onBack }) {
  const [decks, setDecks] = useState(getAllDecks());
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useInput((input, key) => {
    if (key.escape) {
      if (confirmDelete) {
        setConfirmDelete(false);
      } else if (selectedDeck) {
        setSelectedDeck(null);
      } else {
        onBack();
      }
    }
    if (confirmDelete && input === 'y') {
      deleteDeck(selectedDeck.id);
      setDecks(getAllDecks());
      setSelectedDeck(null);
      setConfirmDelete(false);
    }
    if (confirmDelete && input === 'n') {
      setConfirmDelete(false);
    }
  });

  if (decks.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box borderStyle="single" borderColor="yellow" paddingX={1} marginBottom={1}>
          <Text bold color="yellow">Deck Browser</Text>
        </Box>
        <Text>No decks yet. Import a PDF to create your first deck!</Text>
        <Box marginTop={1}><Text color="gray">Press ESC to go back</Text></Box>
      </Box>
    );
  }

  if (selectedDeck) {
    const cards = getCardsByDeck(selectedDeck.id);
    const flashcards = cards.filter(c => c.type === 'flashcard').length;
    const mcqs = cards.filter(c => c.type === 'mcq').length;
    const elab = cards.filter(c => c.type === 'elaboration').length;
    const mastered = cards.filter(c => c.interval >= 21).length;

    if (confirmDelete) {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text color="red" bold>Delete "{selectedDeck.name}"?</Text>
          <Text>This will remove all {cards.length} cards permanently.</Text>
          <Box marginTop={1}>
            <Text>Press <Text bold color="red">y</Text> to confirm, <Text bold>n</Text> to cancel</Text>
          </Box>
        </Box>
      );
    }

    const actions = [
      { label: 'Delete Deck', value: 'delete' },
      { label: 'Back', value: 'back' },
    ];

    return (
      <Box flexDirection="column" paddingX={1}>
        <Box borderStyle="single" borderColor="cyan" paddingX={1} marginBottom={1}>
          <Text bold color="cyan">{selectedDeck.name}</Text>
        </Box>
        <Text>Source: <Text color="gray">{selectedDeck.source_pdf || 'unknown'}</Text></Text>
        <Text>Created: <Text color="gray">{selectedDeck.created_at}</Text></Text>
        <Box marginTop={1} flexDirection="column">
          <Text>Total cards: <Text bold>{cards.length}</Text></Text>
          <Text color="cyan">  Flashcards: {flashcards}</Text>
          <Text color="magenta">  MCQ: {mcqs}</Text>
          <Text color="yellow">  Deep Questions: {elab}</Text>
          <Text color="green">  Mastered: {mastered}/{cards.length}</Text>
        </Box>
        <Box marginTop={1}>
          <SelectInput
            items={actions}
            onSelect={(item) => {
              if (item.value === 'delete') setConfirmDelete(true);
              if (item.value === 'back') setSelectedDeck(null);
            }}
          />
        </Box>
      </Box>
    );
  }

  const items = decks.map(d => ({
    label: `${d.name} (${d.card_count} cards)`,
    value: d,
  }));

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="single" borderColor="cyan" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">Deck Browser</Text>
      </Box>
      <SelectInput
        items={items}
        onSelect={(item) => setSelectedDeck(item.value)}
      />
      <Box marginTop={1}><Text color="gray">Press ESC to go back</Text></Box>
    </Box>
  );
}
