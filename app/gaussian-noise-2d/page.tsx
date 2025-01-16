'use client';

import Pixi from "pixi.js";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import { useCallback, useEffect, useRef, useState } from 'react';

import CanvasManager from '@/features/CanvasManager';
import { drawPalettes } from "./drawPalettes";

export default function Home() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [canvasManager, setCanvasManager] = useState<CanvasManager | null>(null);

  const refreshCanvas = useCallback((randomSeed = false) => {
    if (canvasManager) {
      drawPalettes(canvasManager.renderer as Pixi.Application, randomSeed);
    }
  }, [canvasManager]);

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
      if (canvasManager.renderer) {
        drawPalettes(canvasManager.renderer as Pixi.Application);
      }
    }
  }, [canvasManager]);

  return (
    <div className="w-full h-full relative">
      <h2 className="fixed top-0 p-lr-24 lh-2">高斯噪点随机函数生成 2D 图案</h2>
      <div ref={ref} className="canvas-container w-full h-full" id="canvas-container"></div>

      <button
        className='absolute flex flex-col gap-8 right-40 bottom-40 pointer'
      >
        <RefreshRoundedIcon onClick={() => refreshCanvas()}/>
        <AutorenewRoundedIcon onClick={() => refreshCanvas(true)} />
      </button>
    </div>
  );
}
