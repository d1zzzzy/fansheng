'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import CanvasManager from '@/features/CanvasManager';
import FirstScreenAnimation from './animation';

enum Dimension {
  TWO = '2d',
  THREE = 'webgl',
}

export default function Home() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dimension, setDimension] = useState(Dimension.TWO);
  const [canvasManager, setCanvasManager] = useState<CanvasManager | null>(null);

  const switchTo2D = useCallback(() => {
    setDimension(Dimension.TWO);

    if (canvasManager) {
      canvasManager.switchTo2D();
      FirstScreenAnimation(canvasManager);
    }
  }, [canvasManager]);

  const switchToWebGL = useCallback(() => {
    setDimension(Dimension.THREE);

    if (canvasManager) {
      canvasManager.switchToWebGL();
    }
  }, [canvasManager]);

  const btnText = useMemo(() => {
    return dimension === Dimension.TWO ? '3D' : '2D';
  }, [dimension]);

  const switchDimension = useCallback(() => {
    if (canvasManager) {
      canvasManager.destroy();
    }

    if (dimension === Dimension.TWO) {
      switchToWebGL();
    } else {
      switchTo2D();
    }
  }, [canvasManager, dimension, switchTo2D, switchToWebGL]);

  useEffect(() => {
    if (ref.current) {
      const instance = new CanvasManager(ref.current);

      instance.switchTo2D();
      setCanvasManager(instance);
      FirstScreenAnimation(instance);
    }
  }, []);

  return (
    <div className="w-full h-full">
      <div ref={ref} className="canvas-container w-full h-full" id="canvas-container"></div>

      <button className="btn btn--primary fixed right-20 bottom-20" onClick={switchDimension}>{ btnText }</button>
    </div>
  );
}
