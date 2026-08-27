import { describe, expect, it } from 'vitest';
import { validatePlayground } from './storage';

const validBlueprint = {
  version: 1,
  updatedAt: '2026-08-27T00:00:00.000Z',
  parts: [{ id: 'safe_gear-01', type: 'gearSmall', x: 182, y: 248, rotation: 0 }],
  activePuzzleId: null,
  completedPuzzleIds: []
};

describe('blueprint import validation', () => {
  it('keeps an allowed imported ID as data instead of markup', () => {
    const imported = validatePlayground(validBlueprint);
    expect(imported.parts[0].id).toBe('safe_gear-01');
  });

  it('rejects the quoted event-attribute ID used by the DOM injection regression', () => {
    const malicious = {
      ...validBlueprint,
      parts: [{ ...validBlueprint.parts[0], id: 'gear" onclick="document.body.dataset.qaExecuted=\'yes\'' }]
    };

    expect(() => validatePlayground(malicious)).toThrow('unsupported characters');
  });

  it('rejects an unknown type before the board can render it', () => {
    const unknown = {
      ...validBlueprint,
      parts: [{ ...validBlueprint.parts[0], type: 'not-a-part' }]
    };

    expect(() => validatePlayground(unknown)).toThrow('unsupported part type');
  });
});
