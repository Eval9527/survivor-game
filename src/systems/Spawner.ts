// 刷怪器：难度随时间成长，同屏超上限时排队。
// 成长公式（m = 已过分钟数）：HP × 1.18^m，移速 +2m（上限 120）。

import Phaser from 'phaser';
import { Enemy, EnemyKind, ENEMY_STATS } from '../entities/Enemy';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  MAX_ENEMIES_ON_SCREEN,
  SPAWN_INTERVAL_START,
  SPAWN_INTERVAL_MIN,
} from '../config/game';

export class Spawner {
  elapsed = 0;
  private timer = 0;
  private queued = 0;

  constructor(
    private scene: Phaser.Scene,
    private enemies: Enemy[],
  ) {}

  update(dt: number): void {
    this.elapsed += dt;
    this.timer -= dt;
    if (this.timer > 0) return;

    // 刷怪间隔随时间压缩：1.2s → 0.25s
    const minutes = this.elapsed / 60;
    this.timer = Math.max(
      SPAWN_INTERVAL_MIN,
      SPAWN_INTERVAL_START - minutes * 0.1,
    );

    if (this.enemies.length >= MAX_ENEMIES_ON_SCREEN) {
      this.queued++;
      return;
    }
    // 先放排队的
    if (this.queued > 0) this.queued--;

    const kind = this.pickKind(minutes);
    const pos = this.edgePosition();
    const stats = ENEMY_STATS[kind];
    const hpMul = Math.pow(1.18, minutes);
    const speed = Math.min(120, stats.speed + 2 * minutes);
    this.enemies.push(
      new Enemy(this.scene, pos.x, pos.y, kind, {
        hp: Math.round(stats.hp * hpMul),
        speed,
        damage: stats.damage,
        radius: stats.radius,
        xp: stats.xp,
      }),
    );
  }

  private pickKind(minutes: number): EnemyKind {
    // 蝙蝠 2 分钟后、骷髅 4 分钟后加入刷怪池
    const pool: EnemyKind[] = ['slime'];
    if (minutes >= 2) pool.push('bat');
    if (minutes >= 4) pool.push('skeleton');
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /** 在屏幕边缘外随机一点刷怪。 */
  private edgePosition(): Phaser.Math.Vector2 {
    const margin = 30;
    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0:
        return new Phaser.Math.Vector2(
          Math.random() * GAME_WIDTH,
          -margin,
        );
      case 1:
        return new Phaser.Math.Vector2(
          Math.random() * GAME_WIDTH,
          GAME_HEIGHT + margin,
        );
      case 2:
        return new Phaser.Math.Vector2(-margin, Math.random() * GAME_HEIGHT);
      default:
        return new Phaser.Math.Vector2(
          GAME_WIDTH + margin,
          Math.random() * GAME_HEIGHT,
        );
    }
  }
}
