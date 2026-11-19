// 通用对象池：投射物、经验宝石等高频对象全部复用，
// 帧循环里零 new，避免 GC 卡顿。

export class ObjectPool<T> {
  private free: T[] = [];

  constructor(
    private create: () => T,
    private reset: (obj: T) => void,
    prealloc = 0,
  ) {
    for (let i = 0; i < prealloc; i++) this.free.push(create());
  }

  obtain(): T {
    const obj = this.free.pop();
    return obj ?? this.create();
  }

  release(obj: T): void {
    this.reset(obj);
    this.free.push(obj);
  }

  get freeCount(): number {
    return this.free.length;
  }
}
