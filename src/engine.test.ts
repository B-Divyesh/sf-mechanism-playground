import { describe, expect, it } from 'vitest';
import { getConnections, poweredIds, puzzleProgress, PUZZLES, snapPart, type Part } from './engine';
import { validatePlayground } from './storage';

describe('deterministic mechanism graph', () => {
  const chain: Part[] = [
    { id: 'c', type: 'crank', x: 100, y: 200, rotation: 0 },
    { id: 'g', type: 'gearSmall', x: 178, y: 200, rotation: 0 },
    { id: 'b', type: 'bell', x: 250, y: 200, rotation: 0 }
  ];

  it('connects touching ports and powers the output', () => {
    expect(getConnections(chain)).toHaveLength(2);
    expect([...poweredIds(chain)]).toEqual(['c', 'g', 'b']);
    expect(puzzleProgress(chain, PUZZLES[0]).solved).toBe(true);
  });

  it('leaves a separated output unpowered', () => {
    const broken = chain.map((part) => part.id === 'b' ? { ...part, x: 400 } : part);
    expect(puzzleProgress(broken, PUZZLES[0]).connected).toBe(false);
  });

  it('snaps a nearby port exactly onto an existing port', () => {
    const snapped = snapPart({ id: 'g', type: 'gearSmall', x: 182, y: 203, rotation: 0 }, [chain[0]]);
    expect(snapped.x).toBe(178);
    expect(snapped.y).toBe(200);
  });
});

describe('blueprint import validation', () => {
  const blueprint = {
    version: 1 as const,
    updatedAt: '2026-08-27T00:00:00.000Z',
    parts: [{ id: 'safe-gear-1', type: 'gearSmall', x: 180, y: 248, rotation: 0 }],
    activePuzzleId: null,
    completedPuzzleIds: []
  };

  it('rejects quote-containing IDs before they reach the renderer', () => {
    expect(() => validatePlayground({
      ...blueprint,
      parts: [{ ...blueprint.parts[0], id: 'safe\" onclick=\"document.body.dataset.qaExecuted=\"yes' }]
    })).toThrow(/part ID contains unsupported characters/i);
  });

  it('rejects unknown part types with a recoverable import message', () => {
    expect(() => validatePlayground({
      ...blueprint,
      parts: [{ ...blueprint.parts[0], type: 'not-a-part' }]
    })).toThrow(/unsupported part type/i);
  });
});
