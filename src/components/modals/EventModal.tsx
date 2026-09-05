import { useGameStore } from "../../store/gameStore";
import { GameEvent } from "../../types";
import { Btn, Modal } from "../ui";

const FLAVOR: Record<GameEvent["kind"], string> = {
  tokenSurcharge: "Token prices just jumped — the next 3 tasks cost 20% more tokens.",
  burnout: "One of your agents ran hot too long — 40 energy drained at random.",
  clientBonus: "A client doubled the reward — the next matching task pays 2×.",
  emergency:
    "A client needs a hero: 2.5× reward, 30s window, no penalty on failure. Accept?",
  hallucination: "Model drift detected — one agent's next task has a −15% success roll.",
  modelRelease:
    "A flagship model just dropped — ELITE agent on the market, 30% off for 60 seconds.",
  tokenGrant: "Free API credits from the vendor: +1,500 tokens.",
};

export function EventModal() {
  const event = useGameStore((s) => s.pendingEvent);
  const acceptEvent = useGameStore((s) => s.acceptEvent);
  const dismissEvent = useGameStore((s) => s.dismissEvent);
  if (!event) return null;
  const urgent = event.kind === "emergency";

  return (
    <Modal widthClass="w-[420px]">
      <div className={`p-4 border-l-4 ${urgent ? "border-orange-500" : "border-accent"}`}>
        <div
          className={`text-sm font-black tracking-wide ${
            urgent ? "text-orange-400 animate-pulse" : "text-accent"
          }`}
        >
          {urgent ? "⚠ " : "◆ "}EVENT
        </div>
        <div className="mt-2 text-xs font-bold text-slate-200">{event.label}</div>
        <div className="mt-1 text-[11px] text-slate-400 leading-relaxed">
          {FLAVOR[event.kind]}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          {urgent ? (
            <>
              <Btn variant="danger" onClick={() => dismissEvent(event)}>
                DECLINE
              </Btn>
              <Btn variant="primary" onClick={() => acceptEvent(event)}>
                ACCEPT
              </Btn>
            </>
          ) : (
            <Btn variant="primary" onClick={() => acceptEvent(event)}>
              OK
            </Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}
