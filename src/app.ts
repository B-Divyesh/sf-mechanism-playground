import './styles.css';
import {
  PARTS,
  PART_TYPES,
  PUZZLES,
  getConnections,
  poweredIds,
  puzzleProgress,
  snapPart,
  starterParts,
  type Part,
  type PartType,
  type Puzzle
} from './engine';
import { loadPlayground, savePlayground, validatePlayground, type SavedPlayground } from './storage';
import { CHECKOUT_URL, initializeLicense, restoreLicense, type LicenseState } from './license';

const byId = <T extends Element = HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as unknown as T;
};

const board = byId<SVGSVGElement>('board');
const partsLayer = byId<SVGGElement>('parts-layer');
const connectionsLayer = byId<SVGGElement>('connections-layer');
const partsList = byId('parts-list');
const puzzleList = byId<HTMLOListElement>('puzzle-list');
const guideDialog = byId<HTMLDialogElement>('guide-dialog');
const fileDialog = byId<HTMLDialogElement>('file-dialog');
const upgradeDialog = byId<HTMLDialogElement>('upgrade-dialog');

let parts: Part[] = [];
let selectedId: string | null = null;
let addType: PartType | null = null;
let activePuzzleId: string | null = null;
let completed = new Set<string>();
let history: Part[][] = [];
let phase = 0;
let running = false;
let slow = false;
let lastFrame = performance.now();
let saveTimer = 0;
let toastTimer = 0;
let dragging: { id: string; offsetX: number; offsetY: number; moved: boolean } | null = null;
let license: LicenseState = { unlocked: false, checking: false };

const symbolFor: Record<PartType, string> = {
  crank: '↻', gearLarge: '⚙', gearSmall: '⚙', cam: '◒', follower: '↕',
  linkage: '╱', lever: '⌁', slider: '↔', pulley: '◎', bell: '♢'
};
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const INVALID_JSON_BLUEPRINT_MESSAGE = 'This file is not valid JSON. Export a fresh blueprint or choose a valid JSON file and try again.';

function svgElement<T extends SVGElement>(name: string, attributes: Record<string, string | number> = {}): T {
  const element = document.createElementNS(SVG_NAMESPACE, name) as T;
  for (const [attribute, value] of Object.entries(attributes)) element.setAttribute(attribute, String(value));
  return element;
}

function partElementById(id: string): SVGGElement | undefined {
  return [...partsLayer.querySelectorAll<SVGGElement>('.mechanism-part')].find((element) => element.dataset.partId === id);
}

function announce(message: string): void {
  const toast = byId('toast');
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4200);
}

function activePuzzle(): Puzzle | undefined {
  return PUZZLES.find((puzzle) => puzzle.id === activePuzzleId);
}

function snapshot(): SavedPlayground {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    parts,
    activePuzzleId,
    completedPuzzleIds: [...completed]
  };
}

function scheduleSave(): void {
  byId('save-status').textContent = 'Saving…';
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    try {
      const location = await savePlayground(snapshot());
      byId('save-status').textContent = location === 'indexeddb' ? 'Saved locally' : 'Saved (limited mode)';
    } catch {
      byId('save-status').textContent = 'Could not save';
      announce('This browser could not save the blueprint. Export a copy from Blueprint file.');
    }
  }, 180);
}

function pushHistory(): void {
  history.push(parts.map((part) => ({ ...part })));
  if (history.length > 30) history.shift();
  byId<HTMLButtonElement>('undo-button').disabled = false;
}

function gearPoints(radius: number, teeth: number): string {
  const points: string[] = [];
  for (let i = 0; i < teeth * 2; i += 1) {
    const angle = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 ? radius - 5 : radius;
    points.push(`${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`);
  }
  return points.join(' ');
}

