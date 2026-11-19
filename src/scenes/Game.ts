// 主游戏场景：核心循环（走位 → 自动输出 → 拾取升级 → 三选一）
// 每帧流程：刷怪 → 重建空间哈希 → 敌人状态机 → 软分离 →
// 武器开火 → 投射物碰撞 → 宝石磁吸 → HUD。

import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { SpatialHash } from '../systems/SpatialHash';
import { Spawner } from '../systems/Spawner';
import { ObjectPool } from '../systems/ObjectPool';
import { HUD } from '../ui/HUD';
import { WEAPONS } from '../config/weapons';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  RUN_DURATION,
  CELL_SIZE,
} from '../config/game';

interface Gem {
  sprite: Phaser.GameObjects.Sprite;
  value: number;
  heal: number;
}

interface PendingChoice {
  kind: 'weapon' | 'upgrade' | 'heal';
  weaponId?: string;
  label: string;
}

export default class Game extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private hash = new SpatialHash<Enemy>(CELL_SIZE);
  private spawner!: Spawner;
  private projectilePool!: ObjectPool<Projectile>;
  private projectiles: Projectile[] = [];
  private gems: Gem[] = [];
  private axeSprites: Phaser.GameObjects.Sprite[] = [];
  private lightningFx!: Phaser.GameObjects.Graphics;
  private poisonCircle!: Phaser.GameObjects.Arc;
  private hud!: HUD;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private weaponTimers = new Map<string, number>();
  private elapsed = 0;
  private kills = 0;
  private levelUpOpen = false;
  private over = false;

  constructor() {
    super('Game');
  }

  create(): void {
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.spawner = new Spawner(this, this.enemies);
    this.projectilePool = new ObjectPool<Projectile>(
      () => new Projectile(this),
      (p) => p.reset(),
      32,
    );
    this.lightningFx = this.add.graphics();
    this.poisonCircle = this.add.circle(0, 0, 80, 0x00ff88, 0.1);
    this.poisonCircle.setVisible(false);
    this.hud = new HUD(this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
  }

  update(_time: number, delta: number): void {
    if (this.over) return;
    const dt = delta / 1000;
    this.elapsed += dt;

    // 通关：撑满 10 分钟
    if (this.elapsed >= RUN_DURATION) return this.finish(true);

    this.handleMovement(dt);
    this.spawner.update(dt);
    this.rebuildHash();
    this.updateEnemies(dt);
    this.separateEnemies();
    this.updateWeapons(dt);
    this.updateProjectiles(dt);
    this.updateGems(dt);
    this.updateAxeSprites();
    this.updatePoisonCircle();

    this.hud.update(
      this.player.hp,
      this.player.maxHp,
      Math.max(0, RUN_DURATION - this.elapsed),
      this.kills,
      this.player.level,
    );

    if (this.player.isDead) this.finish(false);
  }

  private handleMovement(dt: number): void {
    const dir = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left.isDown || this.wasd.A.isDown) dir.x -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dir.x += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dir.y -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dir.y += 1;
    this.player.move(dir, dt);
  }

  private rebuildHash(): void {
    this.hash.clear();
    for (const e of this.enemies) {
      if (e.state !== 'dead') this.hash.insert(e);
    }
  }

  private updateEnemies(dt: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.player);
      if (e.state === 'dead') {
        this.kills++;
        this.dropGem(e);
        e.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  /** 软分离：重叠了才推开，每只怪每帧最多推一次。 */
  private separateEnemies(): void {
    for (const e of this.enemies) {
      if (e.state === 'dead') continue;
      for (const o of this.hash.queryNeighbors(e.x, e.y)) {
        if (o === e || o.state === 'dead') continue;
        const dx = e.x - o.x;
        const dy = e.y - o.y;
        const minDist = e.radius + o.radius;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0 && d2 < minDist * minDist) {
          const d = Math.sqrt(d2);
          const push = ((minDist - d) / 2) * 0.5;
          e.sprite.x += (dx / d) * push;
          e.sprite.y += (dy / d) * push;
          break;
        }
      }
    }
  }

  private updateWeapons(dt: number): void {
    for (const w of this.player.weapons) {
      const t = (this.weaponTimers.get(w.def.id) ?? 0) - dt;
      if (t > 0) {
        this.weaponTimers.set(w.def.id, t);
        continue;
      }
      this.weaponTimers.set(w.def.id, w.def.cooldown);
      const lv = w.def.levels[w.level - 1];
      switch (w.def.id) {
        case 'knife':
          this.fireKnives(lv);
          break;
        case 'axe':
          this.tickAxes(lv);
          break;
        case 'lightning':
          this.fireLightning(lv);
          break;
        case 'fireball':
          this.fireFireball(lv);
          break;
        case 'poison':
          this.tickPoison(lv);
          break;
      }
    }
  }

  private nearestEnemies(n: number, range: number): Enemy[] {
    return this.hash
      .queryRadius(this.player.x, this.player.y, range)
      .filter((e) => e.state !== 'dead')
      .sort(
        (a, b) =>
          a.pos.distance(this.player.pos) - b.pos.distance(this.player.pos),
      )
      .slice(0, n);
  }

  private fireKnives(lv: { damage: number; count?: number; pierce?: number }): void {
    const targets = this.nearestEnemies(1, 420);
    if (targets.length === 0) return;
    const base = targets[0].pos.clone().subtract(this.player.pos);
    const count = lv.count ?? 1;
    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(base.y, base.x) + (i - (count - 1) / 2) * 0.18;
      const dir = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
      const p = this.projectilePool.obtain();
      p.fire(this.player.x, this.player.y, dir, {
        damage: lv.damage,
        pierce: lv.pierce ?? 0,
        aoe: 0,
        kb: 1,
        speed: 420,
        texture: 'knife',
      });
      this.projectiles.push(p);
    }
  }

  private fireFireball(lv: { damage: number; radius?: number }): void {
    const targets = this.nearestEnemies(1, 420);
    if (targets.length === 0) return;
    const dir = targets[0].pos.clone().subtract(this.player.pos);
    const p = this.projectilePool.obtain();
    p.fire(this.player.x, this.player.y, dir, {
      damage: lv.damage,
      pierce: 0,
      aoe: lv.radius ?? 60,
      kb: 1,
      speed: 300,
      texture: 'fireball',
    });
    this.projectiles.push(p);
  }

  private fireLightning(lv: {
    damage: number;
    count?: number;
    extra?: string;
  }): void {
    const targets = this.nearestEnemies(lv.count ?? 3, 420);
    if (targets.length === 0) return;
    this.lightningFx.clear();
    this.lightningFx.lineStyle(2, 0xffe600, 0.9);
    let from = this.player.pos.clone();
    for (const t of targets) {
      t.takeDamage(lv.damage, 0, from);
      this.lightningFx.lineBetween(from.x, from.y, t.x, t.y);
      from = t.pos.clone();
    }
    this.time.delayedCall(120, () => this.lightningFx.clear());
  }

  private tickAxes(lv: { damage: number }): void {
    // 斧头位置每帧在 updateAxeSprites 里更新，这里只做伤害判定
    for (const axe of this.axeSprites) {
      for (const e of this.hash.queryRadius(axe.x, axe.y, 26)) {
        if (e.state !== 'dead') e.takeDamage(lv.damage, 1, this.player.pos);
      }
    }
  }

  private tickPoison(lv: { damage: number; radius?: number }): void {
    const radius = lv.radius ?? 80;
    for (const e of this.hash.queryRadius(this.player.x, this.player.y, radius)) {
      if (e.state === 'dead') continue;
      e.takeDamage(lv.damage * 0.5, 0, this.player.pos);
      e.slowTimer = 1;
    }
  }

  private updateAxeSprites(): void {
    const axe = this.player.weapons.find((w) => w.def.id === 'axe');
    const want = axe ? (axe.def.levels[axe.level - 1].count ?? 2) : 0;
    while (this.axeSprites.length < want) {
      this.axeSprites.push(this.add.sprite(0, 0, 'axe'));
    }
    while (this.axeSprites.length > want) {
      this.axeSprites.pop()!.destroy();
    }
    if (!axe) return;
    const radius = axe.def.levels[axe.level - 1].radius ?? 80;
    const rot = this.elapsed * 4.2; // 约 240°/s
    this.axeSprites.forEach((s, i) => {
      const a = rot + (i / this.axeSprites.length) * Math.PI * 2;
      s.setPosition(
        this.player.x + Math.cos(a) * radius,
        this.player.y + Math.sin(a) * radius,
      );
    });
  }

  private updatePoisonCircle(): void {
    const poison = this.player.weapons.find((w) => w.def.id === 'poison');
    if (!poison) {
      this.poisonCircle.setVisible(false);
      return;
    }
    const radius = poison.def.levels[poison.level - 1].radius ?? 80;
    this.poisonCircle.setVisible(true);
    this.poisonCircle.setPosition(this.player.x, this.player.y);
    this.poisonCircle.setRadius(radius);
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);
      if (p.active) {
        for (const e of this.hash.queryRadius(p.x, p.y, 18)) {
          if (e.state === 'dead' || p.hit.has(e)) continue;
          p.hit.add(e);
          if (p.aoe > 0) {
            // 火球：命中点 AoE
            for (const t of this.hash.queryRadius(p.x, p.y, p.aoe)) {
              if (t.state !== 'dead') t.takeDamage(p.damage, p.kb, p.pos);
            }
            p.active = false;
            p.sprite.setVisible(false);
            break;
          }
          e.takeDamage(p.damage, p.kb, this.player.pos);
          p.pierce--;
          if (p.pierce < 0) {
            p.active = false;
            p.sprite.setVisible(false);
            break;
          }
        }
      }
      if (!p.active) {
        this.projectilePool.release(p);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private dropGem(e: Enemy): void {
    const sprite = this.add.sprite(e.x, e.y, 'gem');
    // 15% 掉血瓶（红色宝石，回 20 HP）
    const isBlood = Math.random() < 0.15;
    if (isBlood) sprite.setTint(0xff4757);
    this.gems.push({ sprite, value: e.xp, heal: isBlood ? 20 : 0 });
  }

  private updateGems(dt: number): void {
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      const d = Phaser.Math.Distance.Between(
        g.sprite.x,
        g.sprite.y,
        this.player.x,
        this.player.y,
      );
      if (d < 90) {
        // 磁吸
        const dir = this.player.pos
          .clone()
          .subtract(new Phaser.Math.Vector2(g.sprite.x, g.sprite.y))
          .normalize();
        g.sprite.x += dir.x * 300 * dt;
        g.sprite.y += dir.y * 300 * dt;
      }
      if (d < 22) {
        g.sprite.destroy();
        this.gems.splice(i, 1);
        if (g.heal > 0) this.player.heal(g.heal);
        if (g.value > 0 && this.player.addXp(g.value)) this.openLevelUp();
      }
    }
  }

  private openLevelUp(): void {
    if (this.levelUpOpen || this.over) return;
    this.levelUpOpen = true;

    const choices: PendingChoice[] = [];
    // 未拥有的武器
    for (const def of WEAPONS) {
      if (!this.player.weapons.some((w) => w.def.id === def.id)) {
        choices.push({
          kind: 'weapon',
          weaponId: def.id,
          label: `新武器：${def.name}`,
        });
      }
    }
    // 可升级的已有武器
    for (const w of this.player.weapons) {
      if (w.level < w.def.levels.length) {
        choices.push({
          kind: 'upgrade',
          weaponId: w.def.id,
          label: `${w.def.name} Lv${w.level} → Lv${w.level + 1}`,
        });
      }
    }
    choices.push({ kind: 'heal', label: '回血 +30' });

    // 洗牌取 3 个
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    const picked = choices.slice(0, 3);

    this.game.events.once('levelup-choice', (index: number) => {
      const c = picked[index];
      if (!c) return;
      if (c.kind === 'weapon' && c.weaponId) this.player.addWeapon(c.weaponId);
      if (c.kind === 'upgrade' && c.weaponId) {
        this.player.upgradeWeapon(c.weaponId);
      }
      if (c.kind === 'heal') this.player.heal(30);
      this.levelUpOpen = false;
    });

    this.scene.pause();
    this.scene.launch('LevelUp', { options: picked.map((c) => c.label) });
  }

  private finish(victory: boolean): void {
    if (this.over) return;
    this.over = true;
    this.scene.start('GameOver', {
      victory,
      time: Math.floor(this.elapsed),
      kills: this.kills,
      level: this.player.level,
    });
  }
}
