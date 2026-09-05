import { Agent, GameEvent, GameState, LogEntry, Skill } from "../types";
import { RANDOM_EVENTS } from "../data/events";
import { pick, pickWeighted, randInt } from "../rng";
import { generateTask } from "./taskSystem";
import { makeEliteOffer } from "../data/agents";

const ALL_SKILLS: Skill[] = ["coding", "research", "testing", "devops", "creative"];

const eventTone = (event: GameEvent): LogEntry["tone"] => {
  switch (event.kind) {
    case "tokenSurcharge":
    case "burnout":
    case "hallucination":
      return "warning";
    case "tokenGrant":
      return "money";
    default:
      return "info";
  }
};

export function rollEvent(): GameEvent {
  const event = pickWeighted(RANDOM_EVENTS);
  if (event.kind === "clientBonus") {
    const skill = pick(ALL_SKILLS);
    return {
      ...event,
      skill,
      label: event.label.replace("{skill}", skill),
    };
  }
  return { ...event };
}

/** Spawns the emergency task (30s window) and flags it for the modal. */
export function spawnEmergency(state: GameState): void {
  const task = generateTask(state.stage, state.nextTaskId);
  state.nextTaskId++;
  const difficulty = randInt(7, 9);
  task.emergency = true;
  task.spawnedAt = state.runClock;
  task.difficulty = difficulty;
  task.risk = difficulty <= 8 ? "HIGH" : "CRITICAL";
  task.rewardMoney = Math.round(task.rewardMoney * 2.5);
  task.failurePenalty = 0;
  task.deadline = 30;
  task.status = "available";
  task.progress = 0;
  state.tasks.unshift(task);
  state.pendingEmergencyTaskId = task.id;
}

function logEvent(state: GameState, event: GameEvent): void {
  const text =
    event.kind === "emergency"
      ? `${event.label} — accept within 30s or it expires.`
      : event.kind === "tokenGrant"
        ? `${event.label} — +${event.amount} tokens`
        : event.label;
  state.log.push({
    id: state.logSeq++,
    ts: state.runClock,
    text,
    tone: eventTone(event),
  });
  if (state.log.length > 100) state.log.splice(0, state.log.length - 100);
}

/** Applies an event to a mutable GameState. */
export function applyEvent(state: GameState, event: GameEvent): void {
  switch (event.kind) {
    case "tokenSurcharge": {
      state.activeEvents.push({ ...event, tasksLeft: event.tasksLeft });
      break;
    }
    case "burnout": {
      if (state.agents.length > 0) {
        const agent: Agent = pick(state.agents);
        agent.energy = Math.max(0, agent.energy - 40);
      }
      break;
    }
    case "clientBonus": {
      state.activeEvents.push({ ...event });
      break;
    }
    case "emergency": {
      spawnEmergency(state);
      break;
    }
    case "hallucination": {
      if (state.agents.length > 0) {
        const agent: Agent = pick(state.agents);
        agent.debuff = { kind: "scrambled", tasksLeft: 1 };
      }
      break;
    }
    case "modelRelease": {
      const idx = state.market.findIndex((o) => o.expiresAt === 0);
      if (idx >= 0) state.market[idx] = makeEliteOffer(state.runClock + 60);
      else state.market.push(makeEliteOffer(state.runClock + 60));
      break;
    }
    case "tokenGrant": {
      state.tokens += event.amount;
      break;
    }
  }
  logEvent(state, event);
}
