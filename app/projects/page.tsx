import Link from "next/link";

import { basePath } from "@/constants/env";

import "../../styles/project.scss";

export default function ProjectsPage() {
  return (
    <div>
      <div className="gap-4 p-8 grid grid-cols-3">
        <section className="project-card">
          <Link className="mt-4" href="/projects/typing-effect-with-html-tag">
            <h2 className="title">标签打字机</h2>
            <img className="rounded-lg w-full" src={`${basePath}/assets/typewriter-7686636_1280.jpg`} alt="标签打字机" />
            <p className="description">一个可以打印HTML标签的打字效果</p>
          </Link>
        </section>
      </div>
    </div>
  );
}
