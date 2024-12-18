import Link from "next/link";

export default function ProjectsPage() {
  return (
    <div>
      <div className="gap-4 p-8 grid grid-cols-3">
        <section>
          <Link className="mt-4" href="/projects/typing-effect-with-html-tag">
            <h2 className="text-2xl font-bold">标签打字机</h2>
            <img className="rounded-lg" src="/assets/typewriter-7686636_1280.jpg" alt="标签打字机" />
            <p className="text-sm text-gray-500 mt-4">一个可以打印HTML标签的打字效果</p>
          </Link>
        </section>
      </div>
    </div>
  );
}
