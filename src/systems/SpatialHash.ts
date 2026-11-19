// 空间哈希网格：把 O(n²) 碰撞检测降到每怪只查周围 9 格。
// 300 只怪时从约 9 万次检测/帧降到约 5 千次。

export interface Hashable {
  x: number;
  y: number;
}

export class SpatialHash<T extends Hashable> {
  private cells = new Map<string, T[]>();

  constructor(private cellSize: number) {}

  clear(): void {
    this.cells.clear();
  }

  insert(obj: T): void {
    const key = this.key(obj.x, obj.y);
    const bucket = this.cells.get(key);
    if (bucket) bucket.push(obj);
    else this.cells.set(key, [obj]);
  }

  /** 取 (x, y) 周围 3×3 格内的全部对象（软分离用）。 */
  queryNeighbors(x: number, y: number): T[] {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const out: T[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = this.cells.get(`${cx + dx},${cy + dy}`);
        if (bucket) out.push(...bucket);
      }
    }
    return out;
  }

  /** 取半径 radius 内的对象（武器伤害查询用），已按距离过滤。 */
  queryRadius(x: number, y: number, radius: number): T[] {
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    const r2 = radius * radius;
    const out: T[] = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this.cells.get(`${cx},${cy}`);
        if (!bucket) continue;
        for (const obj of bucket) {
          const dx = obj.x - x;
          const dy = obj.y - y;
          if (dx * dx + dy * dy <= r2) out.push(obj);
        }
      }
    }
    return out;
  }

  private key(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }
}
