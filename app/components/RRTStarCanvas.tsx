import { useRef, useEffect, useState } from "react";
import { Link } from "lucide-react";
import { ControlsBar } from "./controls-bar";
import { Tree } from "../algo/Tree";
import { improveRadius, branchLength } from "../const-param";
import { draw } from "./canvas-draw/draw";

export function RRTStarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [virtualWidth, setVirtualWidth] = useState(0);
  const [virtualHeight, setVirtualHeight] = useState(0);
  const TreeRef = useRef<Tree>(
    new Tree({ x: 0, y: 0 }, branchLength, improveRadius)
  );
  const [stop, setStop] = useState(false);
  const stopRef = useRef(stop); //独立に更新されるかつ、useRefで参照渡し UI更新にも用いるためuseStateも用いる
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const removeCallback = useRef<(() => void) | null>(null);
  useEffect(() => {
    const container = containerRef;
    if (!container) return;
    setVirtualWidth(container.clientWidth);
    setVirtualHeight(container.clientHeight);
  }, [containerRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    window.requestAnimationFrame(() =>
      draw(
        ctx,
        canvas,
        virtualHeight,
        virtualWidth,
        TreeRef,
        stopRef,
        mouseRef,
        removeCallback
      )
    );
    const resize = () => {
      if (!containerRef) return;
      const container = containerRef;
      // devicePixelRatioを取得
      const dpr = window.devicePixelRatio || 1;
      // コンテナのCSSサイズ（表示サイズ）
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Canvasの表示サイズをコンテナに合わせる
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Canvasの描画領域の実際のサイズをdevicePixelRatioに基づいて設定
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // コンテキストのスケーリングを設定
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [virtualHeight, virtualWidth, containerRef]);

  return (
    <div>
      <div className="fixed top-0 right-0 items-center p-2 m-2 bg-black bg-opacity-60 rounded-lg border-2 border-white hover:border-gray-600">
        <a
          href="https://qiita.com/aoiacai/items/d95eb21a2dda83638eb9"
          target="_blank"
          rel="noreferrer"
        >
          <Link />
        </a>
      </div>

      <ControlsBar
        isStop={stop}
        onClickToggle={() => {
          setStop(!stop);
          stopRef.current = !stop;
        }}
        onClickGrowOnce={(e) => {
          if (!canvasRef.current) return;
          const dpr = window.devicePixelRatio || 1;
          const x = (Math.random() * canvasRef.current.width) / dpr;
          const y = (Math.random() * canvasRef.current.height) / dpr;
          const node = TreeRef.current.createCandidacyNode({ x, y });
          TreeRef.current.grow(node, { x: e.clientX, y: e.clientY });
        }}
        onClickRestart={() => {
          TreeRef.current = new Tree(
            { x: 0, y: 0 },
            branchLength,
            improveRadius
          );
        }}
      />

      <div ref={setContainerRef} className="w-screen h-screen">
        <canvas
          ref={canvasRef}
          onMouseDown={(e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
            removeCallback.current = () => {
              if (mouseRef.current) TreeRef.current.inCircleRemove(mouseRef);
            };
          }}
          onMouseMove={(e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
          }}
          onMouseUp={() => {
            removeCallback.current = null;
            console.log("mouseup");
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            mouseRef.current = { x: touch.clientX, y: touch.clientY };
            removeCallback.current = () => {
              if (mouseRef.current) TreeRef.current.inCircleRemove(mouseRef);
            };
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            mouseRef.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={() => {
            removeCallback.current = null;
          }}
        />
      </div>
    </div>
  );
}
