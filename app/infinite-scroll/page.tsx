'use client';

import { useEffect, useState } from "react";

import { generateData } from './generateData';
import VirtualScroll from './VirtualScroll';

import "@/styles/infinite-scroll.scss";

const metadata = {
  title: "无限滚动列表",
};

export default function InfiniteScroll() {
  const [data, setData] = useState<{
    id: number,
    text: string,
    height: number;
  }[]>([]);

  useEffect(() => {
    document.title = metadata.title;

    setData(generateData(1000))
  }, []);

  return (
    <article className="page flex justify-center items-center p-24 border-box">
      <section className="scroll-content__container">
        <VirtualScroll data={data} containerHeight={800} bufferSize={10} />
      </section>
    </article>
  )
}
