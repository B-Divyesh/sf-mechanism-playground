export type PartType =
  | 'crank'
  | 'gearLarge'
  | 'gearSmall'
  | 'cam'
  | 'follower'
  | 'linkage'
  | 'lever'
  | 'slider'
  | 'pulley'
  | 'bell';

export interface Point { x: number; y: number }
export interface Part { id: string; type: PartType; x: number; y: number; rotation: number }
export interface PartDefinition {
  label: string;
  hint: string;
  width: number;
  ports: Point[];
}
export interface Connection { a: string; b: string; point: Point }

export const PARTS: Record<PartType, PartDefinition> = {
  crank: { label: 'Hand crank', hint: 'Starts the motion', width: 88, ports: [{ x: 44, y: 0 }] },
  gearLarge: { label: 'Large gear', hint: 'Turns slowly', width: 104, ports: [{ x: -52, y: 0 }, { x: 52, y: 0 }] },
  gearSmall: { label: 'Small gear', hint: 'Turns quickly', width: 68, ports: [{ x: -34, y: 0 }, { x: 34, y: 0 }] },
  cam: { label: 'Eccentric cam', hint: 'Turn becomes a lift', width: 82, ports: [{ x: -41, y: 0 }, { x: 41, y: 0 }] },
  follower: { label: 'Follower', hint: 'Rises and falls', width: 76, ports: [{ x: -38, y: 0 }, { x: 38, y: 0 }] },
  linkage: { label: 'Linkage rod', hint: 'Carries a push', width: 112, ports: [{ x: -56, y: 0 }, { x: 56, y: 0 }] },
  lever: { label: 'Lever', hint: 'Swings around a pivot', width: 106, ports: [{ x: -53, y: 0 }, { x: 53, y: 0 }] },
  slider: { label: 'Slider', hint: 'Moves in a straight line', width: 94, ports: [{ x: -47, y: 0 }, { x: 47, y: 0 }] },
  pulley: { label: 'Belt wheel', hint: 'Carries rotation', width: 78, ports: [{ x: -39, y: 0 }, { x: 39, y: 0 }] },
  bell: { label: 'Bell', hint: 'Your output', width: 76, ports: [{ x: -38, y: 0 }] }
};

export const PART_TYPES = Object.keys(PARTS) as PartType[];

export interface Puzzle {
  id: string;
  number: number;
  name: string;
  brief: string;
  clue: string;
  required: Partial<Record<PartType, number>>;
  paid: boolean;
}

export const PUZZLES: Puzzle[] = [
  { id: 'first-turn', number: 1, name: 'First turn', brief: 'Carry the crank into the bell through a small gear.', clue: 'Touch the round ports together.', required: { gearSmall: 1 }, paid: false },
  { id: 'gear-train', number: 2, name: 'Gear train', brief: 'Use one large and one small gear before the bell.', clue: 'Alternate wheel sizes along the line.', required: { gearLarge: 1, gearSmall: 1 }, paid: false },
  { id: 'lift-off', number: 3, name: 'Lift off', brief: 'Change turning motion into a lift with a cam and follower.', clue: 'Cam first, follower second.', required: { cam: 1, follower: 1 }, paid: false },
  { id: 'long-reach', number: 4, name: 'Long reach', brief: 'Reach the far bell with a linkage and lever.', clue: 'The rod carries motion; the lever changes direction.', required: { linkage: 1, lever: 1 }, paid: false },
  { id: 'slide-rule', number: 5, name: 'Slide rule', brief: 'Make a straight-moving slider ring the bell.', clue: 'Join a linkage to the slider.', required: { linkage: 1, slider: 1 }, paid: false },
  { id: 'reduction', number: 6, name: 'Double reduction', brief: 'Build a three-gear train with two large wheels.', clue: 'Large, small, large makes a readable train.', required: { gearLarge: 2, gearSmall: 1 }, paid: true },
  { id: 'belt-courier', number: 7, name: 'Belt courier', brief: 'Carry rotation through two belt wheels.', clue: 'Both belt wheels must be in the powered chain.', required: { pulley: 2 }, paid: true },
  { id: 'cam-lever', number: 8, name: 'Cam & lever', brief: 'Lift a follower, then pass the motion through a lever.', clue: 'Cam → follower → lever.', required: { cam: 1, follower: 1, lever: 1 }, paid: true },
  { id: 'mixed-motion', number: 9, name: 'Mixed motion', brief: 'Use four different motion changers in one chain.', clue: 'Try a gear, cam, follower, then slider.', required: { gearSmall: 1, cam: 1, follower: 1, slider: 1 }, paid: true },
  { id: 'grand-machine', number: 10, name: 'Grand machine', brief: 'Power the bell through at least seven added parts.', clue: 'Every powered part counts. Branches are welcome.', required: { gearLarge: 1, gearSmall: 1, cam: 1, follower: 1, linkage: 1, lever: 1, pulley: 1 }, paid: true }
];

