import { PART_TYPES, PUZZLES, type Part, type PartType } from './engine';

export interface SavedPlayground {
  version: 1;
  updatedAt: string;
  parts: Part[];
  activePuzzleId: string | null;
  completedPuzzleIds: string[];
}

const DB_NAME = 'mechanism-playground';
const STORE_NAME = 'playground';
const STATE_KEY = 'current';
const FALLBACK_KEY = 'mechanism-playground:current';
const PART_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const MAX_PARTS = 250;

function isPartType(value: unknown): value is PartType {
  return typeof value === 'string' && PART_TYPES.includes(value as PartType);
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage'));
  });
}

export async function loadPlayground(): Promise<SavedPlayground | null> {
  try {
    const db = await openDatabase();
    const value = await new Promise<unknown>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(STATE_KEY) as IDBRequest<unknown>;
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value ? validatePlayground(value) : null;
  } catch {
    const raw = localStorage.getItem(FALLBACK_KEY);
    return raw ? validatePlayground(JSON.parse(raw)) : null;
  }
}

export async function savePlayground(value: SavedPlayground): Promise<'indexeddb' | 'fallback'> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(value, STATE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
    return 'indexeddb';
  } catch {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(value));
    return 'fallback';
  }
}

export function validatePlayground(value: unknown): SavedPlayground {
  if (!value || typeof value !== 'object') throw new Error('This file is not a Mechanism Playground blueprint.');
  const candidate = value as Partial<SavedPlayground>;
  if (candidate.version !== 1 || !Array.isArray(candidate.parts)) throw new Error('This blueprint version cannot be opened.');
  if (candidate.parts.length > MAX_PARTS) throw new Error('This blueprint has too many parts to open safely. Export a smaller sheet and try again.');

  const ids = new Set<string>();
  const parts: Part[] = [];
  for (const part of candidate.parts) {
    if (!part || typeof part !== 'object' || typeof part.id !== 'string' ||
        !Number.isFinite(part.x) || !Number.isFinite(part.y) || !Number.isFinite(part.rotation)) {
      throw new Error('A part in this blueprint is damaged.');
    }
    if (!PART_ID.test(part.id) || ids.has(part.id)) {
      throw new Error('This blueprint has an invalid part ID. Export a fresh copy from Mechanism Playground and try again.');
    }
    if (!isPartType(part.type)) {
      throw new Error('This blueprint contains a part this workshop does not recognize. Choose a blueprint exported by Mechanism Playground and try again.');
    }
    ids.add(part.id);
    parts.push({ id: part.id, type: part.type, x: part.x, y: part.y, rotation: part.rotation });
  }

  const validPuzzleIds = new Set(PUZZLES.map((puzzle) => puzzle.id));
  if (candidate.activePuzzleId !== null && candidate.activePuzzleId !== undefined &&
      (typeof candidate.activePuzzleId !== 'string' || !validPuzzleIds.has(candidate.activePuzzleId))) {
    throw new Error('This blueprint refers to a puzzle this workshop does not recognize. Choose a blueprint exported by Mechanism Playground and try again.');
  }

  return {
    version: 1,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
    parts,
    activePuzzleId: typeof candidate.activePuzzleId === 'string' ? candidate.activePuzzleId : null,
    completedPuzzleIds: Array.isArray(candidate.completedPuzzleIds)
      ? candidate.completedPuzzleIds.filter((id): id is string => typeof id === 'string' && validPuzzleIds.has(id))
      : []
  };
}
