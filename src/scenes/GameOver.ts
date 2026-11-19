import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game';

interface GameOverData {
  victory: boolean;
  time: number;
  kills: number;
  level: number;
}

export default class GameOver extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data: GameOverData): void {
    const cx = GAME_WIDTH / 2;
    const mm = String(Math.floor(data.time / 60)).padStart(2, '0');
    const ss = String(data.time % 60).padStart(2, '0');

    this.add
      .text(cx, 160, data.victory ? '通关！' : '你倒下了', {
        fontSize: '48px',
        color: data.victory ? '#3ddc84' : '#ff4757',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 240, `存活 ${mm}:${ss}  ·  击杀 ${data.kills}  ·  等级 ${data.level}`, {
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const btn = this.add
      .text(cx, 320, '再来一局', { fontSize: '24px', color: '#00d2ff' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.scene.start('Game'));
  }
}
