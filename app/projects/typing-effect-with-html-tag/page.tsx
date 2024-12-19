'use client';

import createTypewriter from "@/features/Interactive/TypeWriter";
import { useEffect, useRef } from "react";

const htmlContent = `
  <div>
    <p>这是<strong>加粗</strong>标签</p>
    <p>这是<del>删除</del>标签</p>
    <p>这是<em>斜体</em>标签</p>
    <p>这是<a href="/">链接</a>标签</p>
    <p>这是<span style="color: red;">颜色</span>标签</p>

    <div>
      <table>
        <thead>
          <tr>
            <th>表头1</th>
            <th>表头2</th>
            <th>表头3</th>
            <th>表头4</th>
            <th>表头5</th>
            <th>表头6</th>
            <th>表头7</th>
            <th>表头8</th>
            <th>表头9</th>
            <th>表头10</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>2</td>
            <td>3</td>
            <td>4</td>
            <td>5</td>
            <td>6</td>
            <td>7</td>
            <td>8</td>
            <td>9</td>
            <td>10</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ul style="list-style: square;">
      <li>列表1</li>
      <li>列表2</li>
      <li>列表3</li>
      <li>列表4</li>
      <li>列表5</li>
    </ul>

    <ol style="list-style-type: decimal;">
      <li>列表1</li>
      <li>列表2</li>
      <li>列表3</li>
      <li>列表4</li>
      <li>列表5</li>
    </ol>
  </div>
`;

const metadata = {
  title: "【小功能】标签打字机",
};

export default function TypingEffectWithHtmlTag() {
  const writerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = writerRef.current;

    if (container) {
      createTypewriter(container, htmlContent, 50);
    }

    document.title = metadata.title;

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  return (
    <div>
      <div>
        <h1 className="text-4xl font-bold text-center">标签打字机</h1>

        <div ref={writerRef} id="writer" className="flex flex-col gap-4"></div>

        <div className="fixed bottom-0 left-0 right-0 py-4 text-center">
          <a href="https://codepen.io/d1zzzzy/full/KKjPxqa" target="_blank" className="text-blue-500 text-xl leading-10">在 CodePen 上打开</a>
        </div>
      </div>
    </div>
  );
}
