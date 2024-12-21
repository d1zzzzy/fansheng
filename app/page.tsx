'use client';

import { useEffect, useRef, useState} from 'react';

import CanvasManager from '@/features/CanvasManager';
import {drawPalettes} from "@/app/drawPalettes";
import {PixiRenderer} from "@/features/CanvasManager/core/PixiManager";
import Pixi from "pixi.js";

export default function Home() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [canvasManager, setCanvasManager] = useState<CanvasManager | null>(null);

  useEffect(() => {
    if (ref.current) {
      const instance = new CanvasManager(ref.current);

      instance.switchToPixi().then(() => {
        setCanvasManager(instance);
      });
    }
  }, []);

  useEffect(() => {
    if (canvasManager) {
      console.log('canvasManager', canvasManager, canvasManager.renderer instanceof PixiRenderer)
      if (canvasManager.renderer) {
        drawPalettes(canvasManager.renderer as Pixi.Application);
      }
    }
  }, [canvasManager]);

  return (
    <div className="w-full h-full">
      <div ref={ref} className="canvas-container w-full h-full" id="canvas-container"></div>
    </div>
  );
}
