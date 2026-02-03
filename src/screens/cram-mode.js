import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import Header from '../components/header.js';
import { getAllDecks, getCardsByDeck } from '../db/queries.js';

export default function CramMode({ onBack }) {
  const [step, setStep] = useState('deck-select'); // deck-select | cramming | complete
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [incorrectCards, setIncorrectCards] = useState([]);
  const [round, setRound] = useState(1);
  const [totalReviewed, setTotalReviewed] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);

  const decks = getAllDecks();

  useInput((input, key) => {
    if (step === 'cramming' && !showAnswer && key.return) {
      setShowAnswer(true);
    }
  });

  if (step === 'deck-select') {
    if (decks.length === 0) {
      return (
        <Box flexDirection="column">
          <Header />
          <Box marginTop={1} paddingX={1}>
            <Text color="red">No decks found. Import a PDF or create cards first.</Text>
          </Box>
          <Box marginTop={2} paddingX={1}>
            <SelectInput
              items={[{ label: '← Back to Menu', value: 'back' }]}
              onSelect={() => onBack()}
            />
          </Box>
        </Box>
      );
    }

    const items = [
      ...decks.map(d => ({
        label: `${d.name} (${d.card_count} cards)`,
        value: d.id
      })),
      { label: '← Back to Menu', value: 'back' }
    ];

    return (
      <Box flexDirection="column">
        <Header />
        <Box marginTop={1} marginBottom={1} paddingX={1}>
          <Text bold color="magenta">Cram Mode - Select a Deck</Text>
        </Box>
        <Box marginBottom={1} paddingX={1}>
          <Text color="gray">Study all cards until you know them all!</Text>
        </Box>
        <Box paddingX={1}>
          <SelectInput
            items={items}
            onSelect={(item) => {
              if (item.value === 'back') {
                onBack();
              } else {
                const deck = decks.find(d => d.id === item.value);
                setSelectedDeck(deck);
                const allCards = getCardsByDeck(item.value).filter(c => c.type !== 'mcq');
                if (allCards.length === 0) {
                  onBack();
                  return;
                }
                // Shuffle cards
                const shuffled = allCards.sort(() => Math.random() - 0.5);
                setCards(shuffled);
                setStep('cramming');
              }
            }}
          />
        </Box>
      </Box>
    );
  }

  if (step === 'cramming') {
    if (currentCardIndex >= cards.length) {
      // Round complete
      if (incorrectCards.length === 0) {
        // All cards mastered!
        setStep('complete');
        return null;
      } else {
        // Start new round with incorrect cards
        const shuffled = incorrectCards.sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setIncorrectCards([]);
        setCurrentCardIndex(0);
        setShowAnswer(false);
        setRound(round + 1);
        return null;
      }
    }

    const card = cards[currentCardIndex];

    if (!showAnswer) {
      return (
        <Box flexDirection="column">
          <Header />
          <Box marginTop={1} paddingX={1}>
            <Text>
              <Text color="magenta" bold>Cram Mode</Text>
              <Text color="gray"> - {selectedDeck.name}</Text>
            </Text>
          </Box>
          <Box paddingX={1}>
            <Text color="gray">
              Round {round} • Card {currentCardIndex + 1}/{cards.length}
              {incorrectCards.length > 0 && <Text> • {incorrectCards.length} to review</Text>}
            </Text>
          </Box>
          <Box marginTop={2} paddingX={2} borderStyle="round" borderColor="cyan">
            <Text wrap="wrap">{card.front}</Text>
          </Box>
          <Box marginTop={2} paddingX={1}>
            <Text color="gray" dimColor>(Press Enter to reveal answer)</Text>
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Header />
        <Box marginTop={1} paddingX={1}>
          <Text>
            <Text color="magenta" bold>Cram Mode</Text>
            <Text color="gray"> - {selectedDeck.name}</Text>
          </Text>
        </Box>
        <Box paddingX={1}>
          <Text color="gray">
            Round {round} • Card {currentCardIndex + 1}/{cards.length}
            {incorrectCards.length > 0 && <Text> • {incorrectCards.length + 1} to review</Text>}
          </Text>
        </Box>
        <Box marginTop={1} paddingX={2} borderStyle="round" borderColor="cyan">
          <Text wrap="wrap" color="cyan">{card.front}</Text>
        </Box>
        <Box marginTop={1} paddingX={2} borderStyle="round" borderColor="green">
          <Text wrap="wrap" color="green">{card.back}</Text>
        </Box>
        <Box marginTop={2} paddingX={1}>
          <SelectInput
            items={[
              { label: '✓ I know this', value: 'correct' },
              { label: '✗ Review again', value: 'incorrect' }
            ]}
            onSelect={(item) => {
              setTotalReviewed(totalReviewed + 1);
              if (item.value === 'correct') {
                if (round === 1) {
                  setFirstTryCorrect(firstTryCorrect + 1);
                }
              } else {
                setIncorrectCards([...incorrectCards, card]);
              }
              setCurrentCardIndex(currentCardIndex + 1);
              setShowAnswer(false);
            }}
          />
        </Box>
      </Box>
    );
  }

  if (step === 'complete') {
    const accuracy = totalReviewed > 0 ? Math.round((firstTryCorrect / cards.length) * 100) : 0;

    return (
      <Box flexDirection="column">
        <Header />
        <Box marginTop={1} marginBottom={1} paddingX={1}>
          <Text bold color="green">🎉 Cram Session Complete!</Text>
        </Box>
        <Box marginBottom={1} paddingX={1}>
          <Text color="cyan">Deck: {selectedDeck.name}</Text>
        </Box>
        <Box marginBottom={1} paddingX={1}>
          <Text>Total cards: {cards.length}</Text>
        </Box>
        <Box marginBottom={1} paddingX={1}>
          <Text>Rounds needed: {round}</Text>
        </Box>
        <Box marginBottom={1} paddingX={1}>
          <Text>First-try accuracy: {accuracy}%</Text>
        </Box>
        <Box marginTop={2} paddingX={1}>
          <SelectInput
            items={[
              { label: 'Cram Another Deck', value: 'again' },
              { label: 'Back to Menu', value: 'menu' }
            ]}
            onSelect={(item) => {
              if (item.value === 'again') {
                setStep('deck-select');
                setCards([]);
                setCurrentCardIndex(0);
                setShowAnswer(false);
                setIncorrectCards([]);
                setRound(1);
                setTotalReviewed(0);
                setFirstTryCorrect(0);
                setSelectedDeck(null);
              } else {
                onBack();
              }
            }}
          />
        </Box>
      </Box>
    );
  }

  return null;
}
