import type { GenOptions } from '@/lib/messages';

export function buildSystemPrompt(): string {
  return `You are a spaced-repetition flashcard generator. Given text from a web page, create high-quality recall cards that help the reader remember the key concepts.

Rules:
- Create cards that test understanding, not just recognition.
- Each card should be atomic — one concept per card.
- For "basic" cards: write a clear question (front) and concise answer (back).
- For "cloze" cards: write a sentence with the key term wrapped in {{c1::term}} markers. The front shows [...] and the back shows the filled term.
- For "mcq" cards: write a question (front), provide 3-5 plausible "choices", and set "answerIndex" to the 0-based index of the correct choice. The "back" must be the exact text of the correct choice. Distractors must be plausible but clearly wrong to someone who understands the material.
- Use the source material faithfully — do not add information not present in the text.
- Prefer specific, concrete questions over vague ones.
- Keep answers concise but complete.

Respond with valid JSON matching this schema:
{
  "summary": "optional one-paragraph summary of the source",
  "cards": [
    {
      "type": "basic" | "cloze" | "mcq",
      "front": "question or cloze text with [...] blanks",
      "back": "answer, revealed cloze text, or the correct choice text",
      "clozeText": "original text with {{c1::term}} markers (cloze only)",
      "choices": ["option A", "option B", "option C"],
      "answerIndex": 0,
      "tags": ["optional", "tags"]
    }
  ]
}`;
}

export function buildUserPrompt(
  text: string,
  options: GenOptions,
  title?: string,
  url?: string,
): string {
  const typesStr = options.cardTypes.join(' and ');
  const parts = [
    `Generate up to ${options.maxCards} ${typesStr} flashcards from the following content.`,
  ];
  if (title) parts.push(`Source title: "${title}"`);
  if (url) parts.push(`Source URL: ${url}`);
  parts.push('', '---', '', text);
  return parts.join('\n');
}
