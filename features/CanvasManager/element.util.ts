export function positionCanvas(canvas: HTMLCanvasElement, container: HTMLElement) {
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = `${container.clientWidth}px`;
  canvas.style.height = `${container.clientHeight}px`;
}
