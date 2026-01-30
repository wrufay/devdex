import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Header from '../components/header.js';
import { getDueCards, processReview } from '../engine/scheduler.js';
import { updateStreak, incrementSessionCount } from '../db/queries.js';

export default function StudySession({ onBack }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const due = getDueCards(30);
    setCards(due);
    setLoaded(true);
    if (due.length > 0) {
      updateStreak();
    }
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }

    if (done) {
      if (key.return) onBack();
      return;
    }

    if (cards.length === 0) {
      if (key.return) onBack();
      return;
    }

    if (!showAnswer) {
      if (key.return || input === ' ') {
        setShowAnswer(true);
      }
      return;
    }

    // Rating: 1-5
    const rating = parseInt(input);
    if (rating >= 1 && rating <= 5) {
      const card = cards[currentIndex];
      const { xpEarned } = processReview(card.id, rating);
      setSessionXp(prev => prev + xpEarned);
      if (rating >= 3) setSessionCorrect(prev => prev + 1);

      if (currentIndex + 1 >= cards.length) {
        incrementSessionCount();
        setDone(true);
      } else {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      }
    }
  });

  if (!loaded) {
    return (
      <Box paddingX={1}>
        <Text>Loading cards...</Text>
      </Box>
    );
  }

  if (cards.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box borderStyle="single" borderColor="green" paddingX={1} marginBottom={1}>
          <Text bold color="green">No cards due!</Text>
        </Box>
        <Text>You're all caught up. Come back later for more reviews.</Text>
        <Box marginTop={1}>
          <Text color="gray">Press Enter to go back</Text>
        </Box>
      </Box>
    );
  }

  if (done) {
    const accuracy = cards.length > 0 ? Math.round((sessionCorrect / cards.length) * 100) : 0;
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box borderStyle="double" borderColor="green" paddingX={1} marginBottom={1}>
          <Text bold color="green">Session Complete!</Text>
        </Box>
        <Text>Cards reviewed: <Text bold>{cards.length}</Text></Text>
        <Text>Correct: <Text bold color="green">{sessionCorrect}/{cards.length}</Text> ({accuracy}%)</Text>
        <Text>XP earned: <Text bold color="yellow">+{sessionXp}</Text></Text>
        <Box marginTop={1}>
          <Text color="gray">Press Enter to continue</Text>
        </Box>
      </Box>
    );
  }

  const card = cards[currentIndex];
  const cardType = card.type === 'elaboration' ? 'Deep Think' : 'Flashcard';

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="single" borderColor="blue" paddingX={1} justifyContent="space-between">
        <Text bold color="cyan">{card.deck_name}</Text>
        <Text color="gray">[{currentIndex + 1}/{cards.length}] {cardType}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="white">{card.front}</Text>
      </Box>

      {!showAnswer && (
        <Box marginTop={1}>
          <Text color="gray">Press Space or Enter to reveal answer</Text>
        </Box>
      )}

      {showAnswer && (
        <Box marginTop={1} flexDirection="column">
          <Box borderStyle="single" borderColor="green" paddingX={1}>
            <Text color="green">{card.back}</Text>
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text bold>How well did you know this?</Text>
            <Box marginTop={0}>
              <Text color="red">1:Again </Text>
              <Text color="yellow">2:Hard </Text>
              <Text color="white">3:Good </Text>
              <Text color="green">4:Easy </Text>
              <Text color="cyan">5:Perfect</Text>
            </Box>
          </Box>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray" dimColor>XP: +{sessionXp} this session | ESC to quit</Text>
      </Box>
    </Box>
  );
}
