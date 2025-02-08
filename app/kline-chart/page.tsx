'use client'

import { useLayoutEffect, useRef} from "react"

import { KLineChart } from './core'
import { OverlayCanvas } from './overlay'

export default function KLineChartPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const overLayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const klineInsRef = useRef<KLineChart | null>(null)
  const overlayInsRef = useRef<OverlayCanvas | null>(null)

  useLayoutEffect(() => {
    if (canvasRef.current && overLayCanvasRef.current) {
      klineInsRef.current = new KLineChart(canvasRef.current)
      overlayInsRef.current = new OverlayCanvas(overLayCanvasRef.current)
    }
  }, []);

  return (
    <article className='w-full h-full'>
      <section className='h-full relative'>
        <canvas ref={canvasRef} className='w-full h-full absolute left-0 top-0'></canvas>
        <canvas ref={overLayCanvasRef} className='w-full h-full absolute left-0 top-0 cursor-crosshair'></canvas>
      </section>
    </article>
  )
}
