import { Tree } from "~/algo/Tree";
import { playerCircleRadius } from "~/const-param";
import { Point } from "~/algo/Point";
import { init } from "./init";

export function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  virtualHeight: number,
  virtualWidth: number,
  treeRef: React.RefObject<Tree>,
  stopRef: React.RefObject<boolean>,
  mouseRef: React.RefObject<{ x: number; y: number } | null>,
  removeCallback: React.RefObject<(() => void) | null>
) {
  init(ctx, canvas, virtualHeight, virtualWidth);
  const tree = treeRef.current;
  if (!tree) {
    return;
  }
  if (removeCallback.current) {
    removeCallback.current();
  }
  for (let i = 0; i < tree.nodes.length; i++) {
    const parentID = tree.parents[i];
    const parent = tree.nodes[parentID];
    if (!tree.nodes[i].isValid) {
      continue;
    }

    ctx.strokeStyle = "rgb(255, 255, 255)";
    ctx.beginPath();
    ctx.moveTo(tree.nodes[i].x, tree.nodes[i].y);

    ctx.lineTo(parent.x, parent.y);
    ctx.stroke();
  }
  if (mouseRef.current) {
    ctx.beginPath();
    ctx.arc(
      mouseRef.current.x,
      mouseRef.current.y,
      playerCircleRadius,
      0,
      Math.PI * 2,
      true
    );
    if (!removeCallback.current) {
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
    } else {
      ctx.strokeStyle = "rgba(255,255,255)";
    }
    ctx.stroke();
  }

  const dpr = window.devicePixelRatio || 1;

  function inCircle(center: Point, point: Point): boolean {
    return (
      (point.x - center.x) ** 2 + (point.y - center.y) ** 2 <=
      playerCircleRadius ** 2
    );
  }
  let x = (Math.random() * canvas.width) / dpr;
  let y = (Math.random() * canvas.height) / dpr;
  if (removeCallback.current) {
    console.log("removeCallback");
  }
  while (
    removeCallback.current &&
    mouseRef.current &&
    inCircle({ x, y }, mouseRef.current)
  ) {
    x = (Math.random() * canvas.width) / dpr;
    y = (Math.random() * canvas.height) / dpr;
  }
  const node = treeRef.current.createCandidacyNode({ x: x, y: y });
  if (!stopRef.current) {
    if (mouseRef.current && removeCallback.current) {
      treeRef.current.grow(node, mouseRef.current);
    } else {
      treeRef.current.grow(node, {
        x: Number.POSITIVE_INFINITY,
        y: Number.POSITIVE_INFINITY,
      });
    }
  }
  window.requestAnimationFrame(() =>
    draw(
      ctx,
      canvas,
      virtualHeight,
      virtualWidth,
      treeRef,
      stopRef,
      mouseRef,
      removeCallback
    )
  );
}