function partShape(type: PartType): SVGElement[] {
  const shape = (name: string, attributes: Record<string, string | number>): SVGElement => svgElement(name, attributes);
  switch (type) {
    case 'crank': return [shape('circle', { class: 'part-shape', r: 28 }), shape('circle', { class: 'part-detail', r: 6 }), shape('path', { class: 'part-detail', d: 'M0 0 L19 -17 L31 -17' }), shape('circle', { class: 'part-shape', cx: 34, cy: -17, r: 5 })];
    case 'gearLarge': return [shape('polygon', { class: 'part-shape', points: gearPoints(44, 16) }), shape('circle', { class: 'part-detail', r: 29 }), shape('circle', { class: 'part-shape', r: 7 }), shape('path', { class: 'part-detail', d: 'M-28 0 H28 M0 -28 V28' })];
    case 'gearSmall': return [shape('polygon', { class: 'part-shape', points: gearPoints(27, 12) }), shape('circle', { class: 'part-detail', r: 17 }), shape('circle', { class: 'part-shape', r: 5 })];
    case 'cam': return [shape('ellipse', { class: 'part-shape', cx: 7, cy: 0, rx: 29, ry: 37, transform: 'rotate(-18)' }), shape('circle', { class: 'part-shape', r: 6 }), shape('path', { class: 'part-detail', d: 'M0 0 L25 -13' })];
    case 'follower': return [shape('path', { class: 'part-shape', d: 'M-19 -31 H19 V31 H-19 Z' }), shape('path', { class: 'part-detail', d: 'M0 -22 V17 M-10 17 H10 L6 28 H-6 Z' }), shape('circle', { class: 'part-shape', cy: -22, r: 7 })];
    case 'linkage': return [shape('path', { class: 'part-detail', d: 'M-49 0 L49 0', 'stroke-width': 8 }), shape('circle', { class: 'part-shape', cx: -49, r: 9 }), shape('circle', { class: 'part-shape', cx: 49, r: 9 })];
    case 'lever': return [shape('path', { class: 'part-shape', d: 'M-45 -8 L45 -8 L45 8 L-45 8 Z' }), shape('path', { class: 'part-detail', d: 'M0 8 L-12 32 H12 Z' }), shape('circle', { class: 'part-shape', r: 7 })];
    case 'slider': return [shape('rect', { class: 'part-shape', x: -42, y: -23, width: 84, height: 46, rx: 3 }), shape('rect', { class: 'part-detail', x: -22, y: -13, width: 44, height: 26 }), shape('path', { class: 'part-detail', d: 'M-34 31 H34 M-25 25 V37 M25 25 V37' })];
    case 'pulley': return [shape('circle', { class: 'part-shape', r: 31 }), shape('circle', { class: 'part-detail', r: 23 }), shape('circle', { class: 'part-shape', r: 6 }), shape('path', { class: 'part-detail', d: 'M-21 -21 L21 21 M21 -21 L-21 21' })];
    case 'bell': return [shape('path', { class: 'part-shape', d: 'M-26 19 H27 C19 10 20 -5 14 -18 C8 -31 -9 -31 -15 -18 C-21 -5 -18 10 -26 19 Z' }), shape('path', { class: 'part-detail', d: 'M-31 20 H32' }), shape('circle', { class: 'part-shape', cy: 28, r: 5 })];
  }
}

function renderBoard(): void {
  const connections = getConnections(parts);
  const powered = poweredIds(parts, connections);
  connectionsLayer.replaceChildren(...connections.map((connection) =>
    svgElement<SVGCircleElement>('circle', { class: 'connection-dot', cx: connection.point.x, cy: connection.point.y, r: 6 })
  ));
  partsLayer.replaceChildren(...parts.map((part) => {
    const definition = PARTS[part.type];
    const classes = ['mechanism-part', powered.has(part.id) ? 'powered' : '', selectedId === part.id ? 'selected' : ''].filter(Boolean).join(' ');
    const group = svgElement<SVGGElement>('g', {
      class: classes,
      'data-part-id': part.id,
      'data-part-type': part.type,
      tabindex: 0,
      role: 'button',
      'aria-label': `${definition.label}, at ${Math.round(part.x)}, ${Math.round(part.y)}${powered.has(part.id) ? ', powered' : ''}`,
      transform: `translate(${part.x} ${part.y}) rotate(${part.rotation})`
    });
    const moving = svgElement<SVGGElement>('g', { class: 'moving-shape' });
    moving.replaceChildren(...partShape(part.type));
    group.replaceChildren(
      svgElement<SVGCircleElement>('circle', { class: 'selection-ring', r: Math.max(43, definition.width / 2 + 9) }),
      moving,
      ...PARTS[part.type].ports.map((port) => svgElement<SVGCircleElement>('circle', { class: 'port', cx: port.x, cy: port.y, r: 6 }))
    );
    return group;
  }));
  byId('empty-board').hidden = parts.length > 0;
  updateMotion();
}

