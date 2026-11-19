# survivor-game

像素风 Roguelite 幸存者小游戏（Phaser 3 + TypeScript + Vite，网页版）。

核心玩法：你只管走位，武器自动打怪，杀怪掉经验升级、三选一强化，撑过 10 分钟通关。

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:5173 即可游玩。WASD / 方向键移动，武器全自动攻击。

## 内容

- 5 把武器（飞刀 / 旋转斧 / 闪电链 / 火球 / 毒雾光环），每把 5 级 + 进化形态
- 3 种敌人（史莱姆 / 蝙蝠 / 骷髅），带状态机 AI
- 升级词条池 20+，每级三选一
- 目标：同屏 300 只怪稳 60 帧（空间哈希网格 + 软分离 + 对象池）

## 结构

```
src/
├── main.ts            # Phaser.Game 入口
├── config/            # game.ts（画布/时长）+ weapons.ts（5 把武器数值表）
├── scenes/            # Boot / Game / GameOver
├── entities/          # Player / Enemy（状态机）/ Projectile
├── systems/           # SpatialHash / Spawner / ObjectPool
└── ui/                # HUD / LevelUp（三选一）
docs/
├── design.md          # 玩法文档
└── balance.md         # 数值表
```

详细玩法见 [docs/design.md](docs/design.md)，数值见 [docs/balance.md](docs/balance.md)。

## 状态

早期脚手架：v0.1 单图、核心循环可跑。路线图：3 张图、武器进化、itch.io 发布。
