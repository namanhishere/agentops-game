import { useGameStore } from "../../store/gameStore";
import { Btn, Modal } from "../ui";
import { useAssign } from "../assignContext";

export function FailureModal() {
  const pending = useGameStore((s) => s.pendingFailure);
  const agents = useGameStore((s) => s.agents);
  const retryTask = useGameStore((s) => s.retryTask);
  const abandonFailure = useGameStore((s) => s.abandonFailure);
  const addTaskSnapshot = useGameStore((s) => s.addTaskSnapshot);
  const { open } = useAssign();

  if (!pending) return null;
  const agent = agents.find((a) => a.id === pending.agentId);

  return (
    <Modal widthClass="w-[440px]">
      <div className="p-4 animate-shake-in">
        <div className="text-sm font-black text-danger tracking-wide">⚠ AGENT FAILURE</div>
        <div className="mt-2 text-xs text-slate-200">
          <span className="font-bold">{agent?.name ?? "Agent"}</span> failed: "
          <span className="text-slate-400">{pending.taskSnapshot.name}</span>"
        </div>
        <div className="mt-1 text-[11px] text-amber-300">Reason: {pending.reason}</div>
        <div className="mt-1 text-[11px] text-danger">Loss: -${pending.loss}</div>
        <div className="mt-3 flex justify-end gap-2">
          <Btn variant="danger" onClick={abandonFailure}>
            ABANDON
          </Btn>
          <Btn
            variant="ghost"
            onClick={() => {
              const newId = addTaskSnapshot(pending.taskSnapshot);
              abandonFailure();
              if (newId) open(newId);
            }}
          >
            REASSIGN
          </Btn>
          <Btn variant="primary" onClick={retryTask}>
            RETRY
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
