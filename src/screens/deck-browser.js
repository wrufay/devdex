import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { getAllDecks, deleteDeck, getCardsByDeck } from '../db/queries.js';

export default function DeckBrowser({ onBack }) {
  const [decks, setDecks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [deckCards, setDeckCards] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    getAllDecks().then(d => { setDecks(d); setLoaded(true); });
  }, []);

  useEffect(() => {
    if (selectedDeck) {
      getCardsByDeck(selectedDeck.id).then(setDeckCards);
    }
  }, [selectedDeck]);

  useInput((input, key) => {
    if (key.escape) {
      if (confirmDelete) { setConfirmDelete(false); return; }
      if (selectedDeck) { setSelectedDeck(null); return; }
      onBack();
    }
    if (confirmDelete && input === 'y') {
      deleteDeck(selectedDeck.id).then(() => getAllDecks()).then(d => {
        setDecks(d);
        setSelectedDeck(null);
        setConfirmDelete(false);
      }).catch(console.error);
    }
    if (confirmDelete && input === 'n') setConfirmDelete(false);
  });

  if (!loaded) return <Box paddingX={1}><Text>Loading decks...</Text></Box>;

  if (decks.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box borderStyle="single" borderColor="yellow" paddingX={1} marginBottom={1}>
          <Text bold color="yellow">Deck Browser</Text>
        </Box>
        <Text>No decks yet. Create a flashcard to get started!</Text>
        <Box marginTop={1}><Text color="gray">Press ESC to go back</Text></Box>
      </Box>
    );
  }

  if (selectedDeck) {
    const flashcards = deckCards.filter(c => c.type === 'flashcard').length;
    const mcqs = deckCards.filter(c => c.type === 'mcq').length;
    const elab = deckCards.filter(c => c.type === 'elaboration').length;
    const mastered = deckCards.filter(c => c.interval >= 21).length;

    if (confirmDelete) {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text color="red" bold>Delete "{selectedDeck.name}"?</Text>
          <Text>This will remove all {deckCards.length} cards permanently.</Text>
          <Box marginTop={1}>
            <Text>Press <Text bold color="red">y</Text> to confirm, <Text bold>n</Text> to cancel</Text>
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" paddingX={1}>
        <Box borderStyle="single" borderColor="cyan" paddingX={1} marginBottom={1}>
          <Text bold color="cyan">{selectedDeck.name}</Text>
        </Box>
        <Text>Created: <Text color="gray">{selectedDeck.created_at}</Text></Text>
        <Box marginTop={1} flexDirection="column">
          <Text>Total cards: <Text bold>{deckCards.length}</Text></Text>
          <Text color="cyan">  Flashcards: {flashcards}</Text>
          <Text color="magenta">  MCQ: {mcqs}</Text>
          <Text color="yellow">  Deep Questions: {elab}</Text>
          <Text color="green">  Mastered: {mastered}/{deckCards.length}</Text>
        </Box>
        <Box marginTop={1}>
          <SelectInput
            items={[{ label: 'Delete Deck', value: 'delete' }, { label: 'Back', value: 'back' }]}
            onSelect={(item) => {
              if (item.value === 'delete') setConfirmDelete(true);
              if (item.value === 'back') setSelectedDeck(null);
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="single" borderColor="cyan" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">Deck Browser</Text>
      </Box>
      <SelectInput
        items={decks.map(d => ({ label: `${d.name} (${d.card_count} cards)`, value: d }))}
        onSelect={(item) => setSelectedDeck(item.value)}
      />
      <Box marginTop={1}><Text color="gray">Press ESC to go back</Text></Box>
    </Box>
  );
}
