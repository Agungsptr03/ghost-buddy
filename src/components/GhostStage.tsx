import { useEffect, useRef } from "react";
import { startGhost } from "../ghost/engine";
import styles from "./GhostStage.module.css";

export function GhostStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    return canvas ? startGhost(canvas) : undefined;
  }, []);
  return (
    <main className={styles.stage}>
      <h1 className={styles.title}>Ghost Buddy</h1>
      <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label="A glowing cosmic jellyfish that follows your cursor, smiles when you hover it and pulses when you click it." />
    </main>
  );
}
