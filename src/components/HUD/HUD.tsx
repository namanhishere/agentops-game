import { useEffect, useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { RUN_DEADLINE } from "../../config";
import { tokenPackages } from "../../systems/economySystem";
import { Btn, fmtClock, fmtMoney, fmtTokens, MoneyText, Panel, TokenText } from "../ui";
import { hasSave } from "../../persistence/save";

export function HUD() {
  const money = useGameStore((s) => s.money);
  const tokens = useGameStore((s) => s.tokens);
  const runClock = useGameStore((s) => s.runClock);
  const stage = useGameStore((s) => s.stage);
  const currentStreak = useGameStore((s) => s.currentStreak);
  const sound = useGameStore((s) => s.settings.sound);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const buyTokens = useGameStore((s) => s.buyTokens);
  const [tokensOpen, setTokensOpen] = useState(false);
  const [saveDot, setSaveDot] = useState(false);

  const remaining = RUN_DEADLINE - runClock;
  const lowTime = remaining < 60;

  useEffect(() => {
    const iv = setInterval(() => setSaveDot(hasSave()), 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="col-span-3 flex items-center gap-3 px-3 py-1.5 bg-panel border-b border-white/10">
      <div className="text-accent font-black tracking-[0.25em] text-sm">AGENTOPS</div>
      <div className="text-[10px] text-slate-500">LAST TOKEN</div>
      <span className="mx-1 h-4 w-px bg-white/10" />
      <MoneyText value={money} />
      <TokenText value={tokens} />
      <span
        title="Time until the final deadline"
        className={`font-mono text-sm font-bold ${lowTime ? "text-danger animate-pulse" : "text-slate-200"}`}
      >
        ⏱ {fmtClock(remaining)}
      </span>
      <span
        title="Current stage — completed tasks unlock harder work"
        className={`px-1.5 py-0.5 text-[10px] border rounded font-bold ${
          stage >= 6
            ? "bg-gold/15 text-gold border-gold/40 animate-pulse"
            : "bg-panel2 text-slate-300 border-white/15"
        }`}
      >
        {stage >= 6 ? "BOSS" : `STAGE ${stage}/5`}
      </span>
      {currentStreak >= 2 && (
        <span title="Consecutive task successes" className="text-xs text-orange-400">
          🔥 x{currentStreak}
        </span>
      )}
      <span
        title="Auto-save active (every ~2s)"
        className={`w-2 h-2 rounded-full ${saveDot ? "bg-success" : "bg-white/15"}`}
      />
      <div className="ml-auto flex items-center gap-2">
        <Btn
          title="Hire new agents"
          variant="success"
          className="hidden"
          onClick={() => {}}
        >
          HIRE
        </Btn>
        <div className="relative">
          <Btn variant="primary" onClick={() => setTokensOpen((v) => !v)}>
            +TOKENS
          </Btn>
          {tokensOpen && (
            <Panel className="absolute right-0 top-full mt-1 z-40 w-56 p-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 px-1">
                Buy tokens — 25 🪙 per $
              </div>
              {tokenPackages.map((p) => (
                <div
                  key={p.money}
                  className="flex items-center justify-between px-1 py-0.5 rounded hover:bg-white/5"
                >
                  <span className="text-[11px] text-slate-300">
                    {fmtMoney(p.money)} → {fmtTokens(p.tokens)}
                  </span>
                  <Btn
                    variant="ghost"
                    disabled={money < p.money}
                    onClick={() => {
                      buyTokens(p.money);
                      setTokensOpen(false);
                    }}
                  >
                    BUY
                  </Btn>
                </div>
              ))}
            </Panel>
          )}
        </div>
        <Btn variant="ghost" title={sound ? "Sound on — click to mute" : "Sound off"} onClick={toggleSound}>
          {sound ? "🔊" : "🔇"}
        </Btn>
      </div>
    </div>
  );
}
