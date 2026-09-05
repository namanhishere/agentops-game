import { AgentType } from "../../types";

export const GAME_W = 800;
export const GAME_H = 480;

/** Desk positions (monitor + desk each); sprite occupies the seat in front. */
export const WORKSTATIONS = [
  { x: 150, y: 150 },
  { x: 400, y: 110 },
  { x: 650, y: 150 },
  { x: 400, y: 300 },
] as const;

export const SERVER_RACK = { x: 730, y: 420 } as const;

/** Idle spots on the floor, cycled as agents join the roster. */
export const ANCHORS = [
  { x: 80, y: 120 },
  { x: 80, y: 300 },
  { x: 280, y: 420 },
  { x: 520, y: 420 },
  { x: 720, y: 380 },
  { x: 560, y: 60 },
  { x: 240, y: 60 },
  { x: 80, y: 420 },
] as const;

export const TYPE_COLORS: Record<AgentType, number> = {
  coder: 0x38bdf8,
  researcher: 0xa78bfa,
  tester: 0x34d399,
  devops: 0xfb923c,
  creative: 0xf472b6,
};

export const ELITE_TRIM = 0xfbbf24;
export const FLOOR_A = 0x0d101d;
export const FLOOR_B = 0x0a0c16;
export const CARPET = 0x131a2c;
export const DESK = 0x232b45;
export const MONITOR = 0x0f1423;
export const SCREEN = 0x1a2440;
export const RACK = 0x1b2238;
