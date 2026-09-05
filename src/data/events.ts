import { GameEvent } from "../types";

export const RANDOM_EVENTS: [GameEvent, number][] = [
  [
    { kind: "tokenSurcharge", label: "API Price Surge — token costs +20% for the next 3 tasks", tasksLeft: 3 },
    15,
  ],
  [{ kind: "burnout", label: "Agent Burnout" }, 15],
  [
    { kind: "clientBonus", label: "Client Bonus — next {skill} task pays 2× reward", skill: "coding" },
    15,
  ],
  [{ kind: "emergency", label: "Emergency Task — 30s deadline, 2.5× reward" }, 20],
  [{ kind: "hallucination", label: "Hallucination Incident — one agent's next task has −15% success" }, 10],
  [{ kind: "modelRelease", label: "New Model Release — ELITE agent in market, 30% off for 60s" }, 10],
  [{ kind: "tokenGrant", label: "Token Grant", amount: 1500 }, 15],
];
