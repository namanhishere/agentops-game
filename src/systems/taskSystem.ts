import { Agent, RiskLevel, Skill, Task } from "../types";
import { TASK_DIFFICULTY_PENALTY, BOSS_DIFFICULTY_PENALTY, FATIGUE_PENALTY } from "../config";
import { TASK_TEMPLATES, STAGE_DIFFICULTY, SKILL_WEIGHTS } from "../data/tasks";
import { chance, pick, pickWeighted, randInt } from "../rng";
import { fatigueIndex } from "./agentSystem";

const riskFor = (d: number): RiskLevel => {
  if (d <= 3) return "LOW";
  if (d <= 5) return "MEDIUM";
  if (d <= 8) return "HIGH";
  return "CRITICAL";
};

export function generateTask(stage: number, nextId: number, skillOverride?: Skill): Task {
  const [minD, maxD] = STAGE_DIFFICULTY[Math.min(stage, 5) - 1];
  const difficulty = randInt(minD, maxD);
  const skill = skillOverride ?? pickWeighted(SKILL_WEIGHTS);
  const template = pick(TASK_TEMPLATES[skill]);
  const risk = riskFor(difficulty);

  const duration = 10 + difficulty * 2;
  const baseCost = 10 + difficulty * 5;
  const cost = risk === "CRITICAL" ? Math.round(baseCost * 1.5) : baseCost;
  const baseReward = cost * 2 + difficulty * 8;
  const rewardMoney = risk === "CRITICAL" ? baseReward * 2 : baseReward;
  const baseTokens = 40 + difficulty * 30;
  const tokenCost = risk === "CRITICAL" ? baseTokens * 2 : baseTokens;

  let failurePenalty: number;
  if (risk === "LOW") failurePenalty = 0;
  else if (risk === "MEDIUM") failurePenalty = cost;
  else if (risk === "HIGH") failurePenalty = Math.round(cost * 1.5);
  else failurePenalty = Math.round(cost * 2);
  if (failurePenalty > 0 && failurePenalty < 50) failurePenalty = 50;

  const rewardTokens = chance(0.25) ? Math.round(tokenCost * 1.5) : 0;
  const deadline = duration * 2.5 + 15;

  return {
    id: `t-${nextId}`,
    name: template.name,
    description: template.desc,
    difficulty,
    skill,
    rewardMoney,
    rewardTokens,
    cost,
    tokenCost,
    duration,
    deadline,
    risk,
    failurePenalty,
    status: "available",
    progress: 0,
  };
}

/** 4 starter tasks: coding, research, testing + one random skill. */
export function seedInitialTasks(nextId: number): Task[] {
  const skills: Skill[] = [
    "coding",
    "research",
    "testing",
    pickWeighted(SKILL_WEIGHTS),
  ];
  return skills.map((skill, i) => generateTask(1, nextId + i, skill));
}

export const effectiveDuration = (task: Task, agent: Agent): number =>
  task.duration / agent.speed;

export const effectiveTokenCost = (
  task: Task,
  agent: Agent,
  surcharge = 1,
): number => Math.max(1, Math.round(task.tokenCost * agent.tokenCost * surcharge));

export const effectiveCost = (task: Task, agent: Agent): number =>
  task.cost + agent.costPerTask;

export function successChance(
  task: Task,
  agent: Agent,
  opts?: { boss?: boolean },
): number {
  const specialized = agent.specialization.includes(task.skill);
  const penalty = opts?.boss ? BOSS_DIFFICULTY_PENALTY : TASK_DIFFICULTY_PENALTY;
  const p =
    agent.accuracy +
    (specialized ? 0.15 : -0.1) +
    (agent.level - 1) * 0.03 -
    task.difficulty * penalty -
    FATIGUE_PENALTY[fatigueIndex(agent)] -
    (task.hallucinated || agent.debuff?.kind === "scrambled" ? 0.15 : 0);
  return Math.min(0.98, Math.max(0.05, p));
}

export function failureReason(task: Task, agent: Agent): string {
  if (!agent.specialization.includes(task.skill)) {
    return "Task skill outside agent specialization";
  }
  if (task.difficulty * TASK_DIFFICULTY_PENALTY >= 0.25) {
    return "Task complexity exceeded agent capability";
  }
  if (task.hallucinated) {
    return "Agent hallucinated the output";
  }
  if (FATIGUE_PENALTY[fatigueIndex(agent)] >= 0.05) {
    return "Agent exhausted";
  }
  return "Agent performance degraded";
}
