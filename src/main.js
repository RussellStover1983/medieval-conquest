import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import PreloadScene from './scenes/PreloadScene.js';
import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import CharSelectScene from './scenes/CharSelectScene.js';
import GameScene from './scenes/GameScene.js';
import HUDScene from './scenes/HUDScene.js';
import VillageScene from './scenes/VillageScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  input: {
    activePointers: 3,
  },
  scene: [PreloadScene, BootScene, MainMenuScene, CharSelectScene, GameScene, HUDScene, VillageScene],
  backgroundColor: '#2c1810',
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
};

new Phaser.Game(config);
