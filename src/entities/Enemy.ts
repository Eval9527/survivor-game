// 敌人 AI 状态机：SPAWN → CHASE → ATTACK → KNOCKBACK → DEAD
// 转换条件：
// - CHASE → ATTACK：与玩家距离 < 24px
// - ATTACK → CHASE：距离 > 32px
// - 任意状态 → KNOCKBACK：受伤害且击退值 > 0
// - KNOCKBACK → CHASE：120ms 计时结束
// - 任意状态 → DEAD：HP <= 0

import Phaser from 'phaser';
import type { Player } from './Player';

export type EnemyState = 'spawn' | 'chase' | 'attack' | 'knockback' | 'dead';

export type EnemyKind = 'slime' | 'bat' | 'skeleton';

export interface EnemyStats {
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  xp: number;
}

// 基础数值（第 1 分钟），成长在 Spawner 里算
export const ENEMY_STATS: Record<
  EnemyKind,
  EnemyStats & { texture: string }
> = {
  slime: { hp: 12, speed: 55, damage: 5, radius: 12, xp: 1, texture: 'slime' },
  bat: { hp: 8, speed: 85, damage: 4, radius: 10, xp: 1, texture: 'bat' },
  skeleton: {
    hp: 30,
    speed: 40,
    damage: 8,
    radius: 12,
    xp: 3,
    texture: 'skeleton',
  },
};

const ATTACK_RANGE = 24;
const ATTACK_LEAVE_RANGE = 32;
const ATTACK_INTERVAL = 0.8;
const KNOCKBACK_TIME = 0.12;
const KNOCKBACK_SPEED = 260;
const SPAWN_TIME = 0.5;

export class Enemy {
  sprite: Phaser.GameObjects.Sprite;
  state: EnemyState = 'spawn';
  radius: number;
  xp: number;
  slowTimer = 0;

  private hp: number;
  private baseSpeed: number;
  private touchDmg: number;
  private atkTimer = 0;
  private kbTimer = 0;
  private spawnTimer = SPAWN_TIME;
  private kbDir = new Phaser.Math.Vector2(1, 0);

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    kind: EnemyKind,
    stats: EnemyStats,
  ) {
    this.sprite = scene.add.sprite(x, y, ENEMY_STATS[kind].texture);
    this.sprite.setAlpha(0);
    this.hp = stats.hp;
    this.baseSpeed = stats.speed;
    this.touchDmg = stats.damage;
    this.radius = stats.radius;
    this.xp = stats.xp;
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  get pos(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.sprite.x, this.sprite.y);
  }

  get speed(): number {
    return this.slowTimer > 0 ? this.baseSpeed * 0.8 : this.baseSpeed;
  }

  update(dt: number, player: Player): void {
    this.atkTimer -= dt;
    this.kbTimer -= dt;
    this.slowTimer -= dt;

    switch (this.state) {
      case 'spawn': {
        this.spawnTimer -= dt;
        this.sprite.setAlpha(1 - Math.max(0, this.spawnTimer / SPAWN_TIME));
        if (this.spawnTimer <= 0) this.setState('chase');
        break;
      }
      case 'chase': {
        const dir = player.pos.clone().subtract(this.pos).normalize();
        // 注意：pos 每次返回新向量，必须算到局部变量再写回
        const next = this.pos.add(dir.scale(this.speed * dt));
        this.sprite.setPosition(next.x, next.y);
        if (next.distance(player.pos) < ATTACK_RANGE) {
          this.setState('attack');
        }
        break;
      }
      case 'attack':
        if (this.atkTimer <= 0) {
          player.takeDamage(this.touchDmg);
          this.atkTimer = ATTACK_INTERVAL;
        } else if (this.pos.distance(player.pos) > ATTACK_LEAVE_RANGE) {
          this.setState('chase');
        }
        break;
      case 'knockback': {
        const next = this.pos.add(this.kbDir.clone().scale(KNOCKBACK_SPEED * dt));
        this.sprite.setPosition(next.x, next.y);
        if (this.kbTimer <= 0) this.setState('chase');
        break;
      }
      case 'dead':
        break;
    }
  }

  takeDamage(dmg: number, kb: number, from: Phaser.Math.Vector2): void {
    // 出生无敌
    if (this.state === 'spawn' || this.state === 'dead') return;
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.setState('dead');
      return;
    }
    if (kb > 0) {
      this.kbDir = this.pos.clone().subtract(from).normalize();
      this.kbTimer = KNOCKBACK_TIME;
      this.setState('knockback');
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }

  private setState(next: EnemyState): void {
    this.state = next;
  }
}
