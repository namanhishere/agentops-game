import { useGameStore } from "../../store/gameStore";
import { Modal } from "../ui";
import { useAssign } from "../assignContext";
import { ActiveTaskRow, AssignModalContent, TaskCard } from "./TaskCard";
import { BossModal } from "../modals/BossModal";

function AssignModal() {
  const { taskId, close } = useAssign();
  if (!taskId) return null;
  return (
    <Modal onClose={close} widthClass="w-[460px]">
      <AssignModalContent taskId={taskId} onClose={close} />
    </Modal>
  );
}

export function TaskBoard() {
  const tasks = useGameStore((s) => s.tasks);
  const boss = tasks.find((t) => t.isBoss && (t.status === "available" || t.status === "active"));
  const active = tasks.filter((t) => t.status === "active" && !t.isBoss);
  const available = tasks.filter((t) => t.status === "available" && !t.isBoss);
  const { open } = useAssign();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-widest text-slate-500">
        Active tasks ({active.length})
      </div>
      <div className="px-2 space-y-1.5 max-h-[30%] overflow-y-auto shrink-0">
        {active.map((t) => (
          <ActiveTaskRow key={t.id} taskId={t.id} />
        ))}
        {active.length === 0 && (
          <div className="text-[10px] text-slate-600 px-1">Nothing in flight.</div>
        )}
      </div>
      <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-widest text-slate-500">
        Available tasks ({available.length})
      </div>
      <div className="px-2 pb-2 space-y-2 overflow-y-auto flex-1">
        {boss && <BossModal key={boss.id} />}
        {available.map((t) => (
          <TaskCard key={t.id} task={t} onAssign={open} />
        ))}
        {available.length === 0 && (
          <div className="text-[10px] text-slate-600 px-1">Queue empty — next contract inbound.</div>
        )}
      </div>
      <AssignModal />
    </div>
  );
}
