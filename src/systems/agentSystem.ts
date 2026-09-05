import { Agent, FatigueLevel, UpgradeOption } from "../types";
import { FATIGUE_THRESHOLDS, LEVEL_CAP, XP_TO_NEXT, COOLDOWN_AFTER_FAIL } from "../config";

const FATIGUE_LEVELS: FatigueLevel[] = ["none", "low", "medium", "high"];

/** 0..3 from energy % vs FATIGUE_THRESHOLDS. */
export function fatigueIndex(agent: Agent): number {
  const pct = (agent.energy / agent.maxEnergy) * 100;
  if (pct >= FATIGUE_THRESHOLDS[0]) return 0;
  if (pct >= FATIGUE_THRESHOLDS[1]) return 1;
  if (pct >= FATIGUE_THRESHOLDS[2]) return 2;
  return 3;
}

export const fatigueLevelForIndex = (idx: number): FatigueLevel =>
  FATIGUE_LEVELS[Math.min(3, Math.max(0, idx))];

/** Sync display fatigue from current energy. */
export function syncFatigue(agent: Agent): void {
  agent.fatigue = fatigueLevelForIndex(fatigueIndex(agent));
}

/**
 * Mutates agent with XP; returns true when at least one level-up occurred.
 * When allowLevelUp is false only half XP is granted (failure XP, never levels).
 */
export function gainXp(agent: Agent, xp: number, allowLevelUp = true): boolean {
  if (!allowLevelUp) {
    agent.experience += Math.floor(xp / 2);
    return false;
  }
  agent.experience += xp;
  let leveled = false;
  while (agent.level < LEVEL_CAP && agent.experience >= agent.xpToNext) {
    agent.experience -= agent.xpToNext;
    agent.level++;
    agent.xpToNext = XP_TO_NEXT(agent.level);
    agent.accuracy = Math.min(0.98, agent.accuracy + 0.02);
    agent.speed += 0.04;
    agent.reliability = Math.min(0.99, agent.reliability + 0.02);
    agent.maxEnergy += 5;
    agent.energy += 5;
    agent.tokenCost = Math.max(0.5, agent.tokenCost * 0.98);
    leveled = true;
  }
  return leveled;
}

export function applyUpgrade(agent: Agent, id: UpgradeOption["id"]): void {
  switch (id) {
    case "speed":
      agent.speed = Math.round(agent.speed * 1.08 * 100) / 100;
      break;
    case "accuracy":
      agent.accuracy = Math.min(0.98, agent.accuracy + 0.04);
      break;
    case "reliability":
      agent.reliability = Math.min(0.99, agent.reliability + 0.05);
      break;
    case "tokenEfficiency":
      agent.tokenCost = Math.max(0.5, agent.tokenCost * 0.95);
      break;
    case "energy":
      agent.maxEnergy += 15;
      agent.energy += 15;
      break;
  }
}

const UPGRADE_META: { id: UpgradeOption["id"]; label: string; detail: string }[] = [
  { id: "speed", label: "Speed +8%", detail: "Finish tasks 8% faster" },
  { id: "accuracy", label: "Accuracy +4%", detail: "+4% base success chance" },
  { id: "reliability", label: "Reliability +5%", detail: "Smaller failure penalties" },
  { id: "tokenEfficiency", label: "Token use −5%", detail: "Tasks cost 5% fewer tokens" },
  { id: "energy", label: "Energy capacity +15", detail: "+15 max and current energy" },
];

export function rollUpgradeOptions(): UpgradeOption[] {
  const pool = [...UPGRADE_META];
  const out: UpgradeOption[] = [];
  while (out.length < 3 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const meta = pool.splice(idx, 1)[0];
    out.push({ id: meta.id, label: meta.label, detail: meta.detail });
  }
  return out;
}

export const cooldownDuration = (agent: Agent): number =>
  Math.max(4, Math.round(COOLDOWN_AFTER_FAIL(agent.reliability) * 10) / 10);
