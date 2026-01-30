export function parseClaudeResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  const data = JSON.parse(cleaned);

  if (!data.topic || typeof data.topic !== 'string') {
    throw new Error('Missing or invalid "topic" field');
  }

  const flashcards = (data.flashcards || []).map(validateFlashcard);
  const mcq = (data.mcq || []).map(validateMcq);
  const elaboration = (data.elaboration_questions || []).map(validateFlashcard);

  return { topic: data.topic, flashcards, mcq, elaboration };
}

function validateFlashcard(card) {
  if (!card.front || !card.back) {
    throw new Error('Flashcard missing front or back');
  }
  return {
    front: String(card.front),
    back: String(card.back),
    tags: Array.isArray(card.tags) ? card.tags : [],
    difficulty: card.difficulty || 'medium',
  };
}

function validateMcq(card) {
  if (!card.question || !Array.isArray(card.choices) || card.choices.length < 2) {
    throw new Error('MCQ missing question or choices');
  }
  if (typeof card.correct !== 'number') {
    throw new Error('MCQ missing correct answer index');
  }
  return {
    question: String(card.question),
    choices: card.choices.map(String),
    correct: card.correct,
    explanation: card.explanation || '',
    tags: Array.isArray(card.tags) ? card.tags : [],
    difficulty: card.difficulty || 'medium',
  };
}