function renderPalette(): void {
  partsList.innerHTML = PART_TYPES.map((type) => {
    const definition = PARTS[type];
    return `<button class="part-tool" type="button" draggable="true" data-add-type="${type}" data-symbol="${symbolFor[type]}" aria-pressed="${addType === type}">
      <strong>${definition.label}</strong><span>${definition.hint}</span>
    </button>`;
  }).join('');
  board.classList.toggle('adding', addType !== null);
}

function renderPuzzles(): void {
  puzzleList.innerHTML = PUZZLES.map((puzzle) => {
    const locked = puzzle.paid && !license.unlocked;
    const done = completed.has(puzzle.id);
    return `<li class="puzzle-card"><button type="button" data-puzzle-id="${puzzle.id}" aria-current="${activePuzzleId === puzzle.id}" aria-label="Puzzle ${puzzle.number}: ${puzzle.name}${locked ? ', Forge Edition locked' : done ? ', completed' : ''}">
      <span class="puzzle-number">${String(puzzle.number).padStart(2, '0')}</span>
      <span class="puzzle-copy"><strong>${puzzle.name}</strong><span>${puzzle.brief}</span></span>
      <span class="puzzle-state ${done ? 'done' : ''}" aria-hidden="true">${locked ? '◇' : done ? '✓' : '→'}</span>
    </button></li>`;
  }).join('');
  byId('progress-count').textContent = `${completed.size}/10`;
  byId('upgrade-button').textContent = license.unlocked ? 'Forge Edition unlocked' : 'See the puzzle pack';
}

function renderInspector(): void {
  const selected = parts.find((part) => part.id === selectedId);
  byId('selection-info').textContent = selected
    ? `${PARTS[selected.type].label} · ${Math.round(selected.x)}, ${Math.round(selected.y)} · ${selected.rotation}°`
    : addType ? `${PARTS[addType].label} ready — tap the sheet` : 'No part selected';
  byId<HTMLButtonElement>('rotate-button').disabled = !selected;
  byId<HTMLButtonElement>('delete-button').disabled = !selected;
  byId('board-mode').textContent = activePuzzle() ? `Puzzle ${String(activePuzzle()!.number).padStart(2, '0')} · ${activePuzzle()!.name}` : 'Free build';
}

function renderPuzzleStatus(newlyCheck = false): void {
  const container = byId('puzzle-status');
  const puzzle = activePuzzle();
  container.classList.remove('success');
  if (!puzzle) {
    const powered = poweredIds(parts).size;
    container.textContent = parts.length ? `${powered} of ${parts.length} parts powered. Join round ports to carry the motion.` : 'Free build · all ten parts are available in the drawer.';
    return;
  }
  const progress = puzzleProgress(parts, puzzle);
  if (progress.solved) {
    container.classList.add('success');
    container.textContent = `Solved · ${puzzle.name}. The bell has power!`;
    if (!completed.has(puzzle.id)) {
      completed.add(puzzle.id);
      if (newlyCheck) announce(`Puzzle ${String(puzzle.number).padStart(2, '0')} solved — the motion reached the bell.`);
      renderPuzzles();
      scheduleSave();
    }
  } else {
    container.textContent = `Goal: ${puzzle.brief} Still needed: ${progress.missing.join(', ')}.`;
  }
}

function renderAll(checkPuzzle = false): void {
  renderPalette();
  renderBoard();
  renderInspector();
  renderPuzzles();
  renderPuzzleStatus(checkPuzzle);
  byId<HTMLButtonElement>('undo-button').disabled = history.length === 0;
}

function updateMotion(): void {
  const powered = poweredIds(parts);
  document.querySelectorAll<SVGGElement>('.mechanism-part').forEach((element) => {
    const id = element.dataset.partId!;
    const type = element.dataset.partType as PartType;
    const moving = element.querySelector<SVGGElement>('.moving-shape');
    if (!moving) return;
    if (!powered.has(id)) { moving.setAttribute('transform', ''); return; }
    const degrees = phase * 180 / Math.PI;
    let transform = '';
    if (type === 'crank' || type === 'cam' || type === 'pulley') transform = `rotate(${degrees})`;
    else if (type === 'gearLarge') transform = `rotate(${-degrees * .55})`;
    else if (type === 'gearSmall') transform = `rotate(${degrees * 1.3})`;
    else if (type === 'follower') transform = `translate(0 ${Math.sin(phase) * -10})`;
    else if (type === 'linkage') transform = `rotate(${Math.sin(phase) * 7})`;
    else if (type === 'lever') transform = `rotate(${Math.sin(phase) * 14})`;
    else if (type === 'slider') transform = `translate(${Math.sin(phase) * 12} 0)`;
    else if (type === 'bell') transform = `rotate(${Math.sin(phase * 2) * 7})`;
    moving.setAttribute('transform', transform);
  });
  byId<HTMLInputElement>('phase-range').value = String(Math.round(((phase % (Math.PI * 2)) / (Math.PI * 2)) * 100));
}

