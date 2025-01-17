import { useEffect, useRef } from 'react';

export const useWebGL = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  const glRef = useRef<WebGLRenderingContext | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('Unable to initialize WebGL.');
      return;
    }
    glRef.current = gl;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [canvasRef]);

  const getGLContext = () => glRef.current;

  return { getGLContext };
};
