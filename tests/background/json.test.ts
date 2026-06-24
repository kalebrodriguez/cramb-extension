import { describe, it, expect } from 'vitest';
import { parseModelJson } from '@/background/providers/json';

describe('parseModelJson', () => {
  it('parses raw JSON', () => {
    expect(parseModelJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips a ```json fence', () => {
    const raw = '```json\n{"cards":[{"front":"Q"}]}\n```';
    expect(parseModelJson(raw)).toEqual({ cards: [{ front: 'Q' }] });
  });

  it('strips a bare ``` fence', () => {
    expect(parseModelJson('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('recovers JSON embedded in prose', () => {
    const raw = 'Here are your cards:\n{"cards":[]}\nHope that helps!';
    expect(parseModelJson(raw)).toEqual({ cards: [] });
  });

  it('throws BAD_LLM_OUTPUT when nothing parses', () => {
    expect(() => parseModelJson('no json here')).toThrow('BAD_LLM_OUTPUT');
  });
});
