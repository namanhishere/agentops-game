import { useEffect, useRef } from "react";
import { createGame } from "../game/main";

/** Full-size Phaser visual layer. Read-only over the store; never writes it. */
export function PhaserMount() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const game = createGame(el);
    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={ref} className="absolute inset-0 overflow-hidden" />;
}
