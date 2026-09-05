import { create } from "zustand";
import {
  Agent,
  FxEvent,
  GameEvent,
  GameState,
  LogEntry,
  Task,
  UpgradeOption,
} from "../types";
import {
  BOSS_ATTEMPT_LIMIT,
  CRITICAL_FAILURE_LIMIT,
  ENERGY_COST_BASE,
  ENERGY_REGEN_IDLE,
  ENERGY_REGEN_REST,
  EVENT_MAX_GAP,
  EVENT_MIN_GAP,
  EVENT_START_STAGE,
  MARKET_REFRESH_SEC,
  MARKET_SIZE,
  MAX_AGENTS,
  RUN_DEADLINE,
  START_MONEY,
  START_TOKENS,
  TASK_POOL_SIZE,
  TICK_MS,
  TOKEN_SURCHARGE,
  TOKENS_PER_DOLLAR,
  XP_BASE,
  XP_PER_DIFFICULTY,
} from "../config";
import { randInt, uuid } from "../rng";
import { INITIAL_AGENTS, dedupeName, makeMarketOffer } from "../data/agents";
import { seedInitialTasks, generateTask } from "../systems/taskSystem";
import { effectiveCost, effectiveDuration, effectiveTokenCost, failureReason, successChance } from "../systems/taskSystem";
import {
  applyUpgrade,
  cooldownDuration,
  fatigueLevelForIndex,
  gainXp,
  rollUpgradeOptions,
  syncFatigue,
} from "../systems/agentSystem";
import { recoverCost } from "../systems/economySystem";
import { rollEvent, applyEvent } from "../systems/eventSystem";
import { ensureBossTask, stageFor } from "../systems/progressionSystem";
import { computeScore } from "../systems/scoring";
import {
  bestAgentLabel,
  clearSave,
  loadGame,
  saveGame,
  saveHighScore,
} from "../persistence/save";
import { sfx } from "../audio/sfx";

const hasSurcharge = (s: GameState): boolean =>
  s.activeEvents.some((e) => e.kind === "tokenSurcharge");
const surchargeMult = (s: GameState): number => (hasSurcharge(s) ? TOKEN_SURCHARGE : 1);

/** Deep-enough clone so in-place draft mutations never alias live state. */
function cloneState(s: GameState): GameState {
  return {
    ...s,
    agents: s.agents.map((a) => ({
      ...a,
      debuff: a.debuff ? { ...a.debuff } : undefined,
      specialization: [...a.specialization],
    })),
    tasks: s.tasks.map((t) => ({
      ...t,
      requiredSkills: t.requiredSkills ? [...t.requiredSkills] : undefined,
      bossSlots: t.bossSlots ? t.bossSlots.map((sl) => ({ ...sl })) : undefined,
    })),
    log: [...s.log],
    market: s.market.map((o) => ({ ...o, agent: { ...o.agent } })),
    activeEvents: s.activeEvents.map((e) => ({ ...e })),
    fx: [...s.fx],
  };
}

function initialState(): GameState {
  return {
    phase: "menu",
    money: START_MONEY,
    tokens: START_TOKENS,
    runClock: 0,
    deadline: RUN_DEADLINE,
    stage: 1,
    tasksCompleted: 0,
    tasksFailed: 0,
    criticalFailures: 0,
    bossAttempts: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalDifficultyPoints: 0,
    tokensWasted: 0,
    moneyEarned: 0,
    moneySpent: 0,
    agents: [],
    tasks: [],
    log: [],
    logSeq: 0,
    market: [],
    marketRefreshAt: 0,
    activeEvents: [],
    eventNextAt: 0,
    pendingFailure: null,
    pendingLevelUp: null,
    pendingEvent: null,
    pendingEmergencyTaskId: null,
    nextTaskId: 0,
    fx: [],
    settings: { sound: true },
  };
}

function pushLog(s: GameState, text: string, tone: LogEntry["tone"]): void {
  s.log.push({ id: s.logSeq++, ts: s.runClock, text, tone });
  if (s.log.length > 100) s.log.splice(0, s.log.length - 100);
}

