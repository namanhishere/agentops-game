import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";

const TONE_CLASS: Record<string, string> = {
  info: "text-slate-400",
  success: "text-success",
  failure: "text-danger",
  warning: "text-amber-400",
  money: "text-gold",
  system: "text-accent italic",
};

export function EventLog() {
  const log = useGameStore((s) => s.log);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  return (
    <div className="col-span-3 bg-panel border-t border-white/10 flex flex-col">
      <div className="px-3 pt-1 text-[10px] uppercase tracking-widest text-slate-500">
        Event log
      </div>
      <div ref={boxRef} className="flex-1 overflow-y-auto px-3 pb-2 text-[10px] leading-[1.5]">
        {log.slice(-30).map((e) => (
          <div key={e.id} className={TONE_CLASS[e.tone] ?? "text-slate-400"}>
            <span className="text-slate-600">
              [{String(Math.floor(e.ts / 60)).padStart(2, "0")}:
              {String(Math.floor(e.ts % 60)).padStart(2, "0")}]
            </span>{" "}
            {e.text}
          </div>
        ))}
        {log.length === 0 && <div className="text-slate-600">Log empty.</div>}
      </div>
    </div>
  );
}
