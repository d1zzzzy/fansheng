import { useCallback, useEffect, useRef, useState } from "react";

import debounce from "lodash/debounce";

interface VirtualScrollProps {
  data: {
    id: number;
    text: string;
    height: number;
  }[],
  bufferSize?: number;
  containerHeight: number;
}

export default function VirtualScroll ({
  data,
  bufferSize = 5,
  containerHeight,
}: VirtualScrollProps) {
  const initialItemsToShow = Math.ceil(containerHeight / 50) + bufferSize * 2;
  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleEnd, setVisibleEnd] = useState(() =>
    Math.min(data.length, initialItemsToShow)
  );
  const [totalHeight, setTotalHeight] = useState(0);

  const heights = useRef<number[]>([]);
  const positions = useRef<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // 添加新的状态来记录未渲染的区域
  const [pendingRanges, setPendingRanges] = useState<{start: number, end: number}[]>([]);
  const lastScrollTop = useRef(0);
  const scrollingDirection = useRef<'up' | 'down'>('down');

  // 初始化位置数组和高度，使用数据中的预设高度
  useEffect(() => {
    if (!data.length) return;

    // 使用数据中的高度初始化
    heights.current = data.map(item => item.height);
    positions.current = new Array(data.length).fill(0);

    // 计算初始位置
    let accumHeight = 0;
    for (let i = 0; i < data.length; i++) {
      positions.current[i] = accumHeight;
      accumHeight += heights.current[i];
    }
    setTotalHeight(accumHeight);

    // 确保首次渲染时显示足够的内容
    if (isFirstRender.current) {
      setVisibleEnd(Math.min(data.length, initialItemsToShow));
      isFirstRender.current = false;
    }
  }, [data, initialItemsToShow]);

  // 更新位置信息
  const updatePositions = useCallback(() => {
    let accumHeight = 0;
    for (let i = 0; i < positions.current.length; i++) {
      positions.current[i] = accumHeight;
      accumHeight += heights.current[i];
    }
    setTotalHeight(accumHeight);
  }, []);

  // 优化滚动处理，支持快速滚动，并在上下都添加缓冲区
  const findStartIndex = useCallback((scrollTop: number) => {
    // 使用二分查找优化查找速度
    let start = 0;
    let end = positions.current.length - 1;

    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const midPosition = positions.current[mid];

      if (midPosition === scrollTop) {
        return mid;
      } else if (midPosition < scrollTop) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }

    // 添加上方缓冲区
    const index = Math.max(0, start - 1);
    return Math.max(0, Math.min(index - bufferSize, data.length - initialItemsToShow));
  }, [data.length, initialItemsToShow, bufferSize]);

  const debouncedScroll = useCallback(
    debounce((scrollTop: number) => {
      // 确定滚动方向
      scrollingDirection.current = scrollTop > lastScrollTop.current ? 'down' : 'up';
      lastScrollTop.current = scrollTop;

      const start = findStartIndex(scrollTop);
      const visibleCount = Math.ceil(containerHeight / 50);
      const end = Math.min(data.length, start + visibleCount + bufferSize * 2);

      // 检查是否有大范围跳跃
      const gap = scrollingDirection.current === 'down'
        ? start - visibleEnd
        : visibleStart - end;

      if (gap > bufferSize * 2) {
        // 记录跳过的区域
        setPendingRanges(prev => [...prev, {
          start: scrollingDirection.current === 'down' ? visibleEnd : end,
          end: scrollingDirection.current === 'down' ? start : visibleStart
        }]);
      }

      setVisibleStart(start);
      setVisibleEnd(end);
    }, 16),
    [data.length, findStartIndex, containerHeight, bufferSize, visibleStart, visibleEnd]
  );

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    debouncedScroll(container.scrollTop);
  }, [debouncedScroll]);

  // 测量实际高度并更新缓存
  const measureHeights = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(
      container.querySelectorAll('.virtual-item')
    ) as HTMLDivElement[];

    let needsUpdate = false;
    items.forEach((item) => {
      const index = Number(item.dataset.index);
      const height = item.getBoundingClientRect().height;
      const currentHeight = heights.current[index];

      // 只在实际高度与预设高度不同时更新
      if (currentHeight !== height) {
        heights.current[index] = height;
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      updatePositions();
    }
  }, [updatePositions]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      measureHeights();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [visibleStart, visibleEnd, measureHeights]);

  // 添加对未渲染区域的处理
  useEffect(() => {
    if (pendingRanges.length === 0) return;

    const processPendingRanges = async () => {
      const ranges = [...pendingRanges];
      setPendingRanges([]); // 清空待处理队列

      // 分批处理跳过的区域
      for (const range of ranges) {
        const batchSize = 10; // 每批处理的元素数量
        for (let i = range.start; i < range.end; i += batchSize) {
          const batchEnd = Math.min(i + batchSize, range.end);
          // 临时渲染这些元素以获取它们的高度
          const tempData = data.slice(i, batchEnd);

          // 使用 requestAnimationFrame 避免阻塞主线程
          await new Promise(resolve => {
            requestAnimationFrame(() => {
              tempData.forEach((item, index) => {
                const actualIndex = i + index;
                // 更新高度缓存
                const element = document.createElement('div');
                element.style.cssText = `
                  position: absolute;
                  visibility: hidden;
                  height: ${item.height}px;
                `;
                document.body.appendChild(element);
                const height = element.getBoundingClientRect().height;
                document.body.removeChild(element);

                heights.current[actualIndex] = height;
              });
              resolve(null);
            });
          });
        }
      }

      // 更新位置信息
      updatePositions();
    };

    processPendingRanges();
  }, [pendingRanges, data, updatePositions]);

  const visibleData = data.slice(visibleStart, visibleEnd);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="virtual-scroll-container"
      style={{
        height: `${containerHeight}px`,
        overflowY: 'auto',
        position: 'relative',
        border: '1px solid #ccc',
      }}
    >
      <div
        style={{
          height: `${totalHeight}px`,
          position: 'relative',
          willChange: 'transform',
        }}
      >
        {visibleData.map((item, index) => (
          <div
            key={item.id}
            className="virtual-item"
            data-index={visibleStart + index}
            style={{
              position: 'absolute',
              width: '100%',
              height: `${item.height}px`,
              transform: `translateY(${positions.current[visibleStart + index]}px)`,
              willChange: 'transform',
              boxSizing: 'border-box',
              padding: '8px',
              backgroundColor: '#fff',
            }}
          >
            {item.text}
          </div>
        ))}
        {pendingRanges.length > 0 && (
          <div
            style={{
              position: 'fixed',
              right: '20px',
              top: '20px',
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: '#fff',
              borderRadius: '4px',
              transform: 'translateZ(0)',
            }}
          >
            正在加载跳过的内容...
          </div>
        )}
      </div>
    </div>
  );
}
