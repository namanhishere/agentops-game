import Phaser from "phaser";
import { useGameStore } from "../../store/gameStore";
import { Agent } from "../../types";
import {
  ANCHORS,
  CARPET,
  DESK,
  FLOOR_A,
  FLOOR_B,
  GAME_H,
  GAME_W,
  MONITOR,
  RACK,
  SCREEN,
  SERVER_RACK,
  WORKSTATIONS,
} from "../config/officeLayout";
import { AgentSprite } from "../entities/AgentSprite";

const CONFETTI_COLORS = [0x22d3ee, 0xfbbf24, 0x34d399, 0xf472b6, 0xa78bfa, 0x38bdf8];

export class OfficeScene extends Phaser.Scene {
  private sprites = new Map<string, AgentSprite>();
  private anchorCursor = 0;
  private fxCursor = 0;
  private dimRect!: Phaser.GameObjects.Rectangle;
  private confetti!: Phaser.GameObjects.Particles.ParticleEmitter;
  private confettiTimer: Phaser.Time.TimerEvent | null = null;
  private lastPhase = "menu";

  constructor() {
    super("office");
  }

  create(): void {
    this.drawOffice();

    // fx particles square texture
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture("px", 4, 4);
    g.destroy();

    this.confetti = this.add.particles(0, -10, "px", {
      x: { min: 40, max: GAME_W - 40 },
      speedY: { min: 60, max: 180 },
      speedX: { min: -50, max: 50 },
      gravityY: 40,
      lifespan: 2600,
      frequency: 90,
      quantity: 3,
      scale: { start: 0.7, end: 0.15 },
      alpha: { start: 1, end: 0.5 },
      tint: CONFETTI_COLORS,
      emitting: false,
    });
    this.confetti.setDepth(60);

    this.dimRect = this.add
      .rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.55)
      .setOrigin(0)
      .setDepth(90)
      .setVisible(false);
    this.lastPhase = "menu";
    this.fxCursor = 0;
  }

  private drawOffice(): void {
    // checkerboard floor
    const fg = this.make.graphics({ x: 0, y: 0 }, false);
    const tile = 40;
    for (let y = 0; y < GAME_H; y += tile) {
      for (let x = 0; x < GAME_W; x += tile) {
        fg.fillStyle((x / tile + y / tile) % 2 === 0 ? FLOOR_A : FLOOR_B, 1);
        fg.fillRect(x, y, tile, tile);
      }
    }
    fg.generateTexture("floor", GAME_W, GAME_H);
    fg.destroy();
    this.add.image(0, 0, "floor").setOrigin(0).setDepth(0);

    // carpet under the desk area
    this.add.rectangle(0, 210, GAME_W, 160, CARPET).setOrigin(0).setDepth(1);

    // workstations
    for (const w of WORKSTATIONS) {
      // desk
      this.add.rectangle(w.x - 32, w.y + 14, 64, 6, DESK).setDepth(2);
      // monitor stand + screen
      this.add.rectangle(w.x - 12, w.y + 4, 26, 18, MONITOR).setDepth(2);
      const glow = this.add.rectangle(w.x - 12, w.y + 2, 20, 12, SCREEN).setDepth(3);
      // ambient screen flicker
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.55, to: 1 },
        duration: 900 + Math.random() * 1400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: Math.random() * 600,
      });
      // chair
      this.add.rectangle(w.x + 14, w.y + 16, 12, 12, DESK).setDepth(2);
    }

    // server rack with blinking LEDs
    const r = SERVER_RACK;
    this.add.rectangle(r.x - 20, r.y - 30, 40, 60, RACK).setDepth(2);
    for (let i = 0; i < 5; i++) {
      const led = this.add.rectangle(r.x - 10 + (i % 2) * 12, r.y - 20 + Math.floor(i / 2) * 10, 4, 4, 0x22d3ee).setDepth(3);
      this.tweens.add({
        targets: led,
        alpha: { from: 0.15, to: 1 },
        duration: 500 + Math.random() * 900,
        yoyo: true,
        repeat: -1,
        delay: i * 130,
      });
    }

    // two plant decorations
    for (const [px, py] of [
      [40, 430],
      [770, 100],
    ]) {
      this.add.circle(px, py, 14, 0x1a3327).setDepth(2);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        this.add.circle(px + Math.cos(a) * 10, py + Math.sin(a) * 10 - 6, 7, 0x2f6b3f).setDepth(3);
      }
    }
  }

  private fxText(x: number, y: number, text: string, color: string): void {
    const t = this.add
      .text(x, y, text, {
        fontFamily: "ui-monospace, monospace",
        fontSize: "12px",
        color,
      })
      .setOrigin(0.5)
      .setDepth(80);
    this.tweens.add({
      targets: t,
      y: y - 26,
      alpha: 0,
      duration: 900,
      ease: "Quad.easeOut",
      onComplete: () => t.destroy(),
    });
  }

  private burst(x: number, y: number, color: number): void {
    const e = this.add.particles(x, y, "px", {
      speed: { min: 40, max: 140 },
      lifespan: 600,
      scale: { start: 1, end: 0 },
      tint: color,
      quantity: 18,
      emitting: false,
    });
    e.setDepth(70);
    e.explode(18);
    this.time.delayedCall(800, () => e.destroy());
  }

  update(): void {
    const s = useGameStore.getState();

    // phase-driven dim / confetti
    if (s.phase !== this.lastPhase) {
      if (s.phase === "gameover" || s.phase === "victory") {
        this.dimRect.setVisible(true);
      }
      if (s.phase === "victory") {
        this.confetti.start();
        this.confettiTimer = this.time.delayedCall(5000, () => this.confetti.stop());
      }
      if (s.phase === "running") {
        this.dimRect.setVisible(false);
        this.confetti.stop();
        if (this.confettiTimer) this.confettiTimer.remove(false);
      }
      this.lastPhase = s.phase;
    }

    if (s.phase !== "running") return;

    this.reconcileAgents(s.agents);

    // behaviour per agent
    const workers: { agent: Agent; order: number }[] = [];
    for (const agent of s.agents) {
      const sprite = this.sprites.get(agent.id);
      if (!sprite) continue;
      const work = this.findWork(s, agent);
      if (work) {
        workers.push({ agent, order: work.order });
      }
    }
    workers.sort((a, b) => a.order - b.order);
    const busySet = new Set<string>();
    workers.forEach((w, i) => {
      const base = WORKSTATIONS[i % WORKSTATIONS.length];
      const x = base.x;
      const y = base.y + 12 * Math.floor(i / WORKSTATIONS.length);
      const sprite = this.sprites.get(w.agent.id)!;
      const work = this.findWork(s, w.agent)!;
      sprite.setBusy(x, y);
      busySet.add(w.agent.id);
      sprite.setProgress(work.progress);
      if (work.done) {
        // resolved slot: sprite still at desk until attempt ends
      }
      sprite.setCooldown(false);
      sprite.setResting(false);
    });
    for (const agent of s.agents) {
      const sprite = this.sprites.get(agent.id);
      if (!sprite || busySet.has(agent.id)) continue;
      sprite.returnToIdle();
      if (agent.status === "cooldown" || agent.status === "failed") {
        sprite.setCooldown(true);
        sprite.setResting(false);
      } else {
        sprite.setCooldown(false);
        sprite.setResting(agent.resting);
      }
    }

    // fx queue drain (read-only)
    const fresh = s.fx.slice(this.fxCursor);
    this.fxCursor = s.fx.length;
    for (const fx of fresh) {
      const sprite = fx.agentId ? this.sprites.get(fx.agentId) : undefined;
      const x = sprite?.x ?? 400;
      const y = (sprite?.y ?? 200) - 26;
      switch (fx.kind) {
        case "success":
          if (sprite) {
            this.burst(x, y, 0x34d399);
            this.fxText(x, y - 6, "+$", "#34d399");
            sprite.jump();
          }
          break;
        case "failure":
          if (sprite) {
            this.burst(x, y, 0xef4444);
            this.fxText(x, y - 6, "-$", "#ef4444");
          }
          break;
        case "levelup":
          if (sprite) {
            this.burst(x, y, 0xfbbf24);
            this.fxText(x, y - 10, "LEVEL UP!", "#fbbf24");
          }
          break;
        case "cash":
          this.fxText(SERVER_RACK.x, 60, "+$", "#34d399");
          break;
        case "warning":
          this.warningFlash();
          break;
      }
    }
  }

  private warningFlash(): void {
    const r = this.add
      .rectangle(0, 0, GAME_W, GAME_H, 0xef4444, 0.16)
      .setOrigin(0)
      .setDepth(85);
    this.tweens.add({
      targets: r,
      alpha: 0,
      duration: 350,
      onComplete: () => r.destroy(),
    });
  }

  private findWork(
    s: ReturnType<typeof useGameStore.getState>,
    agent: Agent,
  ): { order: number; progress: number; done: boolean } | null {
    if (agent.status !== "working") return null;
    // boss slot
    const boss = s.tasks.find((t) => t.isBoss && t.status === "active" && t.assignedAt !== undefined);
    if (boss?.bossSlots) {
      const idx = boss.bossSlots.findIndex((sl) => sl.agentId === agent.id);
      if (idx >= 0) {
        const slot = boss.bossSlots[idx];
        return {
          order: boss.assignedAt ?? 0 + idx * 0.001,
          progress: slot.progress,
          done: slot.resolved !== "pending",
        };
      }
    }
    const task = s.tasks.find(
      (t) => t.status === "active" && t.assignedAgentId === agent.id && !t.isBoss,
    );
    if (!task) return null;
    return {
      order: task.assignedAt ?? 0,
      progress: task.progress,
      done: task.progress >= 1,
    };
  }

  private reconcileAgents(agents: Agent[]): void {
    const ids = new Set(agents.map((a) => a.id));
    for (const [id, sprite] of [...this.sprites]) {
      if (!ids.has(id)) {
        sprite.destroy();
        this.sprites.delete(id);
      }
    }
    for (const agent of agents) {
      if (this.sprites.has(agent.id)) continue;
      const anchor = ANCHORS[this.anchorCursor % ANCHORS.length];
      this.anchorCursor++;
      this.sprites.set(agent.id, new AgentSprite(this, agent, anchor));
    }
  }
}
