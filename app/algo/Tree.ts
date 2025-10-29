import { Point } from "./Point";
import { Node } from "./Node";
import { playerCircleRadius } from "../const-param";
export class Tree {
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
