import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game';
import { getWeapon, WeaponDef } from '../config/weapons';

export interface OwnedWeapon {
  def: WeaponDef;
  level: number;
}

const RADIUS = 14;

export class Player {
  sprite: Phaser.GameObjects.Sprite;
  hp = 100;
  maxHp = 100;
  speed = 160;
  xp = 0;
  level = 1;
  xpNext = 5;
  weapons: OwnedWeapon[] = [];

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    this.sprite = scene.add.sprite(x, y, 'player');
    this.sprite.setDepth(10);
    // 开局自带飞刀 Lv1
    this.weapons.push({ def: getWeapon('knife'), level: 1 });
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

  move(dir: Phaser.Math.Vector2, dt: number): void {
    if (dir.lengthSq() === 0) return;
    dir.normalize();
    this.sprite.x = Phaser.Math.Clamp(
      this.sprite.x + dir.x * this.speed * dt,
      RADIUS,
      GAME_WIDTH - RADIUS,
    );
    this.sprite.y = Phaser.Math.Clamp(
      this.sprite.y + dir.y * this.speed * dt,
      RADIUS,
      GAME_HEIGHT - RADIUS,
    );
  }

  takeDamage(dmg: number): void {
    this.hp = Math.max(0, this.hp - dmg);
    this.sprite.setTintFill(0xff0000);
    this.scene.time.delayedCall(100, () => this.sprite.clearTint());
  }

  heal(n: number): void {
    this.hp = Math.min(this.maxHp, this.hp + n);
  }

  /** 加经验，返回是否升级。 */
  addXp(n: number): boolean {
    this.xp += n;
    if (this.xp < this.xpNext) return false;
    this.xp -= this.xpNext;
    this.level++;
    this.xpNext = Math.floor(this.xpNext * 1.35);
    return true;
  }

  addWeapon(id: string): void {
    if (this.weapons.some((w) => w.def.id === id)) return;
    this.weapons.push({ def: getWeapon(id), level: 1 });
  }

  upgradeWeapon(id: string): void {
    const w = this.weapons.find((w) => w.def.id === id);
    if (w && w.level < w.def.levels.length) w.level++;
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }
}
