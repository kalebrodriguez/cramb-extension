import type { GenOptions } from '@/lib/messages';

export function buildSystemPrompt(): string {
  return `You are a spaced-repetition flashcard generator. Given text from a web page, create high-quality recall cards that help the reader remember the key concepts.

Rules:
- Create cards that test understanding, not just recognition.
- Each card should be atomic — one concept per card.
- For "basic" cards: write a clear question (front) and concise answer (back).
- For "cloze" cards: write a sentence with the key term wrapped in {{c1::term}} markers. The front shows [...] and the back shows the filled term.
- Use the source material faithfully — do not add information not present in the text.
- Prefer specific, concrete questions over vague ones.
- Keep answers concise but complete.

Respond with valid JSON matching this schema:
{
  "summary": "optional one-paragraph summary of the source",
  "cards": [
    {
      "type": "basic" | "cloze",
      "front": "question or cloze text with [...] blanks",
      "back": "answer or revealed cloze text",
      "clozeText": "original text with {{c1::term}} markers (cloze only)",
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
