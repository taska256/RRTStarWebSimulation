import React, { useRef, useEffect, useState } from "react";
import { Link } from "lucide-react";
const improveRadius = 40;
const branchLength = 20;
const playerCircleRadius = 100;

interface Point {
  x: number;
  y: number;
}
interface Node {
  x: number;
  y: number;
  isValid: boolean;
}

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
      <div className="fixed bottom-0 items-center w-screen">
        <div className="items-center w-full flex justify-center flex-row space-x-2">
          <button
            type="button"
            className="w-36 border-2 border-white bg-black bg-opacity-60 text-white py-2 px-4 rounded-lg hover:border-gray-600"
            onClick={() => {
              setStop(!stop);
              stopRef.current = !stop;
            }}
          >
            {stop ? "Start" : "Stop"}
          </button>
          <button
            type="button"
            className={`w-36 border-2 border-white bg-black bg-opacity-60 text-white py-2 px-4 rounded-lg hover:border-gray-600 ${
              stop ? "" : "pointer-events-none opacity-50"
            }`}
            onClick={(e) => {
              if (!canvasRef.current) return;
              const dpr = window.devicePixelRatio || 1;
              const x = (Math.random() * canvasRef.current.width) / dpr;
              const y = (Math.random() * canvasRef.current.height) / dpr;
              const node = TreeRef.current.createCandidacyNode({ x: x, y: y });
              TreeRef.current.grow(node, { x: e.clientX, y: e.clientY });
            }}
          >
            Grow Once
          </button>
          <button
            type="button"
            className="w-36 border-2 border-white bg-black bg-opacity-60 text-white py-2 px-4 rounded-lg hover:border-gray-600"
            onClick={() => {
              TreeRef.current = new Tree(
                { x: 0, y: 0 },
                branchLength,
                improveRadius
              );
            }}
          >
            Restart
          </button>
        </div>
      </div>

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

