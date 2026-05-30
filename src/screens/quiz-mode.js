import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { getMcqCards, addXp, updateStreak, incrementSessionCount } from '../db/queries.js';
import { XP_VALUES } from '../engine/xp.js';

export default function QuizMode({ onBack }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [done, setDone] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const mcqs = await getMcqCards(null, 10);
      setQuestions(mcqs);
      setLoaded(true);
      if (mcqs.length > 0) updateStreak().catch(console.error);
    };
    load();
  }, []);

  useInput((input, key) => {
    if (key.escape) { onBack(); return; }
    if (done && key.return) { onBack(); return; }
    if (answered && key.return) {
      if (currentIndex + 1 >= questions.length) {
        incrementSessionCount().catch(console.error);
        if (score + (selectedAnswer === questions[currentIndex].correct_choice ? 1 : 0) === questions.length) {
          addXp(XP_VALUES.QUIZ_PERFECT_SCORE).catch(console.error);
          setXpEarned(prev => prev + XP_VALUES.QUIZ_PERFECT_SCORE);
        }
        setDone(true);
      } else {
        setCurrentIndex(prev => prev + 1);
        setAnswered(false);
        setSelectedAnswer(null);
      }
    }
  });

  if (!loaded) return <Box paddingX={1}><Text>Loading quiz...</Text></Box>;

  if (questions.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box borderStyle="single" borderColor="yellow" paddingX={1} marginBottom={1}>
          <Text bold color="yellow">No Quiz Questions</Text>
        </Box>
        <Text>Create some MCQ cards first.</Text>
        <Box marginTop={1}><Text color="gray">Press ESC to go back</Text></Box>
      </Box>
    );
  }

  if (done) {
    const accuracy = Math.round((score / questions.length) * 100);
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box borderStyle="double" borderColor="green" paddingX={1} marginBottom={1}>
          <Text bold color="green">Quiz Complete!</Text>
        </Box>
        <Text>Score: <Text bold color="green">{score}/{questions.length}</Text> ({accuracy}%)</Text>
        <Text>XP earned: <Text bold color="yellow">+{xpEarned}</Text></Text>
        {score === questions.length && (
          <Text color="magenta" bold>Perfect score bonus! +{XP_VALUES.QUIZ_PERFECT_SCORE} XP</Text>
        )}
        <Box marginTop={1}><Text color="gray">Press Enter to continue</Text></Box>
      </Box>
    );
  }

  const q = questions[currentIndex];
  const choices = Array.isArray(q.choices) ? q.choices : JSON.parse(q.choices || '[]');

  if (!answered) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box borderStyle="single" borderColor="magenta" paddingX={1} justifyContent="space-between">
          <Text bold color="magenta">Quiz</Text>
          <Text color="gray">Q{currentIndex + 1}/{questions.length} | Score: {score}</Text>
        </Box>
        <Box marginTop={1}><Text bold color="white">{q.front}</Text></Box>
        <Box marginTop={1}>
          <SelectInput
            items={choices.map((choice, i) => ({ label: choice, value: i }))}
            onSelect={(item) => {
              setSelectedAnswer(item.value);
              if (item.value === q.correct_choice) {
                setScore(prev => prev + 1);
                addXp(XP_VALUES.QUIZ_CORRECT).catch(console.error);
                setXpEarned(prev => prev + XP_VALUES.QUIZ_CORRECT);
              }
              setAnswered(true);
            }}
          />
        </Box>
      </Box>
    );
  }

  const isCorrect = selectedAnswer === q.correct_choice;
  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="single" borderColor="magenta" paddingX={1} justifyContent="space-between">
        <Text bold color="magenta">Quiz</Text>
        <Text color="gray">Q{currentIndex + 1}/{questions.length} | Score: {score}</Text>
      </Box>
      <Box marginTop={1}><Text bold>{q.front}</Text></Box>
      <Box marginTop={1}>
        {isCorrect
          ? <Text color="green" bold>Correct! +{XP_VALUES.QUIZ_CORRECT} XP</Text>
          : <Box flexDirection="column">
              <Text color="red" bold>Incorrect</Text>
              <Text color="green">Correct answer: {choices[q.correct_choice]}</Text>
            </Box>
        }
      </Box>
      {q.back && (
        <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
          <Text color="gray">{q.back}</Text>
        </Box>
      )}
      <Box marginTop={1}><Text color="gray">Press Enter to continue</Text></Box>
    </Box>
  );
}
