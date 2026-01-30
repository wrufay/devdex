export const FLASHCARD_GENERATION_PROMPT = `You are an expert CS tutor creating study materials from a CS136 lecture PDF.

Analyze this PDF and generate study materials. Return ONLY valid JSON with this exact structure:

{
  "topic": "Main topic of this lecture section",
  "flashcards": [
    {
      "front": "Clear, specific question testing one concept",
      "back": "Concis2e but complete answer",
      "tags": ["tag1", "tag2"],
      "difficulty": "easy"
    }
  ],
  "mcq": [
    {
      "question": "Question text",
      "choices": ["A) option", "B) option", "C) option", "D) option"],
      "correct": 0,
      "explanation": "Why the correct answer is right",
      "tags": ["tag1"],
      "difficulty": "medium"
    }
  ],
  "elaboration_questions": [
    {
      "front": "A 'why' or 'how' question requiring deeper thinking",
      "back": "Detailed explanation connecting multiple concepts",
      "tags": ["tag1"],
      "difficulty": "hard"
    }
  ]
}

Guidelines:
- Generate 15-25 flashcards covering ALL key concepts
- Generate 8-12 multiple choice questions
- Generate 5-8 elaboration/why questions for deeper understanding
- For code examples: create "What does this output?" and "What error does this have?" cards
- Make wrong MCQ choices plausible (common student misconceptions)
- Tag each card with relevant subtopics
- Difficulty mix: ~30% easy, ~50% medium, ~20% hard
- For C/pointer content: focus on memory layout, dereferencing, address-of, aliasing, NULL, const, function pointers
- Include code snippets in questions where relevant

Return ONLY the JSON. No markdown fences, no extra text.`;