function pushFx(s: GameState, kind: FxEvent["kind"], agentId?: string): void {
  s.fx.push({ kind, agentId, at: s.runClock });
  if (s.fx.length > 30) s.fx.splice(0, s.fx.length - 30);
}

const agentById = (s: GameState, id?: string): Agent | undefined =>
  s.agents.find((a) => a.id === id);

const taskById = (s: GameState, id: string): Task | undefined =>
  s.tasks.find((t) => t.id === id);

function isAssignable(agent: Agent, runClock: number): boolean {
  return (
    agent.status === "idle" ||
    (agent.status === "cooldown" && runClock >= agent.cooldownUntil)
  );
}

/* ------------------------------------------------------------------ */
/* Shared in-place mutators (draft only — state is never live here)    */
/* ------------------------------------------------------------------ */

function addTaskSnapshotInPlace(s: GameState, snapshot: Task): Task {
  const task: Task = {
    ...snapshot,
    id: `t-${s.nextTaskId++}`,
    status: "available",
    progress: 0,
    assignedAgentId: undefined,
    assignedAt: undefined,
    hallucinated: undefined,
    spawnedAt: undefined,
    bonusMultiplier: undefined,
    bossSlots: undefined,
  };
  s.tasks.push(task);
  return task;
}

function assignInPlace(s: GameState, taskId: string, agentId: string): boolean {
  const task = taskById(s, taskId);
  const agent = agentById(s, agentId);
  if (!task || !agent) return false;
  if (s.phase !== "running") return false;
  if (task.status !== "available" || task.isBoss) return false;
  if (!isAssignable(agent, s.runClock)) return false;
  const energyCost = ENERGY_COST_BASE + task.difficulty;
  const surcharge = surchargeMult(s);
  const cost = effectiveCost(task, agent);
  const tokens = effectiveTokenCost(task, agent, surcharge);
  if (agent.energy < energyCost || s.money < cost || s.tokens < tokens) return false;

  s.money -= cost;
  s.moneySpent += cost;
  s.tokens -= tokens;

  task.status = "active";
  task.assignedAgentId = agentId;
  task.assignedAt = s.runClock;

  agent.status = "working";
  agent.resting = false;
  agent.cooldownUntil = 0;
  agent.energy -= energyCost;
  syncFatigue(agent);

  if (agent.debuff?.kind === "scrambled") {
    task.hallucinated = true;
    agent.debuff = undefined;
  }

  // clientBonus: consumed when a task of the matching skill is assigned.
  const bonusIdx = s.activeEvents.findIndex(
    (e) => e.kind === "clientBonus" && e.skill === task.skill,
  );
  if (bonusIdx >= 0) {
    task.bonusMultiplier = 2;
    s.activeEvents.splice(bonusIdx, 1);
  }

  // tokenSurcharge: counts down over the next 3 tasks.
  const surIdx = s.activeEvents.findIndex((e) => e.kind === "tokenSurcharge");
  if (surIdx >= 0) {
    const ev = s.activeEvents[surIdx];
    if (ev.kind === "tokenSurcharge") {
      ev.tasksLeft -= 1;
      if (ev.tasksLeft <= 0) s.activeEvents.splice(surIdx, 1);
    }
  }

  pushLog(s, `${agent.name} started "${task.name}"`, "info");
  sfx.assign();
  return true;
}

function failBossAttemptInPlace(s: GameState): void {
  const boss = s.tasks.find((t) => t.isBoss && t.status === "active");
  if (!boss || !boss.bossSlots) return;
  s.bossAttempts++;
  const assigned = boss.bossSlots
    .map((sl) => sl.agentId && agentById(s, sl.agentId))
    .filter((a): a is Agent => !!a);
  const avgRel =
    assigned.length > 0
      ? assigned.reduce((sum, a) => sum + a.reliability, 0) / assigned.length
      : 0.5;
  const penalty = Math.round(boss.failurePenalty * (1 - avgRel * 0.3));
  s.money -= penalty;
  for (const agent of assigned) {
    agent.status = "idle";
    agent.resting = false;
    syncFatigue(agent);
  }
  for (const slot of boss.bossSlots) {
    slot.progress = 0;
    slot.resolved = "pending";
    slot.agentId = undefined;
  }
  const left = BOSS_ATTEMPT_LIMIT - s.bossAttempts;
  pushLog(s, `Boss attempt failed — ${left} attempts left`, "failure");
  pushFx(s, "failure");
  sfx.failure();
  if (s.bossAttempts >= BOSS_ATTEMPT_LIMIT) {
    finishRunInPlace(s, false, "3 failed boss attempts");
  }
}

