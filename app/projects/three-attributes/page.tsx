"use client";

import {useLayoutEffect, useRef} from "react";

import {draw} from "./draw";

export default function ThreeAttributes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (canvasRef.current) {
      draw(canvasRef.current);
    }
  }, []);

  return (
    <main className="page p-24 border-box">
      <h1 className="text-4xl font-bold text-center">Three Attributes Demo</h1>

      <div className="content mx-auto">
        <canvas ref={canvasRef} id="webgl" className="w-full h-full shadow-sm"></canvas>
      </div>
    </main>
  );
}
