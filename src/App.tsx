import { useGameStore } from "./store/gameStore";
import { PhaserMount } from "./components/PhaserMount";
import { HUD } from "./components/HUD/HUD";
import { AgentPanel } from "./components/AgentPanel/AgentPanel";
import { TaskBoard } from "./components/TaskBoard/TaskBoard";
import { EventLog } from "./components/EventLog";
import { FailureModal } from "./components/modals/FailureModal";
import { LevelUpModal } from "./components/modals/LevelUpModal";
import { GameOverScreen } from "./components/GameOver/GameOverScreen";
import { AssignProvider } from "./components/assignContext";
import { Btn } from "./components/ui";

function StartScreenPlaceholder() {
  const startNewRun = useGameStore((s) => s.startNewRun);
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#0a0c14]">
      <div className="text-5xl font-black tracking-[0.3em] text-accent">AGENTOPS</div>
      <div className="text-xs text-slate-500 tracking-widest">LAST TOKEN</div>
      <Btn onClick={startNewRun}>NEW RUN</Btn>
    </div>
  );
}

function VictoryPlaceholder() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
      <div className="text-4xl font-black text-gold">VICTORY!</div>
    </div>
  );
}

export default function App() {
  const phase = useGameStore((s) => s.phase);
  return (
    <AssignProvider>
      <div className="h-full w-full relative overflow-hidden">
        {phase !== "menu" && <PhaserMount />}
        {phase === "menu" && <StartScreenPlaceholder />}
        {phase === "running" && (
          <div className="absolute inset-0 z-10 h-full grid grid-cols-[280px_1fr_320px] grid-rows-[auto_1fr_140px]">
            <HUD />
            <div className="overflow-y-auto bg-panel/85 border-r border-white/10">
              <AgentPanel />
            </div>
            {/* center column is a transparent spacer: canvas shows through */}
            <div />
            <div className="bg-panel/85 border-l border-white/10 overflow-hidden">
              <TaskBoard />
            </div>
            <EventLog />
          </div>
        )}
        {phase === "gameover" && <GameOverScreen />}
        {phase === "victory" && <VictoryPlaceholder />}
        <FailureModal />
        <LevelUpModal />
      </div>
    </AssignProvider>
  );
}
