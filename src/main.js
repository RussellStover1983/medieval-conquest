import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import PreloadScene from './scenes/PreloadScene.js';
import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import LoginScene from './scenes/LoginScene.js';
import CharSelectScene from './scenes/CharSelectScene.js';
import GameScene from './scenes/GameScene.js';
import HUDScene from './scenes/HUDScene.js';
import VillageScene from './scenes/VillageScene.js';

// On mobile/iPad, prefer Canvas2D to avoid WebGL texture memory crashes
const isMobile = navigator.maxTouchPoints > 0 || /iPad|iPhone|Android/i.test(navigator.userAgent);

const config = {
  type: isMobile ? Phaser.CANVAS : Phaser.AUTO,
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
  scene: [PreloadScene, BootScene, MainMenuScene, LoginScene, CharSelectScene, GameScene, HUDScene, VillageScene],
  backgroundColor: '#2c1810',
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
};

const game = new Phaser.Game(config);

// Handle WebGL context loss gracefully (reload instead of white screen)
const canvas = game.canvas;
if (canvas) {
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.warn('[Medieval Conquest] WebGL context lost — reloading...');
    setTimeout(() => window.location.reload(), 1000);
  });
}
