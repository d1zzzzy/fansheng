/**
 * 节流函数
 * @param fn 需要节流的函数
 * @param delay 节流时间
 * @returns 节流后的函数
 */
export function throttle(fn: Function, delay: number) {
  let timer: NodeJS.Timeout | null = null;

  return function (this: any, ...args: any[]) {
    if (timer) return;
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}
