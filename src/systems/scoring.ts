import { GameState } from "../types";
import { VICTORY_BONUS } from "../config";

export function computeScore(state: GameState, victory: boolean): number {
  const avgAgentLevel =
    state.agents.length > 0
      ? state.agents.reduce((sum, a) => sum + a.level, 0) / state.agents.length
      : 0;
  const score =
    state.tasksCompleted * 100 +
    state.totalDifficultyPoints * 25 +
    Math.floor(Math.max(0, state.money)) * 2 +
    Math.round(avgAgentLevel * 10) / 10 * 150 +
    state.bestStreak * 50 -
    state.tasksFailed * 150 -
    Math.floor(state.tokensWasted * 0.02) +
    (victory ? VICTORY_BONUS : 0);
  return Math.max(0, Math.round(score));
}
