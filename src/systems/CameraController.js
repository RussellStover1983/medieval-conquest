import { MAP_ZOOM, EXPLORE_ZOOM, WORLD_WIDTH, WORLD_HEIGHT, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { clamp } from '../utils/MathHelpers.js';

export default class CameraController {
  constructor(scene) {
    this.scene = scene;
    this.isMapView = true;
    this.isTransitioning = false;

    this.camera = scene.cameras.main;

    // Start in map view - no bounds so zoomed-out view can center
    this.camera.setZoom(MAP_ZOOM);
    this.camera.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    // Drag-to-pan state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.camStartX = 0;
    this.camStartY = 0;

    this.setupInput();
  }

  setupInput() {
    const scene = this.scene;

    scene.input.on('pointerdown', (pointer) => {
      if (!this.isMapView || this.isTransitioning) return;
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.camStartX = this.camera.scrollX;
      this.camStartY = this.camera.scrollY;
    });

    scene.input.on('pointermove', (pointer) => {
      if (!this.isDragging || !this.isMapView) return;
      const dx = (this.dragStartX - pointer.x) / this.camera.zoom;
      const dy = (this.dragStartY - pointer.y) / this.camera.zoom;
      this.camera.scrollX = this.camStartX + dx;
      this.camera.scrollY = this.camStartY + dy;
    });

    scene.input.on('pointerup', () => {
      this.isDragging = false;
    });

    scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (!this.isMapView || this.isTransitioning) return;
      const newZoom = clamp(this.camera.zoom - deltaY * 0.001, 0.1, 0.5);
      this.camera.setZoom(newZoom);
    });
  }

  toggleView(player) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    if (this.isMapView) {
      this.transitionToExplore(player);
    } else {
      this.transitionToMap(player);
    }
  }

  transitionToExplore(player) {
    const pos = player.getPosition();

    // Directly jump camera to player and set zoom — no tween on scroll
    // because bounds + tween fight each other
    this.scene.tweens.add({
      targets: this.camera,
      zoom: EXPLORE_ZOOM,
      duration: 800,
      ease: 'Power2',
      onUpdate: () => {
        // Continuously center on player during zoom
        this.camera.centerOn(pos.x, pos.y);
      },
      onComplete: () => {
        this.camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.camera.startFollow(player.sprite, true, 0.1, 0.1);
        this.isMapView = false;
        this.isTransitioning = false;
      },
    });
  }

  transitionToMap(player) {
    this.camera.stopFollow();
    // Remove tight bounds for map view
    this.camera.setBounds(-WORLD_WIDTH, -WORLD_HEIGHT, WORLD_WIDTH * 3, WORLD_HEIGHT * 3);

    this.scene.tweens.add({
      targets: this.camera,
      zoom: MAP_ZOOM,
      duration: 800,
      ease: 'Power2',
      onUpdate: () => {
        this.camera.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
      },
      onComplete: () => {
        this.isMapView = true;
        this.isTransitioning = false;
      },
    });
  }
}
