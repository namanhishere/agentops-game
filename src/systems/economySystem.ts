import { Agent, GameState } from "../types";

export const tokenPackages = [
  { money: 20, tokens: 500 },
  { money: 100, tokens: 2500 },
  { money: 400, tokens: 10000 },
];

export const recoverCost = (agent: Agent): number => 10 + agent.level * 5;

/** Store-only mutating helpers: never touch store/localStorage. */
export function payMoney(state: GameState, amount: number): void {
  state.money -= amount;
}

export function payTokens(state: GameState, amount: number): void {
  state.tokens -= amount;
}
