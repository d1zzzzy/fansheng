import Link from "next/link";

import { basePath } from "@/constants/env";

import "../styles/project.scss";

export default function ProjectsPage() {
  return (
    <div className='p-24'>
      <div className="gap-16 grid grid-cols-4">
        <section className="project-card shadow-sm rounded-lg">
          <Link className="mt-4 block" href="/typing-effect-with-html-tag">
            <h2 className="title text-foreground">标签打字机</h2>
            <img className="project-image" src={`${basePath}/assets/typewriter-7686636_1280.jpg`} alt="标签打字机"/>
            <p className="description text-foreground">一个可以打印HTML标签的打字效果</p>
          </Link>
        </section>

        <section className="project-card shadow-sm rounded-lg">
          <Link className="mt-4 block" href="/webgl-circle-animation">
            <h2 className="title text-foreground">Shader Noise Animation</h2>
            <img className="project-image" src={`${basePath}/assets/shader-noise.png`} alt="noise animation"/>
            <p className="description text-foreground">一个噪点shader 2D 动画</p>
          </Link>
        </section>

        <section className="project-card shadow-sm rounded-lg">
          <Link className="mt-4 block" href="/three-attributes">
            <h2 className="title text-foreground">ThreeJS Attributes</h2>
            <img className="project-image" src={`${basePath}/assets/three-attributes.png`} alt="three-attributes"/>
            <p className="description text-foreground">ThreeJS Attributes</p>
          </Link>
        </section>

        <section className="project-card shadow-sm rounded-lg">
          <Link className="mt-4 block" href="/gaussian-noise-2d">
            <h2 className="title text-foreground">Gaussian Noise 2D Pattern</h2>
            <img className="project-image" src={`${basePath}/assets/gaussian-noise-2d.jpg`} alt="gaussian-noise-2d"/>
            <p className="description text-foreground">高斯噪点函数生成的图案</p>
          </Link>
        </section>

        <section className="project-card shadow-sm rounded-lg">
          <Link className="mt-4 block" href="/voice-weave">
            <h2 className="title text-foreground">Audio + Shader 声音频谱</h2>
            <img className="project-image" src={`${basePath}/assets/voice-weave.jpg`} alt="three-attributes"/>
            <p className="description text-foreground">h5 audio api + webgl 绘制声音曲线频谱</p>
          </Link>
        </section>

        <section className="project-card shadow-sm rounded-lg">
          <Link className="mt-4 block" href="/infinite-scroll">
            <h2 className="title text-foreground">虚拟列表</h2>
            <img className="project-image" src={`${basePath}/assets/virtual-infinite-list.jpg`} alt="virtual list"/>
            <p className="description text-foreground">无限滚动虚拟列表</p>
          </Link>
        </section>
      </div>
    </div>
  );
}
