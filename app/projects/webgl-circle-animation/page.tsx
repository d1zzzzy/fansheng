"use client";

import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {Application, Shader, Geometry, Mesh } from "pixi.js";

import vertex from "./triangleTextured.vert";
import fragment from "./triangleTextured.frag";

export default function WebGLCircleAnimation() {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const [app, setApp] = useState<Application | null>(null);

  useLayoutEffect(() => {
    async function init() {
      if (canvasEl.current) {
        const _app = new Application();

        const width = 1024;
        const height = 800;

        await _app.init({
          canvas: canvasEl.current,
          width,
          height,
          backgroundColor: 0xffffff,
          preference: 'webgl',
        });

        const geometry = new Geometry({
          attributes: {
            aPosition: [
              0, 0,
              width, 0,
              width, height,
              0, height,
              width, height,
              0, 0,
            ],
          },
        });

        const shader = Shader.from({
          gl: {
            vertex,
            fragment,
          },
          resources: {
            shaderUniforms: {
              uTime: {
                value: 0,
                type: 'f32',
              },
              uSize: {
                value: [width, height],
                type: 'vec2<f32>',
              },
            }
          }
        });

        const triangle = new Mesh({
          geometry,
          shader,
        });

        triangle.width = width;
        triangle.height = height;
        triangle.x = 0;
        triangle.y = 0;

        _app.stage.addChild(triangle);

        const animate = () => {
          shader.resources.shaderUniforms.uniforms.uTime += _app.ticker.elapsedMS / 1000
        }

        _app.ticker.add(animate);

        setApp(_app);
      }
    }

    init().then(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (app) {
        app.destroy();
      }
    };
  }, [app]);

  return (
    <main className="page flex flex-col justify-center items-center p-24">
      <h1 className="text-4xl font-bold text-center">Shader Noise Animation</h1>

      <div className="flex justify-center w-full mx-auto">
        <canvas ref={canvasEl} id="webgl" className="w-80per h-80per shadow-sm"></canvas>
      </div>
    </main>
  );
}
