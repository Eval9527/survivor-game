// 启动场景：程序生成占位纹理（v0.1 暂无美术素材），然后进游戏。
// 正式素材放 public/assets/sprites 后，这里改成 this.load.image。

import Phaser from 'phaser';

export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const g = this.add.graphics();

    const circle = (key: string, r: number, color: number): void => {
      g.clear();
      g.fillStyle(color, 1);
      g.fillCircle(r, r, r);
      g.generateTexture(key, r * 2, r * 2);
    };

    circle('player', 14, 0x3ddc84);
    circle('slime', 12, 0x9b59b6);
    circle('bat', 10, 0xc0392b);
    circle('skeleton', 12, 0xecf0f1);
    circle('fireball', 8, 0xe67e22);
    circle('axe', 10, 0x95a5a6);

    // 飞刀：黄色小矩形
    g.clear();
    g.fillStyle(0xf1c40f, 1);
    g.fillRect(0, 0, 16, 4);
    g.generateTexture('knife', 16, 4);

    // 经验宝石：青色菱形
    g.clear();
    g.fillStyle(0x00d2ff, 1);
    g.beginPath();
    g.moveTo(6, 0);
    g.lineTo(12, 8);
    g.lineTo(6, 16);
    g.lineTo(0, 8);
    g.closePath();
    g.fillPath();
    g.generateTexture('gem', 12, 16);

    g.destroy();
    this.scene.start('Game');
  }
}
