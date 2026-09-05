import Phaser from "phaser";
import { OfficeScene } from "./scenes/OfficeScene";
import { GAME_H, GAME_W } from "./config/officeLayout";

export function createGame(parent: HTMLElement): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_W,
    height: GAME_H,
    backgroundColor: 0x0a0c14,
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    preserveDrawingBuffer: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [OfficeScene],
  });
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__AGENTOPS_GAME__ = game;
  }
  return game;
}
