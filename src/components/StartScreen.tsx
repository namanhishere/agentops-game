import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { hasSave, loadGame } from "../persistence/save";
import { Btn } from "./ui";
import { HighScores } from "./HighScores";

const HOW_TO_PLAY = [
  ["1 · ASSIGN", "Match task skills to your agents' specializations for +15% success."],
  ["2 · REWARDS", "Money covers wages and hires; tokens pay API costs — keep both flowing."],
  ["3 · GROW", "Hire from the market and pick upgrades on level-ups to climb stages."],
  ["4 · SURVIVE", "Bankruptcy, 3 critical failures or 15:00 ends the run. Finish the boss contract to win."],
] as const;

export function StartScreen() {
  const startNewRun = useGameStore((s) => s.startNewRun);
  const continueRun = useGameStore((s) => s.continueRun);
  const [showScores, setShowScores] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [saved] = useState(() => (hasSave() ? loadGame() : null));

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0c14] p-6 overflow-y-auto">
      <div className="text-5xl font-black tracking-[0.3em] text-accent drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]">
        AGENTOPS
      </div>
      <div className="mt-1 text-xs text-gold tracking-[0.5em]">: LAST TOKEN :</div>
      <div className="mt-1 text-[10px] text-slate-500">
        Build your agency. Ship contracts. Don't run dry.
      </div>

      <div className="mt-8 flex flex-col gap-2 w-64">
        <Btn variant="primary" onClick={startNewRun} className="!py-2 !text-xs">
          NEW RUN
        </Btn>
        {saved && (
          <Btn
            variant="ghost"
            onClick={continueRun}
            className="!py-2 !text-xs"
            title="Resume your saved run"
          >
            CONTINUE — {saved.phase === "running" ? "run in progress" : "saved run"} · $
            {Math.floor(saved.money).toLocaleString("en-US")} · {saved.tasksCompleted} tasks · ⏱{" "}
            {Math.max(0, Math.floor((saved.deadline - saved.runClock) / 60))}:
            {String(Math.max(0, Math.floor(saved.deadline - saved.runClock)) % 60).padStart(2, "0")}
          </Btn>
        )}
        <Btn variant="ghost" onClick={() => setShowScores((v) => !v)} className="!py-1.5 !text-[10px]">
          {showScores ? "HIDE HIGH SCORES" : "HIGH SCORES"}
        </Btn>
        <Btn variant="ghost" onClick={() => setShowHelp((v) => !v)} className="!py-1.5 !text-[10px]">
          {showHelp ? "HIDE HOW TO PLAY" : "HOW TO PLAY"}
        </Btn>
      </div>

      {showScores && (
        <div className="mt-5 w-[420px] max-w-full">
          <HighScores />
        </div>
      )}
      {showHelp && (
        <div className="mt-5 w-[420px] max-w-full bg-panel border border-white/10 rounded p-3 space-y-2">
          {HOW_TO_PLAY.map(([t, d]) => (
            <div key={t} className="flex gap-3">
              <span className="text-[10px] font-black text-accent whitespace-nowrap pt-0.5">{t}</span>
              <span className="text-[11px] text-slate-400 leading-snug">{d}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
