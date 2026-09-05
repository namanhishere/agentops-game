import Phaser from "phaser";
import { Agent } from "../../types";
import { TYPE_COLORS, ELITE_TRIM } from "../config/officeLayout";

const BAR_W = 24;
const BAR_H = 3;

/**
 * One agent's on-screen body: procedural pixel robot + name + progress bar.
 * All animation methods are idempotent; the scene calls them from state diffs.
 */
export class AgentSprite extends Phaser.GameObjects.Container {
  readonly agentId: string;
  private readonly robot: Phaser.GameObjects.Image;
  private readonly bar: Phaser.GameObjects.Graphics;
  private readonly zzz: Phaser.GameObjects.Text;
  private readonly anchor: { x: number; y: number };
  private restingShown = false;
  private coolingShown = false;
  private busyAt: { x: number; y: number } | null = null;

  constructor(scene: Phaser.Scene, agent: Agent, anchor: { x: number; y: number }) {
    super(scene, anchor.x, anchor.y);
    this.agentId = agent.id;
    this.anchor = anchor;

    const color = TYPE_COLORS[agent.type];
    const elite = agent.level >= 3;
    const key = `agent-${agent.id}`;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    // body
    g.fillStyle(color, 1);
    g.fillRoundedRect(-9, -8, 18, 16, 4);
    // darker legs
    g.fillStyle(0x0a0c14, 0.85);
    g.fillRect(-7, 8, 4, 4);
    g.fillRect(3, 8, 4, 4);
    // eye pixels
    g.fillStyle(0xffffff, 1);
    g.fillRect(-5, -3, 3, 3);
    g.fillRect(2, -3, 3, 3);
    // antenna
    g.lineStyle(2, color, 1);
    g.lineBetween(0, -8, 0, -12);
    g.fillStyle(color, 1);
    g.fillCircle(0, -13, 2);
    if (elite) {
      g.lineStyle(2, ELITE_TRIM, 1);
      g.strokeRoundedRect(-10, -9, 20, 18, 5);
    }
    g.generateTexture(key, 28, 28);
    g.destroy();

    this.robot = scene.add.image(0, 0, key);
    this.bar = scene.add.graphics();
    this.bar.setVisible(false);
    this.zzz = scene.add
      .text(10, -20, "z Z z", {
        fontFamily: "ui-monospace, monospace",
        fontSize: "9px",
        color: "#7dd3fc",
      })
      .setOrigin(0, 0.5)
      .setAlpha(0);

    this.add([this.robot, this.bar, this.zzz]);
    this.nameLabel = scene.add
      .text(0, -22, agent.name, {
        fontFamily: "ui-monospace, monospace",
        fontSize: "8px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5);
    this.add(this.nameLabel);
    scene.add.existing(this);
    this.setDepth(10);
  }

  nameLabel: Phaser.GameObjects.Text;

  setProgress(v: number): void {
    const w = Math.round(Math.min(1, Math.max(0, v)) * BAR_W);
    this.bar.setVisible(true);
    this.bar.clear();
    this.bar.fillStyle(0xffffff, 0.18);
    this.bar.fillRect(-BAR_W / 2, 8, BAR_W, BAR_H);
    this.bar.fillStyle(0x22d3ee, 1);
    this.bar.fillRect(-BAR_W / 2, 8, w, BAR_H);
  }

  hideProgress(): void {
    this.bar.setVisible(false);
  }

  /** Walk to a workstation and start bobbing + progress display. */
  setBusy(x: number, y: number): void {
    if (this.busyAt && this.busyAt.x === x && this.busyAt.y === y) return;
    this.stopIdleFx();
    this.busyAt = { x, y };
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration: 600,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (this.busyAt) {
          this.scene.tweens.add({
            targets: this,
            y: y - 2,
            duration: 420,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        }
      },
    });
  }

  returnToIdle(): void {
    this.stopIdleFx();
    this.busyAt = null;
    this.hideProgress();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      x: this.anchor.x,
      y: this.anchor.y,
      duration: 500,
      ease: "Sine.easeInOut",
    });
  }

  /** Short celebratory jump at the current spot. */
  jump(): void {
    this.scene.tweens.add({
      targets: this,
      y: this.y - 14,
      duration: 200,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  setCooldown(on: boolean): void {
    if (this.coolingShown === on) return;
    this.coolingShown = on;
    this.robot.setTint(on ? 0x64748b : 0xffffff);
  }

  setResting(on: boolean): void {
    if (this.restingShown === on) return;
    this.restingShown = on;
    if (on) {
      this.zzz.setAlpha(0);
      this.scene.tweens.add({
        targets: this.zzz,
        alpha: 1,
        y: this.zzz.y - 4,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else {
      this.scene.tweens.killTweensOf(this.zzz);
      this.zzz.setAlpha(0);
    }
  }

  private stopIdleFx(): void {
    this.restingShown = false;
    this.coolingShown = false;
    this.zzz.setAlpha(0);
    this.scene.tweens.killTweensOf(this.zzz);
    this.scene.tweens.killTweensOf(this);
    this.robot.clearTint();
  }

  destroy(fromScene?: boolean): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.zzz);
    super.destroy(fromScene);
  }
}
