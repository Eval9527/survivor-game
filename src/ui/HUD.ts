import Phaser from 'phaser';

export class HUD {
  private hpText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;
  private killsText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const style = { fontSize: '16px', color: '#ffffff' };
    this.hpText = scene.add.text(12, 10, '', style).setDepth(100);
    this.timerText = scene.add.text(480, 10, '', style).setOrigin(0.5, 0).setDepth(100);
    this.killsText = scene.add.text(948, 10, '', style).setOrigin(1, 0).setDepth(100);
    this.levelText = scene.add.text(12, 32, '', style).setDepth(100);
  }

  update(
    hp: number,
    maxHp: number,
    timeLeft: number,
    kills: number,
    level: number,
  ): void {
    this.hpText.setText(`HP ${Math.ceil(hp)}/${maxHp}`);
    const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const ss = String(Math.floor(timeLeft % 60)).padStart(2, '0');
    this.timerText.setText(`${mm}:${ss}`);
    this.killsText.setText(`击杀 ${kills}`);
    this.levelText.setText(`Lv.${level}`);
  }
}
