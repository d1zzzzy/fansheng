'use client';

import { useEffect, useRef } from 'react';

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);
const randColor = () => `hsl(${randInt(0, 360)}, 100%, 50%)`;


export default function NewYearFireWork() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fireworks: any[] = [];
  const explosions: any[] = [];
  let animationFrameId: number;
  let lastLaunchTime = 0; // 记录上次发射的时间
  const launchInterval = 500; // 发射间隔，单位为毫秒

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      let maxx = window.innerWidth;
      let maxy = window.innerHeight;

      canvasRef.current.width = maxx;
      canvasRef.current.height = maxy;

      window.addEventListener("resize", () => {
        maxx = window.innerWidth;
        maxy = window.innerHeight;
        canvasRef.current!.width = maxx;
        canvasRef.current!.height = maxy;
      });

      class Particle {
        x: number;
        y: number;
        color: string;
        speed: number;
        direction: number;
        vx: number;
        vy: number;
        gravity: number;
        friction: number;
        alpha: number;
        decay: number;
        size: number;

        constructor(x: number, y: number, color: string, speed: number, direction: number, gravity: number, friction: number, size: number) {
          this.x = x;
          this.y = y;
          this.color = color;
          this.speed = speed;
          this.direction = direction;
          this.vx = Math.cos(direction) * speed;
          this.vy = Math.sin(direction) * speed;
          this.gravity = gravity;
          this.friction = friction;
          this.alpha = 1;
          this.decay = rand(0.005, 0.02);
          this.size = size;
        }

        update() {
          this.vx *= this.friction;
          this.vy *= this.friction;
          this.vy += this.gravity;
          this.x += this.vx;
          this.y += this.vy;
          this.alpha -= this.decay;
        }

        draw(ctx: CanvasRenderingContext2D) {
          ctx.save();
          ctx.globalAlpha = this.alpha;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
          ctx.restore();
        }

        isAlive() {
          return this.alpha > 0;
        }
      }

      class Firework {
        x: number;
        y: number;
        targetY: number;
        color: string;
        speed: number;
        size: number;
        angle: number;
        vx: number;
        vy: number;
        trail: { x: number; y: number }[];
        trailLength: number;
        exploded: boolean;

        constructor(x: number, y: number, targetY: number, color: string, speed: number, size: number) {
          this.x = x;
          this.y = y;
          this.targetY = targetY;
          this.color = color;
          this.speed = speed;
          this.size = size;
          this.angle = -Math.PI / 2 + rand(-0.3, 0.3);
          this.vx = Math.cos(this.angle) * this.speed;
          this.vy = Math.sin(this.angle) * this.speed;
          this.trail = [];
          this.trailLength = randInt(10, 25);
          this.exploded = false;
        }

        update() {
          this.trail.push({ x: this.x, y: this.y });
          if (this.trail.length > this.trailLength) {
            this.trail.shift();
          }

          this.x += this.vx;
          this.y += this.vy;
          this.vy += 0.02;

          if (this.vy >= 0 || this.y <= this.targetY) {
            this.explode();
            return false;
          }
          return true;
        }

        explode() {
          const numParticles = randInt(50, 150);
          for (let i = 0; i < numParticles; i++) {
            const angle = rand(0, Math.PI * 2);
            const speed = rand(2, 7);
            const particleSize = rand(1, 5);
            explosions.push(
              new Particle(
                this.x,
                this.y,
                this.color,
                speed,
                angle,
                0.05,
                0.98,
                particleSize
              )
            );
          }
        }

        draw(ctx: CanvasRenderingContext2D) {
          ctx.save();
          ctx.beginPath();
          if (this.trail.length > 1) {
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let point of this.trail) {
              ctx.lineTo(point.x, point.y);
            }
          } else {
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y);
          }
          ctx.strokeStyle = this.color;
          ctx.lineWidth = this.size;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
        }
      }

      function launchFirework() {
        const x = rand(maxx * 0.1, maxx * 0.9);
        const y = maxy;
        const targetY = rand(maxy * 0.1, maxy * 0.4);
        const color = randColor();
        const speed = rand(4, 8);
        const size = rand(2, 5);
        fireworks.push(new Firework(x, y, targetY, color, speed, size));
      }

      function animate(timestamp: number) {
        if (!ctx) return;

        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(0, 0, maxx, maxy);

        if (timestamp - lastLaunchTime > launchInterval) {
          launchFirework();
          lastLaunchTime = timestamp; // 更新上次发射时间
        }

        for (let i = fireworks.length - 1; i >= 0; i--) {
          const firework = fireworks[i];
          if (!firework.update()) {
            fireworks.splice(i, 1);
          } else {
            firework.draw(ctx);
          }
        }

        for (let i = explosions.length - 1; i >= 0; i--) {
          const particle = explosions[i];
          particle.update();
          if (particle.isAlive()) {
            particle.draw(ctx);
          } else {
            explosions.splice(i, 1);
          }
        }

        animationFrameId = requestAnimationFrame(animate);
      }

      animationFrameId = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, []);

  return (
    <article className='firework-page'>
      <canvas ref={canvasRef}></canvas>
    </article>
  );
}
