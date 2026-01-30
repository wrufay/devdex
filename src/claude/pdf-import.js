import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getClient } from './client.js';
import { FLASHCARD_GENERATION_PROMPT } from './prompts.js';
import { parseClaudeResponse } from './parser.js';
import * as queries from '../db/queries.js';
import { XP_VALUES } from '../engine/xp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function importPdf(pdfPath, onProgress = () => {}) {
  const resolvedPath = path.resolve(pdfPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  if (!resolvedPath.toLowerCase().endsWith('.pdf')) {
    throw new Error('File must be a PDF');
  }

  onProgress('Reading PDF...');
  const pdfBuffer = fs.readFileSync(resolvedPath);
  const pdfBase64 = pdfBuffer.toString('base64');
  const fileName = path.basename(resolvedPath);

  const pdfDir = path.join(__dirname, '..', '..', 'pdfs');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  const destPath = path.join(pdfDir, fileName);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(resolvedPath, destPath);
  }

  onProgress('Sending to Claude AI for analysis...');
  const client = getClient();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBase64,
          },
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: FLASHCARD_GENERATION_PROMPT,
        },
      ],
    }],
  });

  onProgress('Parsing generated content...');
  const content = response.content[0].text;
  const parsed = parseClaudeResponse(content);

  onProgress('Saving to database...');
  const deckId = queries.createDeck(parsed.topic, fileName, parsed.topic);

  for (const card of parsed.flashcards) {
    queries.createCard(deckId, 'flashcard', card.front, card.back, {
      tags: card.tags,
      difficultyTier: card.difficulty,
    });
  }

  for (const card of parsed.mcq) {
    queries.createCard(deckId, 'mcq', card.question, card.explanation, {
      choices: card.choices,
      correctChoice: card.correct,
      tags: card.tags,
      difficultyTier: card.difficulty,
    });
  }

  for (const card of parsed.elaboration) {
    queries.createCard(deckId, 'elaboration', card.front, card.back, {
      tags: card.tags,
      difficultyTier: card.difficulty,
    });
  }

  queries.updateDeckCardCount(deckId);
  queries.addXp(XP_VALUES.PDF_IMPORTED);

  const counts = {
    flashcards: parsed.flashcards.length,
    mcq: parsed.mcq.length,
    elaboration: parsed.elaboration.length,
    total: parsed.flashcards.length + parsed.mcq.length + parsed.elaboration.length,
  };

  return { deckId, topic: parsed.topic, counts };
}