export function rotatePoint(point: Point, degrees: number): Point {
  const angle = degrees * Math.PI / 180;
  return {
    x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: point.x * Math.sin(angle) + point.y * Math.cos(angle)
  };
}

export function partPorts(part: Part): Point[] {
  return PARTS[part.type].ports.map((port) => {
    const rotated = rotatePoint(port, part.rotation);
    return { x: part.x + rotated.x, y: part.y + rotated.y };
  });
}

export function snapPart(part: Part, others: Part[], grid = 16): Part {
  let candidate = { ...part, x: Math.round(part.x / grid) * grid, y: Math.round(part.y / grid) * grid };
  let bestDistance = 49;
  let shift: Point | undefined;
  for (const own of partPorts(candidate)) {
    for (const other of others) {
      for (const port of partPorts(other)) {
        const distance = Math.hypot(own.x - port.x, own.y - port.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          shift = { x: port.x - own.x, y: port.y - own.y };
        }
      }
    }
  }
  if (shift) candidate = { ...candidate, x: candidate.x + shift.x, y: candidate.y + shift.y };
  return candidate;
}

export function getConnections(parts: Part[], threshold = 8): Connection[] {
  const connections: Connection[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    for (let j = i + 1; j < parts.length; j += 1) {
      let nearest: { distance: number; point: Point } | undefined;
      for (const a of partPorts(parts[i])) {
        for (const b of partPorts(parts[j])) {
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (!nearest || distance < nearest.distance) {
            nearest = { distance, point: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
          }
        }
      }
      if (nearest && nearest.distance <= threshold) {
        connections.push({ a: parts[i].id, b: parts[j].id, point: nearest.point });
      }
    }
  }
  return connections;
}

export function poweredIds(parts: Part[], connections = getConnections(parts)): Set<string> {
  const powered = new Set(parts.filter((part) => part.type === 'crank').map((part) => part.id));
  const queue = [...powered];
  while (queue.length) {
    const current = queue.shift()!;
    for (const connection of connections) {
      const next = connection.a === current ? connection.b : connection.b === current ? connection.a : undefined;
      if (next && !powered.has(next)) {
        powered.add(next);
        queue.push(next);
      }
    }
  }
  return powered;
}

export function puzzleProgress(parts: Part[], puzzle: Puzzle): { solved: boolean; connected: boolean; missing: string[] } {
  const powered = poweredIds(parts);
  const connected = parts.some((part) => part.type === 'bell' && powered.has(part.id));
  const missing: string[] = [];
  for (const [type, count] of Object.entries(puzzle.required) as [PartType, number][]) {
    const actual = parts.filter((part) => part.type === type && powered.has(part.id)).length;
    if (actual < count) missing.push(`${count - actual}× ${PARTS[type].label}`);
  }
  if (!connected) missing.unshift('a complete crank-to-bell connection');
  return { solved: connected && missing.length === 0, connected, missing };
}

export function starterParts(bellX = 704): Part[] {
  return [
    { id: 'starter-crank', type: 'crank', x: 104, y: 248, rotation: 0 },
    { id: 'starter-bell', type: 'bell', x: bellX, y: 248, rotation: 0 }
  ];
}
