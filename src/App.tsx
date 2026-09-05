import { useGameStore } from "./store/gameStore";
import { PhaserMount } from "./components/PhaserMount";
import { HUD } from "./components/HUD/HUD";
import { AgentPanel } from "./components/AgentPanel/AgentPanel";
import { TaskBoard } from "./components/TaskBoard/TaskBoard";
import { EventLog } from "./components/EventLog";
import { FailureModal } from "./components/modals/FailureModal";
import { LevelUpModal } from "./components/modals/LevelUpModal";
import { EventModal } from "./components/modals/EventModal";
import { GameOverScreen } from "./components/GameOver/GameOverScreen";
import { VictoryScreen } from "./components/GameOver/VictoryScreen";
import { StartScreen } from "./components/StartScreen";
import { AssignProvider } from "./components/assignContext";

/** Desktop (lg+): side panels flank the canvas. */
function RunningDesktop() {
  return (
    <div className="hidden lg:grid absolute inset-0 z-10 h-full grid-cols-[280px_1fr_320px] grid-rows-[auto_1fr_140px]">
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
  );
}

/** Mobile (<lg): agents strip on top, canvas center, tasks + log below. */
function RunningMobile() {
  return (
    <div className="lg:hidden absolute inset-0 z-10 flex flex-col">
      <HUD />
      <div className="bg-panel/85 border-b border-white/10">
        <AgentPanel horizontal />
      </div>
      {/* canvas shows through here */}
      <div className="flex-1" />
      <div className="h-[42%] bg-panel/90 border-t border-white/10 overflow-hidden">
        <TaskBoard />
      </div>
      <div className="h-28 shrink-0">
        <EventLog />
      </div>
    </div>
  );
}

export default function App() {
  const phase = useGameStore((s) => s.phase);
  return (
    <AssignProvider>
      <div className="h-full w-full relative overflow-hidden">
        {phase !== "menu" && <PhaserMount />}
        {phase === "menu" && <StartScreen />}
        {phase === "running" && (
          <>
            <RunningDesktop />
            <RunningMobile />
          </>
        )}
        {phase === "gameover" && <GameOverScreen />}
        {phase === "victory" && <VictoryScreen />}
        <FailureModal />
        <LevelUpModal />
        <EventModal />
      </div>
    </AssignProvider>
  );
}
