import { useRef } from "react";

/** Full-size visual layer. Phaser wiring lands in Step 5. */
export function PhaserMount() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-[#0a0c14]">
      <div className="h-full w-full flex items-center justify-center text-slate-700 text-xs">
        OFFICE VIEW — incoming
      </div>
    </div>
  );
}
