'use client';

import { useEffect } from 'react';

import CanvasManager from '@/features/CanvasManager';
import type { CanvasOptions, Point } from '@/features/CanvasManager/interface';
import FirstScreenAnimation from './animation';

export default function Home() {
  useEffect(() => {
    // 初始化画布
    const container = document.getElementById('canvas-container') as HTMLDivElement;
    const canvasManager = new CanvasManager(container);

    FirstScreenAnimation(canvasManager);
  }, []);

  return (
    <div className="w-full h-full">
      <div className="canvas-container w-full h-full" id="canvas-container"></div>
    </div>
  );
}