function finishRunInPlace(s: GameState, victory: boolean, reason?: string): void {
  if (s.phase !== "running") return;
  const score = computeScore(s, victory);
  saveHighScore({
    score,
    date: Date.now(),
    tasksCompleted: s.tasksCompleted,
    bestAgentLabel: bestAgentLabel(s.agents),
    victory,
  });
  s.phase = victory ? "victory" : "gameover";
  if (!victory) s.gameOverReason = reason;
  // any open modal is moot once the run ends
  s.pendingFailure = null;
  s.pendingLevelUp = null;
  s.pendingEvent = null;
  s.pendingEmergencyTaskId = null;
  clearSave();
  pushLog(
    s,
    victory
      ? `BOSS CONQUERED — final score ${score}`
      : `Run over: ${reason ?? "defeat"} — score ${score}`,
    "system",
  );
  if (victory) sfx.victory();
  else sfx.gameover();
}

function resolveTaskInPlace(s: GameState, taskId: string, givenReason?: string): void {
  const task = taskById(s, taskId);
  if (!task || task.status !== "active") return;
  const agent = agentById(s, task.assignedAgentId);
  if (!agent) return;
  const surcharge = surchargeMult(s);
  const spentTokens = effectiveTokenCost(task, agent, surcharge);
  const reason = givenReason ?? failureReason(task, agent);
  const success = Math.random() < successChance(task, agent);
  s.tasks = s.tasks.filter((t) => t.id !== taskId);

  if (success) {
    const reward = Math.round(task.rewardMoney * (task.bonusMultiplier ?? 1));
    s.money += reward;
    s.tokens += task.rewardTokens;
    s.moneyEarned += reward;
    s.tasksCompleted++;
    s.totalDifficultyPoints += task.difficulty;
    s.currentStreak++;
    s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
    s.stage = stageFor(s.tasksCompleted);
    const xp = XP_BASE + task.difficulty * XP_PER_DIFFICULTY;
    const leveled = gainXp(agent, xp, true);
    agent.status = "idle";
    agent.resting = false;
    agent.cooldownUntil = 0;
    syncFatigue(agent);
    if (leveled && !s.pendingLevelUp) {
      s.pendingLevelUp = { agentId: agent.id, options: rollUpgradeOptions() };
    }
    pushLog(
      s,
      `${agent.name} completed "${task.name}" +$${reward}${
        task.rewardTokens > 0 ? ` +🪙${task.rewardTokens}` : ""
      }`,
      "success",
    );
    pushFx(s, "success", agent.id);
    pushFx(s, "cash");
    sfx.success();
    return;
  }

  // Failure
  s.tokensWasted += spentTokens;
  s.tasksFailed++;
  s.currentStreak = 0;
  const penalty = Math.round(task.failurePenalty * (1 - agent.reliability * 0.3));
  s.money -= penalty;
  let critical = false;
  if (task.risk === "CRITICAL" && !task.emergency) {
    s.criticalFailures++;
    critical = true;
  }
  agent.status = "failed";
  agent.resting = false;
  agent.cooldownUntil = s.runClock + cooldownDuration(agent);
  gainXp(agent, XP_BASE + task.difficulty * XP_PER_DIFFICULTY, false);
  // Morale hit: one fatigue tier above the energy-derived level while cooling down.
  const fieldIdx =
    agent.fatigue === "none" ? 0 : agent.fatigue === "low" ? 1 : agent.fatigue === "medium" ? 2 : 3;
  agent.fatigue = fatigueLevelForIndex(Math.min(3, fieldIdx + 1));
  const taskSnapshot: Task = {
    ...task,
    status: "available",
    progress: 0,
    assignedAgentId: undefined,
    assignedAt: undefined,
    hallucinated: undefined,
    spawnedAt: undefined,
  };
  const loss = effectiveCost(task, agent) + penalty;
  s.pendingFailure = {
    taskId,
    agentId: agent.id,
    reason,
    loss,
    taskSnapshot,
  };
  pushLog(
    s,
    `${agent.name} failed "${task.name}" — ${reason} (-$${penalty})`,
    "failure",
  );
  pushFx(s, "failure", agent.id);
  if (critical) {
    pushFx(s, "warning", agent.id);
    sfx.warning();
  }
  sfx.failure();
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export interface GameStore extends GameState {
  startNewRun: () => void;
  continueRun: () => void;
  resetRun: () => void;
  toggleSound: () => void;
  assignAgent: (taskId: string, agentId: string) => boolean;
  tick: (dtSeconds: number) => void;
  fastForward: (seconds: number) => void;
  retryTask: () => void;
  abandonFailure: () => void;
  addTaskSnapshot: (snapshot: Task) => string | null;
  restAgent: (id: string) => void;
  recoverAgent: (id: string) => void;
  hireAgent: (offerId: string) => void;
  buyTokens: (packMoney: number) => void;
  startBoss: (taskId: string, assignments: { slotIdx: number; agentId: string }[]) => boolean;
  acceptEvent: (event: GameEvent) => void;
  dismissEvent: (event: GameEvent) => void;
  pickUpgrade: (optionId: UpgradeOption["id"]) => void;
  finishRun: (victory: boolean, reason?: string) => void;
}

export const useGameStore = create<GameStore>()((set, get) => ({
  ...initialState(),

  startNewRun: () => {
    const s = initialState();
    s.phase = "running";
    s.agents = INITIAL_AGENTS.map((a) => ({ ...a, id: uuid() }));
    s.tasks = seedInitialTasks(0);
    s.nextTaskId = 4;
    s.market = Array.from({ length: MARKET_SIZE }, () => makeMarketOffer());
    s.marketRefreshAt = MARKET_REFRESH_SEC;
    pushLog(s, "Company founded — 3 agents, $500, 🪙10,000", "system");
    set(s);
  },

  continueRun: () => {
    const loaded = loadGame();
    if (!loaded) return;
    set({ ...loaded, phase: "running" });
  },

  resetRun: () => {
    clearSave();
    set({ ...initialState(), phase: "menu" });
  },

  toggleSound: () => {
    const s = get();
    set({ settings: { sound: !s.settings.sound } });
  },

  assignAgent: (taskId, agentId) => {
    const d = cloneState(get());
    const ok = assignInPlace(d, taskId, agentId);
    if (ok) set(d);
    return ok;
  },

  tick: (dtSeconds) => {
    if (get().phase !== "running") return;
    const d = cloneState(get());
    d.runClock += dtSeconds;
    d.stage = stageFor(d.tasksCompleted);

    // 2. normal task progress
    for (const task of [...d.tasks]) {
      if (task.status !== "active" || task.isBoss) continue;
      const agent = agentById(d, task.assignedAgentId);
      if (!agent) continue;
      task.progress += dtSeconds / effectiveDuration(task, agent);
      if (task.progress >= 1) resolveTaskInPlace(d, task.id);
    }
    if (d.phase !== "running") {
      set(d);
      return;
    }

    // 3. boss attempt progress
    const boss = d.tasks.find((t) => t.isBoss && t.status === "active");
    if (boss && boss.assignedAt !== undefined && boss.bossSlots) {
      const inFlight = boss.bossSlots.some(
        (sl) => sl.resolved === "pending" && sl.agentId !== undefined,
      );
      if (inFlight) {
        for (const slot of boss.bossSlots) {
          if (slot.resolved !== "pending" || !slot.agentId) continue;
          const agent = agentById(d, slot.agentId);
          if (!agent) continue;
          slot.progress += dtSeconds / (boss.duration / agent.speed);
          if (slot.progress >= 1) {
            const ok = Math.random() < successChance({ ...boss, skill: slot.skill }, agent, { boss: true });
            slot.resolved = ok ? "success" : "failed";
            if (!ok) break; // fail-fast: stop the attempt
          }
        }
        if (boss.bossSlots.some((sl) => sl.resolved === "failed")) {
          failBossAttemptInPlace(d);
        } else if (boss.bossSlots.every((sl) => sl.resolved === "success")) {
          d.money += boss.rewardMoney;
          d.tokens += boss.rewardTokens;
          d.moneyEarned += boss.rewardMoney;
          pushLog(
            d,
            `Boss contract delivered: +$${boss.rewardMoney} +🪙${boss.rewardTokens}`,
            "success",
          );
          finishRunInPlace(d, true);
        }
        if (d.phase !== "running") {
          set(d);
          return;
        }
      }
    }

    // 4. deadline checks
    for (const task of [...d.tasks]) {
      if (task.status !== "active" || task.isBoss) continue;
      if (task.assignedAt !== undefined && d.runClock - task.assignedAt > task.deadline) {
        resolveTaskInPlace(d, task.id, "Deadline exceeded");
      }
    }
    const activeBoss = d.tasks.find((t) => t.isBoss && t.status === "active");
    if (
      activeBoss &&
      activeBoss.assignedAt !== undefined &&
      activeBoss.bossSlots?.some((sl) => sl.resolved === "pending" && sl.agentId !== undefined) &&
      d.runClock - activeBoss.assignedAt > activeBoss.deadline
    ) {
      failBossAttemptInPlace(d);
    }
    for (const task of [...d.tasks]) {
      if (!task.emergency || task.status === "active") continue;
      if (task.spawnedAt !== undefined && d.runClock - task.spawnedAt > 30) {
        d.tasks = d.tasks.filter((t) => t.id !== task.id);
        if (d.pendingEmergencyTaskId === task.id) d.pendingEmergencyTaskId = null;
        pushLog(d, "Emergency contract expired — no penalty", "info");
      }
    }
    if (d.runClock >= d.deadline) {
      finishRunInPlace(d, false, "Final deadline expired");
    }
    if (d.phase !== "running") {
      set(d);
      return;
    }

    // 5. agents: energy regen + cooldown expiry + fatigue sync
    for (const agent of d.agents) {
      if (agent.status === "working") continue;
      const rate = agent.resting ? ENERGY_REGEN_REST : ENERGY_REGEN_IDLE;
      agent.energy = Math.min(agent.maxEnergy, agent.energy + rate * dtSeconds);
      if (agent.status !== "failed" && agent.status !== "cooldown") {
        syncFatigue(agent);
      }
      if (agent.status === "cooldown" && agent.cooldownUntil > 0 && d.runClock >= agent.cooldownUntil) {
        agent.cooldownUntil = 0;
        agent.status = "idle";
        syncFatigue(agent);
      }
    }

    // 6. economy: task pool, boss materialization, market
    let avail = d.tasks.filter((t) => t.status === "available" && !t.isBoss).length;
    while (avail < TASK_POOL_SIZE) {
      d.tasks.push(generateTask(d.stage, d.nextTaskId++));
      avail++;
    }
    ensureBossTask(d);
    if (d.runClock >= d.marketRefreshAt) {
      d.market = Array.from({ length: MARKET_SIZE }, () => makeMarketOffer());
      d.marketRefreshAt += MARKET_REFRESH_SEC;
    }
    d.market = d.market.map((offer) =>
      offer.expiresAt > 0 && d.runClock > offer.expiresAt ? makeMarketOffer() : offer,
    );

    // 7. random events (stage 3+)
    if (d.stage >= EVENT_START_STAGE && d.eventNextAt === 0) {
      d.eventNextAt = d.runClock + randInt(EVENT_MIN_GAP, EVENT_MAX_GAP);
    }
    if (d.stage >= EVENT_START_STAGE && d.runClock >= d.eventNextAt && !d.pendingEvent) {
      d.pendingEvent = rollEvent();
      d.eventNextAt = 0;
    }

    // 8. game over conditions
    if (d.criticalFailures >= CRITICAL_FAILURE_LIMIT) {
      finishRunInPlace(d, false, "Too many critical failures");
    } else if (d.money <= 0 && !d.tasks.some((t) => t.status === "active")) {
      const canWork = d.tasks.some(
        (t) =>
          t.status === "available" &&
          !t.isBoss &&
          d.agents.some(
            (a) =>
              isAssignable(a, d.runClock) &&
              d.money >= effectiveCost(t, a) &&
              d.tokens >= effectiveTokenCost(t, a, surchargeMult(d)) &&
              a.energy >= ENERGY_COST_BASE + t.difficulty,
          ),
      );
      if (!canWork) finishRunInPlace(d, false, "Bankrupt");
    }
    set(d);
    if (++tickCounter % 8 === 0 && d.phase === "running") saveGame(get());
  },

  fastForward: (seconds) => {
    if (get().phase !== "running") return;
    get().tick(seconds);
  },

  retryTask: () => {
    const f = get().pendingFailure;
    if (!f) return;
    const d = cloneState(get());
    d.pendingFailure = null;
    const task = addTaskSnapshotInPlace(d, f.taskSnapshot);
    const agent = agentById(d, f.agentId);
    if (!agent) {
      set(d);
      return;
    }
    agent.status = "idle";
    agent.cooldownUntil = 0;
    set(d);
    const ok = get().assignAgent(task.id, agent.id);
    if (!ok) {
      const s2 = cloneState(get());
      const a2 = agentById(s2, agent.id);
      if (a2) {
        a2.status = "failed";
        a2.cooldownUntil = s2.runClock + cooldownDuration(a2);
        pushLog(s2, "Not enough resources to retry", "failure");
        set(s2);
      }
    }
  },

  abandonFailure: () => {
    set({ pendingFailure: null });
  },

  addTaskSnapshot: (snapshot) => {
    const d = cloneState(get());
    const task = addTaskSnapshotInPlace(d, snapshot);
    set(d);
    return task.id;
  },

  restAgent: (id) => {
    const d = cloneState(get());
    const agent = agentById(d, id);
    if (!agent) return;
    if (!isAssignable(agent, d.runClock)) return;
    if (agent.resting) {
      agent.resting = false;
    } else {
      agent.resting = true;
    }
    syncFatigue(agent);
    set(d);
  },

  recoverAgent: (id) => {
    const d = cloneState(get());
    const agent = agentById(d, id);
    if (!agent || agent.status === "working") return;
    const cost = recoverCost(agent);
    if (d.money < cost) return;
    d.money -= cost;
    d.moneySpent += cost;
    agent.energy = agent.maxEnergy;
    agent.fatigue = "none";
    pushLog(d, `${agent.name} recovered to full energy for $${cost}`, "info");
    pushFx(d, "cash");
    sfx.cash();
    set(d);
  },

  hireAgent: (offerId) => {
    const d = cloneState(get());
    if (d.agents.length >= MAX_AGENTS) return;
    const idx = d.market.findIndex((o) => o.offerId === offerId);
    if (idx < 0) return;
    const offer = d.market[idx];
    if (d.money < offer.price) return;
    d.money -= offer.price;
    d.moneySpent += offer.price;
    const taken = new Set(d.agents.map((a) => a.name));
    const hired = { ...offer.agent, name: dedupeName(offer.agent.name, taken) };
    d.agents.push(hired);
    d.market[idx] = makeMarketOffer();
    pushLog(d, `Hired ${hired.name} (${offer.tag}) — $${offer.price}`, "money");
    set(d);
  },

  buyTokens: (packMoney) => {
    const d = cloneState(get());
    if (d.money < packMoney) return;
    const amount = packMoney * TOKENS_PER_DOLLAR;
    d.money -= packMoney;
    d.moneySpent += packMoney;
    d.tokens += amount;
    pushLog(d, `Bought ${amount} tokens for $${packMoney}`, "money");
    pushFx(d, "cash");
    sfx.buy();
    set(d);
  },

  startBoss: (taskId, assignments) => {
    const d = cloneState(get());
    const boss = taskById(d, taskId);
    if (!boss || !boss.isBoss || !boss.bossSlots) return false;
    if (d.phase !== "running") return false;
    if (boss.status !== "available" && boss.status !== "active") return false;
    if (assignments.length !== boss.bossSlots.length) return false;
    const seenIdx = new Set<number>();
    for (const a of assignments) {
      if (a.slotIdx < 0 || a.slotIdx >= boss.bossSlots.length || seenIdx.has(a.slotIdx)) return false;
      seenIdx.add(a.slotIdx);
      const agent = agentById(d, a.agentId);
      if (!agent || !isAssignable(agent, d.runClock)) return false;
      if (agent.energy < ENERGY_COST_BASE + boss.difficulty) return false;
    }
    if (boss.status === "available") {
      if (d.money < boss.cost || d.tokens < boss.tokenCost) return false;
      d.money -= boss.cost;
      d.moneySpent += boss.cost;
      d.tokens -= boss.tokenCost;
    }
    boss.status = "active";
    boss.assignedAt = d.runClock;
    for (const a of assignments) {
      const slot = boss.bossSlots[a.slotIdx];
      const agent = agentById(d, a.agentId)!;
      slot.agentId = agent.id;
      slot.progress = 0;
      slot.resolved = "pending";
      agent.status = "working";
      agent.resting = false;
      agent.energy -= ENERGY_COST_BASE + boss.difficulty;
      syncFatigue(agent);
    }
    pushLog(d, "Boss attempt started — 4 agents deployed", "info");
    sfx.assign();
    set(d);
    return true;
  },

  acceptEvent: (event) => {
    const d = cloneState(get());
    if (!d.pendingEvent) return;
    applyEvent(d, event);
    if (event.kind === "emergency") d.pendingEmergencyTaskId = null;
    d.pendingEvent = null;
    if (
      event.kind === "burnout" ||
      event.kind === "hallucination" ||
      event.kind === "tokenSurcharge" ||
      event.kind === "emergency"
    ) {
      sfx.warning();
    } else if (event.kind === "tokenGrant") {
      sfx.cash();
    }
    set(d);
  },

  dismissEvent: (event) => {
    const d = cloneState(get());
    if (event.kind === "emergency" && d.pendingEmergencyTaskId) {
      const eid = d.pendingEmergencyTaskId;
      const task = taskById(d, eid);
      if (task && !task.assignedAgentId && task.status === "available") {
        d.tasks = d.tasks.filter((t) => t.id !== eid);
        pushLog(d, "Emergency contract declined", "info");
      }
      d.pendingEmergencyTaskId = null;
    }
    d.pendingEvent = null;
    set(d);
  },

  pickUpgrade: (optionId) => {
    const d = cloneState(get());
    const plu = d.pendingLevelUp;
    if (!plu) return;
    const agent = agentById(d, plu.agentId);
    if (agent) applyUpgrade(agent, optionId);
    d.pendingLevelUp = null;
    if (agent) {
      pushLog(d, `${agent.name} reached Lv.${agent.level}!`, "success");
      pushFx(d, "levelup", agent.id);
    }
    sfx.levelup();
    set(d);
  },

  finishRun: (victory, reason) => {
    const d = cloneState(get());
    finishRunInPlace(d, victory, reason);
    set(d);
  },
}));

/* Dev exposure + tick bootstrap + save hooks */
let tickCounter = 0;

setInterval(() => {
  const s = useGameStore.getState();
  if (s.phase === "running") s.tick(TICK_MS / 1000);
}, TICK_MS);

const flushSave = () => {
  const s = useGameStore.getState();
  if (s.phase === "running") saveGame(s);
};
window.addEventListener("beforeunload", flushSave);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushSave();
});

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__AGENTOPS__ = useGameStore;
}
