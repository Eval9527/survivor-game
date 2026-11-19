import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/game';
import Boot from './scenes/Boot';
import Game from './scenes/Game';
import GameOver from './scenes/GameOver';
import LevelUp from './ui/LevelUp';

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#101014',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Boot, Game, GameOver, LevelUp],
});
