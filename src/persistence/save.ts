import { Agent, GameState } from "../types";

const SAVE_KEY = "agentops.save.v1";
const HIGHSCORES_KEY = "agentops.highscores.v1";

export interface HighScore {
  score: number;
  date: number;
  tasksCompleted: number;
  bestAgentLabel: string;
  victory: boolean;
}

export function saveGame(state: GameState): void {
  try {
    const copy: GameState = {
      ...state,
      fx: [],
      log: state.log.slice(-100),
    };
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ version: 1, savedAt: Date.now(), state: copy }),
    );
  } catch {
    /* localStorage unavailable — game runs in memory */
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      parsed.version !== 1 ||
      parsed.state === null ||
      typeof parsed.state !== "object" ||
      typeof parsed.state.phase !== "string"
    ) {
      return null;
    }
    const state: GameState = parsed.state;
    state.fx = [];
    if (
      state.pendingEmergencyTaskId !== null &&
      state.pendingEmergencyTaskId !== undefined &&
      !state.tasks.some((t) => t.id === state.pendingEmergencyTaskId)
    ) {
      state.pendingEmergencyTaskId = null;
    }
    if (
      state.pendingFailure &&
      !state.tasks.some((t) => t.id === state.pendingFailure?.taskId)
    ) {
      state.pendingFailure = null;
    }
    return state;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadHighScores(): HighScore[] {
  try {
    const raw = localStorage.getItem(HIGHSCORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) =>
        e !== null &&
        typeof e === "object" &&
        typeof e.score === "number" &&
        typeof e.date === "number",
    );
  } catch {
    return [];
  }
}

export function saveHighScore(entry: HighScore): void {
  try {
    const scores = [...loadHighScores(), entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(scores));
  } catch {
    /* ignore */
  }
}

export function bestAgentLabel(agents: Agent[]): string {
  if (agents.length === 0) return "—";
  let best = agents[0];
  for (const a of agents) {
    if (a.level > best.level) best = a;
  }
  return `${best.name} Lv.${best.level}`;
}
