import { PART_TYPES, type Part, type PartType } from './engine';

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

function isPartType(value: string): value is PartType {
  return PART_TYPES.includes(value as PartType);
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
    const value = await new Promise<SavedPlayground | undefined>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(STATE_KEY);
      request.onsuccess = () => resolve(request.result as SavedPlayground | undefined);
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
  const ids = new Set<string>();
  for (const part of candidate.parts) {
    if (!part || typeof part.id !== 'string' || typeof part.type !== 'string' ||
        !Number.isFinite(part.x) || !Number.isFinite(part.y) || !Number.isFinite(part.rotation)) {
      throw new Error('A part in this blueprint is damaged.');
    }
    if (!PART_ID.test(part.id) || ids.has(part.id)) {
      throw new Error('A part ID contains unsupported characters or is duplicated. Export a fresh blueprint and try importing it again.');
    }
    if (!isPartType(part.type)) {
      throw new Error(`This blueprint uses the unsupported part type “${part.type}”. Choose a blueprint made by Mechanism Playground or export a fresh copy and try again.`);
    }
    ids.add(part.id);
  }
  return {
    version: 1,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
    parts: candidate.parts.map((part) => ({ ...part, type: part.type as PartType })),
    activePuzzleId: typeof candidate.activePuzzleId === 'string' ? candidate.activePuzzleId : null,
    completedPuzzleIds: Array.isArray(candidate.completedPuzzleIds) ? candidate.completedPuzzleIds.filter((id): id is string => typeof id === 'string') : []
  };
}