function animate(now: number): void {
  const elapsed = Math.min(50, now - lastFrame);
  lastFrame = now;
  if (running) {
    phase = (phase + elapsed * (slow ? .001 : .003)) % (Math.PI * 2);
    updateMotion();
  }
  requestAnimationFrame(animate);
}

function setRunning(next: boolean): void {
  running = next;
  const button = byId<HTMLButtonElement>('run-button');
  button.setAttribute('aria-pressed', String(running));
  button.innerHTML = running ? '<span aria-hidden="true">Ⅱ</span> Pause' : '<span aria-hidden="true">↻</span> Turn crank';
}

function addPart(type: PartType, point: { x: number; y: number }): void {
  pushHistory();
  const raw: Part = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${type}-${Date.now()}`,
    type,
    x: Math.max(58, Math.min(742, point.x)),
    y: Math.max(55, Math.min(445, point.y)),
    rotation: 0
  };
  const part = snapPart(raw, parts);
  parts = [...parts, part];
  selectedId = part.id;
  addType = null;
  renderAll(true);
  scheduleSave();
  window.setTimeout(() => partElementById(part.id)?.focus(), 0);
}

function removeSelected(): void {
  if (!selectedId) return;
  const removed = parts.find((part) => part.id === selectedId);
  if (!removed) return;
  pushHistory();
  parts = parts.filter((part) => part.id !== selectedId);
  selectedId = null;
  renderAll(true);
  scheduleSave();
  announce(`${PARTS[removed.type].label} removed. Use Undo to bring it back.`);
}

function rotateSelected(): void {
  if (!selectedId) return;
  pushHistory();
  parts = parts.map((part) => part.id === selectedId ? snapPart({ ...part, rotation: (part.rotation + 45) % 360 }, parts.filter((item) => item.id !== part.id)) : part);
  renderAll(true);
  scheduleSave();
  window.setTimeout(() => selectedId && partElementById(selectedId)?.focus(), 0);
}

function svgPoint(event: { clientX: number; clientY: number }): { x: number; y: number } {
  const rect = board.getBoundingClientRect();
  return { x: ((event.clientX - rect.left) / rect.width) * 800, y: ((event.clientY - rect.top) / rect.height) * 500 };
}

function startPuzzle(puzzle: Puzzle): void {
  if (puzzle.paid && !license.unlocked) { upgradeDialog.showModal(); return; }
  if (parts.length > 0 && activePuzzleId !== puzzle.id && !confirm(`Open “${puzzle.name}”? This replaces the current sheet. You can export it first from Blueprint file.`)) return;
  pushHistory();
  activePuzzleId = puzzle.id;
  const requiredWidth = (Object.entries(puzzle.required) as [PartType, number][])
    .reduce((total, [type, count]) => total + PARTS[type].width * count, 0);
  parts = starterParts(Math.min(704, 186 + requiredWidth));
  selectedId = null;
  addType = null;
  setRunning(false);
  renderAll();
  scheduleSave();
  announce(`Puzzle ${String(puzzle.number).padStart(2, '0')} loaded. ${puzzle.clue}`);
}

partsList.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-add-type]');
  if (!button) return;
  addType = button.dataset.addType as PartType;
  selectedId = null;
  renderPalette();
  renderInspector();
  announce(`${PARTS[addType].label} selected. Tap the drawing sheet to place it.`);
});

partsList.addEventListener('dragstart', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-add-type]');
  if (!button || !event.dataTransfer) return;
  event.dataTransfer.setData('text/x-mechanism-part', button.dataset.addType!);
  event.dataTransfer.effectAllowed = 'copy';
});

board.addEventListener('dragover', (event) => { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'; });
board.addEventListener('drop', (event) => {
  event.preventDefault();
  const type = event.dataTransfer?.getData('text/x-mechanism-part') as PartType;
  if (PART_TYPES.includes(type)) addPart(type, svgPoint(event));
});

board.addEventListener('pointerdown', (event) => {
  const target = (event.target as Element).closest<SVGGElement>('[data-part-id]');
  if (!target) return;
  event.preventDefault();
  const id = target.dataset.partId!;
  const part = parts.find((item) => item.id === id)!;
  const point = svgPoint(event);
  selectedId = id;
  addType = null;
  pushHistory();
  dragging = { id, offsetX: point.x - part.x, offsetY: point.y - part.y, moved: false };
  board.setPointerCapture(event.pointerId);
  renderPalette();
  renderInspector();
  target.classList.add('selected');
});

board.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const point = svgPoint(event);
  const part = parts.find((item) => item.id === dragging!.id)!;
  const x = Math.max(58, Math.min(742, point.x - dragging.offsetX));
  const y = Math.max(55, Math.min(445, point.y - dragging.offsetY));
  dragging.moved ||= Math.hypot(x - part.x, y - part.y) > 2;
  part.x = x;
  part.y = y;
  partElementById(part.id)?.setAttribute('transform', `translate(${x} ${y}) rotate(${part.rotation})`);
});

board.addEventListener('pointerup', () => {
  if (!dragging) return;
  const current = parts.find((item) => item.id === dragging!.id)!;
  const others = parts.filter((item) => item.id !== current.id);
  const snapped = snapPart(current, others);
  parts = parts.map((part) => part.id === current.id ? snapped : part);
  if (!dragging.moved) history.pop();
  dragging = null;
  renderAll(true);
  scheduleSave();
});

board.addEventListener('click', (event) => {
  if ((event.target as Element).closest('[data-part-id]') || !addType) return;
  addPart(addType, svgPoint(event));
});

board.addEventListener('keydown', (event) => {
  if (!selectedId) return;
  if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); removeSelected(); return; }
  if (event.key.toLowerCase() === 'r') { event.preventDefault(); rotateSelected(); return; }
  const moves: Record<string, [number, number]> = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  pushHistory();
  parts = parts.map((part) => part.id === selectedId ? snapPart({ ...part, x: part.x + move[0], y: part.y + move[1] }, parts.filter((item) => item.id !== part.id)) : part);
  renderAll(true);
  scheduleSave();
  window.setTimeout(() => selectedId && partElementById(selectedId)?.focus(), 0);
});

puzzleList.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-puzzle-id]');
  const puzzle = PUZZLES.find((item) => item.id === button?.dataset.puzzleId);
  if (puzzle) startPuzzle(puzzle);
});

byId('run-button').addEventListener('click', () => setRunning(!running));
byId('slow-toggle').addEventListener('change', (event) => { slow = (event.target as HTMLInputElement).checked; });
byId('step-button').addEventListener('click', () => { setRunning(false); phase = (phase + Math.PI / 12) % (Math.PI * 2); updateMotion(); });
byId('phase-range').addEventListener('input', (event) => { setRunning(false); phase = Number((event.target as HTMLInputElement).value) / 100 * Math.PI * 2; updateMotion(); });
byId('rotate-button').addEventListener('click', rotateSelected);
byId('delete-button').addEventListener('click', removeSelected);
byId('undo-button').addEventListener('click', () => {
  const previous = history.pop();
  if (!previous) return;
  parts = previous;
  selectedId = null;
  renderAll(true);
  scheduleSave();
  announce('Last board change undone.');
});
byId('clear-button').addEventListener('click', () => {
  const action = activePuzzleId ? 'reset this puzzle to its crank and bell' : 'clear every part from this sheet';
  if (!parts.length || !confirm(`Are you sure you want to ${action}?`)) return;
  pushHistory();
  const puzzle = activePuzzle();
  const requiredWidth = puzzle ? (Object.entries(puzzle.required) as [PartType, number][])
    .reduce((total, [type, count]) => total + PARTS[type].width * count, 0) : 0;
  parts = puzzle ? starterParts(Math.min(704, 186 + requiredWidth)) : [];
  selectedId = null;
  renderAll();
  scheduleSave();
  announce(activePuzzleId ? 'Puzzle reset. Use Undo to restore your machine.' : 'Sheet cleared. Use Undo to restore your machine.');
});

byId('empty-start-button').addEventListener('click', () => startPuzzle(PUZZLES[0]));
byId('guide-start-button').addEventListener('click', () => { guideDialog.close(); localStorage.setItem('mechanism-playground:intro', 'seen'); startPuzzle(PUZZLES[0]); });
byId('help-button').addEventListener('click', () => guideDialog.showModal());
byId('file-button').addEventListener('click', () => { byId('file-error').textContent = ''; fileDialog.showModal(); });
byId('upgrade-button').addEventListener('click', () => upgradeDialog.showModal());
byId<HTMLAnchorElement>('buy-link').href = CHECKOUT_URL;
document.querySelectorAll<HTMLButtonElement>('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => button.closest<HTMLDialogElement>('dialog')?.close()));
document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
}));

byId('export-button').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mechanism-blueprint-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  announce('Blueprint exported.');
});
byId('import-button').addEventListener('click', () => byId<HTMLInputElement>('import-file').click());
byId('import-file').addEventListener('change', async (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const imported = validatePlayground(JSON.parse(await file.text()));
    pushHistory();
    parts = imported.parts;
    activePuzzleId = imported.activePuzzleId;
    completed = new Set([...completed, ...imported.completedPuzzleIds]);
    selectedId = null;
    renderAll(true);
    scheduleSave();
    fileDialog.close();
    announce(`Imported ${parts.length} parts from ${file.name}.`);
  } catch (error) {
    // JSON.parse diagnostics vary by browser and are written for developers.
    // Keep format failures distinct from our validation errors, which already
    // explain how a player can recover.
    byId('file-error').textContent = error instanceof SyntaxError
      ? INVALID_JSON_BLUEPRINT_MESSAGE
      : error instanceof Error ? error.message : 'This blueprint could not be opened.';
  }
  (event.target as HTMLInputElement).value = '';
});

byId<HTMLFormElement>('license-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = byId('license-status');
  try {
    restoreLicense(byId<HTMLInputElement>('license-input').value);
    status.textContent = 'Checking your license…';
    await initializeLicense(updateLicense);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'That license could not be restored.';
  }
});

function updateLicense(next: LicenseState): void {
  const wasUnlocked = license.unlocked;
  license = next;
  renderPuzzles();
  const status = byId('license-status');
  if (next.checking) status.textContent = 'Checking your license…';
  else if (next.unlocked) status.textContent = next.reason === 'offline' ? 'Forge Edition available from your last check. Verification will retry online.' : 'Forge Edition unlocked on this device.';
  else if (next.reason) status.textContent = 'This license is no longer active. You can purchase another copy above.';
  if (!wasUnlocked && next.unlocked && !next.checking) announce('Forge Edition unlocked — puzzles 6–10 are ready.');
}

window.addEventListener('online', () => { byId('offline-banner').hidden = true; announce('Back online. Your workshop was available the whole time.'); });
window.addEventListener('offline', () => { byId('offline-banner').hidden = false; });
document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  if (event.code === 'Space' && !target.closest('button, input, a, dialog')) { event.preventDefault(); setRunning(!running); }
  if (event.key === 'Escape') { selectedId = null; addType = null; renderAll(); }
});

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  try {
    const hadController = Boolean(navigator.serviceWorker.controller);
    const registration = await navigator.serviceWorker.register('/sw.js');
    const showUpdate = (): void => { byId('update-toast').hidden = false; };
    if (registration.waiting) showUpdate();
    registration.addEventListener('updatefound', () => {
      registration.installing?.addEventListener('statechange', () => {
        if (registration.waiting && navigator.serviceWorker.controller) showUpdate();
      });
    });
    byId('update-button').addEventListener('click', () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' }));
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !refreshing) { refreshing = true; location.reload(); }
    });
  } catch { /* the app remains fully usable without installation */ }
}

async function initialize(): Promise<void> {
  try {
    const saved = await loadPlayground();
    if (saved) {
      parts = saved.parts;
      activePuzzleId = saved.activePuzzleId;
      completed = new Set(saved.completedPuzzleIds);
    }
  } catch {
    announce('Your last local blueprint could not be read. A fresh sheet is ready.');
  }
  byId('offline-banner').hidden = navigator.onLine;
  renderAll();
  requestAnimationFrame(animate);
  void initializeLicense(updateLicense);
  void registerServiceWorker();
  if (!localStorage.getItem('mechanism-playground:intro')) {
    guideDialog.showModal();
    guideDialog.addEventListener('close', () => localStorage.setItem('mechanism-playground:intro', 'seen'), { once: true });
  }
}

void initialize();
