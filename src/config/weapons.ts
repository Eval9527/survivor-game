// 武器数值表：5 把武器，全数据驱动。
// 一把武器 = 一行配置 + 一个行为函数，行为在 Game 场景里按 id 分发。

export interface WeaponLevel {
  damage: number; // 毒雾光环是每秒伤害
  count?: number; // 投射物 / 环绕数 / 闪电链目标数
  pierce?: number; // 穿透数
  radius?: number; // 范围 px
  extra?: string; // 特殊效果
}

export interface WeaponDef {
  id: string;
  name: string;
  cooldown: number;
  levels: WeaponLevel[]; // 5 级
  evolveWith: string; // 进化所需被动
  evolveTo: string;
}

export const WEAPONS: WeaponDef[] = [
  {
    id: 'knife',
    name: '飞刀',
    cooldown: 0.9,
    levels: [
      { damage: 8, count: 1 },
      { damage: 10, count: 2 },
      { damage: 12, count: 2, pierce: 1 },
      { damage: 14, count: 3, pierce: 1 },
      { damage: 16, count: 4, pierce: 2 },
    ],
    evolveWith: 'boots',
    evolveTo: 'piercing-dagger',
  },
  {
    id: 'axe',
    name: '旋转斧',
    cooldown: 0.5,
    levels: [
      { damage: 12, count: 2, radius: 80 },
      { damage: 14, count: 2, radius: 90 },
      { damage: 16, count: 3, radius: 100 },
      { damage: 18, count: 3, radius: 105 },
      { damage: 20, count: 4, radius: 110, extra: '转速 240°/s' },
    ],
    evolveWith: 'gloves',
    evolveTo: 'blood-axe',
  },
  {
    id: 'lightning',
    name: '闪电链',
    cooldown: 1.4,
    levels: [
      { damage: 15, count: 3 },
      { damage: 17, count: 3 },
      { damage: 19, count: 4 },
      { damage: 21, count: 5 },
      { damage: 24, count: 6, extra: '麻痹 0.3s' },
    ],
    evolveWith: 'core',
    evolveTo: 'thunderstorm',
  },
  {
    id: 'fireball',
    name: '火球',
    cooldown: 1.6,
    levels: [
      { damage: 20, radius: 60 },
      { damage: 24, radius: 70 },
      { damage: 28, radius: 80 },
      { damage: 32, radius: 90 },
      { damage: 36, radius: 100, extra: '留火 3s' },
    ],
    evolveWith: 'fuel',
    evolveTo: 'meteor',
  },
  {
    id: 'poison',
    name: '毒雾光环',
    cooldown: 0.5,
    levels: [
      { damage: 4, radius: 80 },
      { damage: 6, radius: 95 },
      { damage: 8, radius: 110 },
      { damage: 10, radius: 125 },
      { damage: 12, radius: 140, extra: '减速 20%' },
    ],
    evolveWith: 'gland',
    evolveTo: 'plague',
  },
];

export function getWeapon(id: string): WeaponDef {
  const def = WEAPONS.find((w) => w.id === id);
  if (!def) throw new Error(`unknown weapon: ${id}`);
  return def;
}
