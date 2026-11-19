// 投射物（飞刀 / 火球），走对象池复用。
// hit 记录已命中的敌人，避免同一发多次命中同一只怪。

import Phaser from 'phaser';
import type { Enemy } from './Enemy';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game';

export interface FireOptions {
  damage: number;
  pierce: number;
  aoe: number; // 0 = 单体，>0 = 命中时 AoE 半径
  kb: number;
  speed: number;
  texture: string;
}

export class Projectile {
  sprite: Phaser.GameObjects.Sprite;
  active = false;
  vel = new Phaser.Math.Vector2(0, 0);
  damage = 0;
  pierce = 0;
  aoe = 0;
  kb = 0;
  hit = new Set<Enemy>();

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add.sprite(0, 0, 'knife');
    this.sprite.setVisible(false);
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

  fire(x: number, y: number, dir: Phaser.Math.Vector2, opts: FireOptions): void {
    this.sprite.setTexture(opts.texture);
    this.sprite.setPosition(x, y);
    this.sprite.setVisible(true);
    this.sprite.setRotation(Math.atan2(dir.y, dir.x));
    this.vel = dir.clone().normalize().scale(opts.speed);
    this.damage = opts.damage;
    this.pierce = opts.pierce;
    this.aoe = opts.aoe;
    this.kb = opts.kb;
    this.hit.clear();
    this.active = true;
  }

  update(dt: number): void {
    if (!this.active) return;
    this.sprite.x += this.vel.x * dt;
    this.sprite.y += this.vel.y * dt;
    // 飞出屏幕外回收
    const m = 60;
    if (
      this.sprite.x < -m ||
      this.sprite.x > GAME_WIDTH + m ||
      this.sprite.y < -m ||
      this.sprite.y > GAME_HEIGHT + m
    ) {
      this.active = false;
      this.sprite.setVisible(false);
    }
  }

  reset(): void {
    this.active = false;
    this.sprite.setVisible(false);
    this.hit.clear();
  }
}
