// 升级三选一：以独立场景盖在暂停的 Game 场景上，
// 选完通过 game.events 回传下标，再恢复 Game。

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game';

export default class LevelUp extends Phaser.Scene {
  constructor() {
    super('LevelUp');
  }

  create(data: { options: string[] }): void {
    // 半透明遮罩
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0);
    this.add
      .text(GAME_WIDTH / 2, 150, '升级！选一个强化', {
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    data.options.forEach((label, i) => {
      const y = 230 + i * 70;
      const btn = this.add
        .text(GAME_WIDTH / 2, y, label, {
          fontSize: '22px',
          color: '#00d2ff',
          backgroundColor: '#1a1a22',
          padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.game.events.emit('levelup-choice', i);
        this.scene.stop();
        this.scene.resume('Game');
      });
    });
  }
}
