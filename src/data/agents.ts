import { Agent, AgentType, MarketAgent, Skill } from "../types";
import { XP_TO_NEXT } from "../config";
import { randInt, pick, pickWeighted, uuid } from "../rng";

export type MarketTierKey = "junior" | "regular" | "senior" | "specialist";

export interface MarketTier {
  tag: string;
  price: [number, number];
  accuracy: [number, number];
  speed: [number, number];
  reliability: [number, number];
  tokenCost: [number, number];
  costPerTask: [number, number];
}

export const MARKET_TIERS: Record<MarketTierKey, MarketTier> = {
  junior: {
    tag: "JUNIOR",
    price: [100, 150],
    accuracy: [0.45, 0.55],
    speed: [0.8, 0.95],
    reliability: [0.4, 0.55],
    tokenCost: [1.0, 1.1],
    costPerTask: [2, 4],
  },
  regular: {
    tag: "REGULAR",
    price: [200, 280],
    accuracy: [0.55, 0.65],
    speed: [0.95, 1.1],
    reliability: [0.55, 0.7],
    tokenCost: [0.95, 1.05],
    costPerTask: [4, 7],
  },
  senior: {
    tag: "SENIOR",
    price: [300, 380],
    accuracy: [0.65, 0.75],
    speed: [1.05, 1.25],
    reliability: [0.65, 0.8],
    tokenCost: [0.85, 0.95],
    costPerTask: [6, 10],
  },
  specialist: {
    tag: "RELIABILITY",
    price: [350, 450],
    accuracy: [0.6, 0.7],
    speed: [0.95, 1.1],
    reliability: [0.85, 0.95],
    tokenCost: [0.75, 0.85],
    costPerTask: [8, 12],
  },
};

export const marketTierWeights: [MarketTierKey, number][] = [
  ["junior", 30],
  ["regular", 30],
  ["senior", 25],
  ["specialist", 15],
];

export const marketTypeWeights: [AgentType, number][] = [
  ["coder", 1],
  ["researcher", 1],
  ["tester", 1],
  ["devops", 1],
  ["creative", 1],
];

export const AGENT_NAMES = [
  "Nova", "Byte", "Pixel", "Quantum", "Echo", "Logic", "Atlas", "Orbit", "Zenith", "Pulse",
  "Circuit", "Flux", "Halo", "Drift", "Spark", "Vertex", "Rex", "Gizmo", "Widget", "Turbo",
  "Mango", "Sable", "Tango", "Vesper", "Wren", "Onyx", "Kite", "Lumen", "Dash", "Aero",
];

const ROMAN = ["II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export function dedupeName(name: string, taken: Set<string>): string {
  if (!taken.has(name)) return name;
  for (let i = 0; i < ROMAN.length; i++) {
    const candidate = `${name}-${ROMAN[i]}`;
    if (!taken.has(candidate)) return candidate;
  }
  let n = ROMAN.length + 2;
  for (;;) {
    const candidate = `${name}-${n}`;
    if (!taken.has(candidate)) return candidate;
    n++;
  }
}

export const SKILL_TAGS: Record<AgentType, Skill[]> = {
  coder: ["coding"],
  researcher: ["research"],
  tester: ["testing"],
  devops: ["devops"],
  creative: ["creative"],
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const INITIAL_AGENTS: Agent[] = [
  {
    id: uuid(),
    name: "Coder",
    type: "coder",
    level: 1,
    costPerTask: 5,
    tokenCost: 1.0,
    speed: 1.0,
    accuracy: 0.62,
    reliability: 0.6,
    energy: 100,
    maxEnergy: 100,
    experience: 0,
    xpToNext: XP_TO_NEXT(1),
    specialization: SKILL_TAGS.coder,
    status: "idle",
    fatigue: "none",
    cooldownUntil: 0,
    resting: false,
  },
  {
    id: uuid(),
    name: "Researcher",
    type: "researcher",
    level: 1,
    costPerTask: 4,
    tokenCost: 0.9,
    speed: 0.9,
    accuracy: 0.66,
    reliability: 0.55,
    energy: 100,
    maxEnergy: 100,
    experience: 0,
    xpToNext: XP_TO_NEXT(1),
    specialization: SKILL_TAGS.researcher,
    status: "idle",
    fatigue: "none",
    cooldownUntil: 0,
    resting: false,
  },
  {
    id: uuid(),
    name: "Tester",
    type: "tester",
    level: 1,
    costPerTask: 3,
    tokenCost: 0.8,
    speed: 0.85,
    accuracy: 0.72,
    reliability: 0.8,
    energy: 100,
    maxEnergy: 100,
    experience: 0,
    xpToNext: XP_TO_NEXT(1),
    specialization: SKILL_TAGS.tester,
    status: "idle",
    fatigue: "none",
    cooldownUntil: 0,
    resting: false,
  },
];

/** Rolls stats inside the given market tier ranges. */
export function makeAgent(type: AgentType, tier: MarketTierKey): Agent {
  const t = MARKET_TIERS[tier];
  return {
    id: uuid(),
    name: pick(AGENT_NAMES),
    type,
    level: 1,
    costPerTask: randInt(t.costPerTask[0], t.costPerTask[1]),
    tokenCost: round2(Math.random() * (t.tokenCost[1] - t.tokenCost[0]) + t.tokenCost[0]),
    speed: round2(Math.random() * (t.speed[1] - t.speed[0]) + t.speed[0]),
    accuracy: round2(Math.random() * (t.accuracy[1] - t.accuracy[0]) + t.accuracy[0]),
    reliability: round2(Math.random() * (t.reliability[1] - t.reliability[0]) + t.reliability[0]),
    energy: 100,
    maxEnergy: 100,
    experience: 0,
    xpToNext: XP_TO_NEXT(1),
    specialization: SKILL_TAGS[type],
    status: "idle",
    fatigue: "none",
    cooldownUntil: 0,
    resting: false,
  };
}

const eliteType = pickWeighted(marketTypeWeights);

/** ELITE hire spec (New Model Release event); full price 600, event sells at 420. */
export const ELITE_AGENT: Agent = {
  id: uuid(),
  name: pick(AGENT_NAMES),
  type: eliteType,
  level: 3,
  costPerTask: 20,
  tokenCost: 0.7,
  speed: 1.15,
  accuracy: 0.85,
  reliability: 0.8,
  energy: 110,
  maxEnergy: 110,
  experience: 0,
  xpToNext: XP_TO_NEXT(3),
  specialization: SKILL_TAGS[eliteType],
  status: "idle",
  fatigue: "none",
  cooldownUntil: 0,
  resting: false,
};

export function makeMarketOffer(): MarketAgent {
  const tierKey = pickWeighted(marketTierWeights);
  const type = pickWeighted(marketTypeWeights);
  const tier = MARKET_TIERS[tierKey];
  return {
    offerId: uuid(),
    agent: makeAgent(type, tierKey),
    price: randInt(tier.price[0], tier.price[1]),
    tag: tier.tag,
    expiresAt: 0,
  };
}

/** New Model Release event offer: ELITE agent, 30% off full price, expires. */
export function makeEliteOffer(expiresAt: number): MarketAgent {
  return {
    offerId: uuid(),
    agent: { ...ELITE_AGENT, id: uuid() },
    price: 420,
    tag: "ELITE",
    expiresAt,
  };
}