function draw(
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

function init(
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

class Tree {
  root: Point;
  nodes: Node[] = [];
  parents: number[] = [];
  childrens: number[][] = [];
  branchLength: number;
  improveRadius: number;
  grid: number[][][] = []; // 1マスがbranchLength x branchLengthのグリッド
  constructor(
    root: { x: number; y: number },
    branchLength: number,
    improveRadius: number
  ) {
    this.root = root;
    this.branchLength = branchLength;
    this.addNode(root, 0, true);
    this.improveRadius = improveRadius;
  }

  pathLength(index: number) {
    let length = 0;
    let current = index;
    while (current !== 0) {
      if (!this.nodes[current].isValid) return Number.POSITIVE_INFINITY;
      length += Math.sqrt(
        (this.nodes[current].x - this.nodes[this.parents[current]].x) ** 2 +
          (this.nodes[current].y - this.nodes[this.parents[current]].y) ** 2
      );
      current = this.parents[current];
    }
    return length;
  }
  addNode(node: { x: number; y: number }, parent: number, isRoot = false) {
    this.nodes.push({ ...node, isValid: true });
    this.addNodeToGrid(node, this.nodes.length - 1);
    this.parents.push(parent);
    this.childrens.push([]);
    if (!this.childrens[parent]) this.childrens[parent] = [];
    if (!isRoot) this.childrens[parent].push(this.nodes.length - 1);
  }
  grow(node: { x: number; y: number }, playerMouse: { x: number; y: number }) {
    let parent = -1;
    let min = Number.POSITIVE_INFINITY;
    const neighborhoodNodes = this.neighborhoodNodes(node, 1);
    for (let i = 0; i < neighborhoodNodes.length; i++) {
      const nhNode = this.nodes[neighborhoodNodes[i]];

      const length = Math.sqrt(
        (nhNode.x - node.x) ** 2 + (nhNode.y - node.y) ** 2
      );
      if (length > this.branchLength) continue;
      const parentPathLength = this.pathLength(neighborhoodNodes[i]);
      if (length + parentPathLength < min) {
        min = length + parentPathLength;
        parent = neighborhoodNodes[i];
      }
    }
    if (parent === -1) return;
    if (isLineIntersectingCircle(this.nodes[parent], node, playerMouse)) return;
    this.addNode(node, parent);

    //improve step
    const stack = [this.nodes.length - 1];
    while (stack.length > 0) {
      const lastAdded = stack.pop();
      if (!lastAdded) break;
      const lastParent = this.parents[lastAdded];
      const lastNode = this.nodes[lastAdded];
      const lastLength = this.pathLength(lastAdded);

      const improveRadiusLevel = Math.ceil(
        this.improveRadius / this.branchLength
      );
      const neighborhoodNodes = this.neighborhoodNodes(
        lastNode,
        improveRadiusLevel
      );
      for (let i = 0; i < neighborhoodNodes.length; i++) {
        if (
          i === lastParent ||
          i === this.nodes.length - 1 ||
          this.parents[neighborhoodNodes[i]] === lastAdded
        )
          continue;
        const nhnode = this.nodes[neighborhoodNodes[i]];
        const neighborhoodLength = Math.sqrt(
          (nhnode.x - lastNode.x) ** 2 + (nhnode.y - lastNode.y) ** 2
        );
        if (neighborhoodLength > this.improveRadius) continue;
        const mayImprovedLength = lastLength + neighborhoodLength;
        if (mayImprovedLength < this.pathLength(neighborhoodNodes[i])) {
          this.changeParent(neighborhoodNodes[i], lastAdded);
          stack.push(neighborhoodNodes[i]);
        }
      }
    }
  }
  createCandidacyNode(randomPoint: { x: number; y: number }) {
    let mostClosest = 0;
    let min = Number.POSITIVE_INFINITY;
    const neighborhoodNodes = [];
    for (let i = 0; neighborhoodNodes.length === 0; i++) {
      neighborhoodNodes.push(...this.neighborhoodNodes(randomPoint, i));
    }
    for (let i = 0; i < neighborhoodNodes.length; i++) {
      const length = Math.sqrt(
        (this.nodes[neighborhoodNodes[i]].x - randomPoint.x) ** 2 +
          (this.nodes[neighborhoodNodes[i]].y - randomPoint.y) ** 2
      );
      if (length < min) {
        min = length;
        mostClosest = neighborhoodNodes[i];
      }
    }
    if (min < this.branchLength) return randomPoint;
    const nodeX =
      this.nodes[mostClosest].x +
      ((randomPoint.x - this.nodes[mostClosest].x) / min) * this.branchLength;
    const nodeY =
      this.nodes[mostClosest].y +
      ((randomPoint.y - this.nodes[mostClosest].y) / min) * this.branchLength;
    return { x: nodeX, y: nodeY };
  }
  addNodeToGrid(node: { x: number; y: number }, index: number) {
    const gridLevelX = Math.floor(node.x / this.branchLength);
    const gridLevelY = Math.floor(node.y / this.branchLength);
    for (let i = 0; i < gridLevelX - (this.grid.length - 1); i++) {
      this.grid.push([]);
    }
    for (let i = 0; i < gridLevelY - (this.grid[gridLevelX].length - 1); i++) {
      this.grid[gridLevelX].push([]);
    }
    if (!this.grid[gridLevelX][gridLevelY])
      this.grid[gridLevelX][gridLevelY] = [];
    this.grid[gridLevelX][gridLevelY].push(index);
  }
  neighborhoodNodes(node: { x: number; y: number }, radiusLevel: number) {
    //何をしているか？ 計算量を削減するテクニックの実装
    // ある点を中心として半径 branchLength以下の範囲にあるnodeを検索する場合、
    //愚直に行うと O(number of nodes) かかるが、
    // 1マスがbranchLength x branchLength の グリッドを用意し、
    //各マスに含まれるnodeのindexを記録しておくことで、
    //計算量を削減できる
    //radiusLevelは、node の含まれるマスの近傍radiusLevelマスまでを探索する(L1距離)

    const gridLevelX = Math.floor(node.x / this.branchLength);
    const gridLevelY = Math.floor(node.y / this.branchLength);
    const neighborhoodNodes: number[] = [];
    for (
      let i = Math.max(0, gridLevelX - radiusLevel);
      i <= Math.min(this.grid.length - 1, gridLevelX + radiusLevel);
      i++
    ) {
      for (
        let j = Math.max(0, gridLevelY - radiusLevel);
        j <= Math.min(this.grid[i].length - 1, gridLevelY + radiusLevel);
        j++
      ) {
        const groups = this.grid[i][j];
        if (!groups) continue;
        //push to neighborhoodNodes
        neighborhoodNodes.push(...groups);
      }
    }
    return neighborhoodNodes;
  }
  nearestNode(node: { x: number; y: number }) {
    // neighborhoodNodesの中で最も近いノードを返す
    const neighborhoodNodes = this.neighborhoodNodes(node, 0);
    if (neighborhoodNodes.length === 0)
      neighborhoodNodes.push(...this.neighborhoodNodes(node, 1));
    let min = Number.POSITIVE_INFINITY;
    let nearestNode = null;
    for (let i = 0; i < neighborhoodNodes.length; i++) {
      const length = Math.sqrt(
        (node.x - this.nodes[neighborhoodNodes[i]].x) ** 2 +
          (node.y - this.nodes[neighborhoodNodes[i]].y) ** 2
      );
      if (length < min) {
        min = length;
        nearestNode = neighborhoodNodes[i];
      }
    }
    return nearestNode;
  }
  inCircleRemove(centerRef: React.RefObject<Point>) {
    if (!centerRef.current) return;
    const center = centerRef.current;
    const neighborhoodNodes = this.neighborhoodNodes(
      center,
      Math.ceil(playerCircleRadius / this.branchLength)
    );
    for (let i = 0; i < neighborhoodNodes.length; i++) {
      const node = this.nodes[neighborhoodNodes[i]];
      if (!node.isValid) continue;
      const length = Math.sqrt(
        (node.x - center.x) ** 2 + (node.y - center.y) ** 2
      );
      if (length < playerCircleRadius) {
        this.removeNode(neighborhoodNodes[i]);
      }
    }
  }
  removeNode(index: number) {
    if (index === 0) return;
    this.nodes[index].isValid = false;
    const parent = this.parents[index];
    if (this.nodes[parent].isValid)
      this.childrens[parent] = this.childrens[parent].filter(
        (value) => value !== index
      );
    const gridLevelX = Math.floor(this.nodes[index].x / this.branchLength);
    const gridLevelY = Math.floor(this.nodes[index].y / this.branchLength);
    this.grid[gridLevelX][gridLevelY] = this.grid[gridLevelX][
      gridLevelY
    ].filter((value) => value !== index);

    const childrens = this.childrens[index];
    for (let i = 0; i < childrens.length; i++) {
      this.removeNode(childrens[i]);
    }
    this.childrens[index] = [];
  }
  changeParent(index: number, newParent: number) {
    const oldParent = this.parents[index];
    this.parents[index] = newParent;
    if (!this.childrens[newParent]) this.childrens[newParent] = [];
    this.childrens[newParent].push(index);
    this.childrens[oldParent] = this.childrens[oldParent].filter(
      (value) => value !== index
    );
  }
}
function isLineIntersectingCircle(
  lineStart: Point,
  lineEnd: Point,
  circleCenter: Point
): boolean {
  const { x: x1, y: y1 } = lineStart;
  const { x: x2, y: y2 } = lineEnd;
  const { x: cx, y: cy } = circleCenter;
  const radius = playerCircleRadius;

  // 線分を円の中心基準に移動
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  // 二次方程式の係数
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;

  // 判別式
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    // 判別式が負なら交差しない
    return false;
  }

  // 判別式が非負なら交点が存在する可能性がある
  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

  // t1 と t2 のどちらかが [0, 1] の範囲にあるかチェック
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}
