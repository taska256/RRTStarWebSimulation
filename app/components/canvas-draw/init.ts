export function init(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  virtualHeight: number,
  virtualWidth: number
) {
  ctx.fillStyle = "rgb(100, 100, 100)"; // 背景色
  ctx.clearRect(
    0,
    0,
    Math.max(canvas.width, virtualWidth),
    Math.max(canvas.height, virtualHeight)
  );
}
