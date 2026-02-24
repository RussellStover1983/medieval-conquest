import { TERRAIN } from '../constants.js';

/**
 * Centralized particle effects using Phaser tweens + sprites.
 * Avoids the Phaser particle emitter API for simplicity — uses
 * lightweight sprite pools with tweens for dust, blood, sparkle, and weather.
 */
export default class ParticleManager {
  constructor(scene) {
    this.scene = scene;
    this.weatherEmitters = [];
    this.weatherType = 'none';
    this.weatherTimer = null;
    this.ambientTimer = null;
    this.ambientType = -1;
  }

  // ── Dust particles (walking) ───────────────────────────────────────────

  emitDust(x, y, terrainType) {
    const count = 3;
    // Pick dust texture based on terrain
    let textureKey = 'particle_dust';
    if (terrainType === TERRAIN.SAND) textureKey = 'particle_dust_sand';
    else if (terrainType === TERRAIN.SNOW) textureKey = 'particle_dust_snow';

    for (let i = 0; i < count; i++) {
      const p = this.scene.add.sprite(
        x + (Math.random() - 0.5) * 8,
        y,
        textureKey
      );
      p.setDepth(8);
      p.setAlpha(0.6);
      p.setScale(1 + Math.random());

      this.scene.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 12,
        y: p.y + 4 + Math.random() * 6,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 300 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  // ── Blood particles (combat hit) ──────────────────────────────────────

  emitBlood(x, y) {
    const count = 8;
    const bloodTextures = ['particle_blood', 'particle_blood_1', 'particle_blood_2'];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 20 + Math.random() * 30;
      const tex = bloodTextures[Math.floor(Math.random() * bloodTextures.length)];
      const p = this.scene.add.sprite(x, y, tex);
      p.setDepth(14);
      p.setAlpha(0.9);
      p.setScale(0.6 + Math.random() * 1.2); // wider scale range

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 8,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  // ── Sparkle particles (resource pickup) ────────────────────────────────

  emitSparkle(x, y, color) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.sprite(
        x + (Math.random() - 0.5) * 12,
        y + (Math.random() - 0.5) * 12,
        'particle_sparkle'
      );
      p.setDepth(14);
      p.setAlpha(1);
      p.setScale(0.5 + Math.random() * 1.0);
      if (color !== undefined) p.setTint(color);

      this.scene.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 20,
        y: p.y - 10 - Math.random() * 15,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        angle: Math.random() * 180,
        duration: 500 + Math.random() * 300,
        ease: 'Power1',
        onComplete: () => p.destroy(),
      });
    }
  }

  // ── Impact sparks (combat) ─────────────────────────────────────────────

  emitSparks(x, y) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
      const speed = 15 + Math.random() * 25;
      const p = this.scene.add.sprite(x, y, 'particle_spark');
      p.setDepth(16);
      p.setAlpha(1);
      p.setScale(1 + Math.random() * 0.5);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 200,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  // ── Ambient particle effects ───────────────────────────────────────────

  startAmbientEffects(terrainType) {
    if (this.ambientType === terrainType) return;
    this.stopAmbientEffects();
    this.ambientType = terrainType;

    const camera = this.scene.cameras.main;

    if (terrainType === TERRAIN.FOREST) {
      // Falling leaves every 300ms
      this.ambientTimer = this.scene.time.addEvent({
        delay: 300,
        loop: true,
        callback: () => this._spawnLeaf(camera),
      });
    } else if (terrainType === TERRAIN.WATER || terrainType === TERRAIN.DEEP_WATER || terrainType === TERRAIN.RIVER) {
      // Mist particles every 500ms
      this.ambientTimer = this.scene.time.addEvent({
        delay: 500,
        loop: true,
        callback: () => this._spawnMist(camera),
      });
    } else if (terrainType === TERRAIN.SAND) {
      // Dust motes every 200ms
      this.ambientTimer = this.scene.time.addEvent({
        delay: 200,
        loop: true,
        callback: () => this._spawnDustMote(camera),
      });
    } else if (terrainType === TERRAIN.SNOW) {
      // Occasional sparkle every 800ms
      this.ambientTimer = this.scene.time.addEvent({
        delay: 800,
        loop: true,
        callback: () => this._spawnSnowSparkle(camera),
      });
    }
  }

  stopAmbientEffects() {
    if (this.ambientTimer) {
      this.ambientTimer.remove();
      this.ambientTimer = null;
    }
    this.ambientType = -1;
  }

  _getViewport(camera) {
    const scrollX = camera.scrollX - camera.width / (2 * camera.zoom);
    const scrollY = camera.scrollY - camera.height / (2 * camera.zoom);
    const viewW = camera.width / camera.zoom;
    const viewH = camera.height / camera.zoom;
    return { scrollX, scrollY, viewW, viewH };
  }

  _spawnLeaf(camera) {
    const { scrollX, scrollY, viewW, viewH } = this._getViewport(camera);
    const tex = Math.random() < 0.6 ? 'particle_leaf_green' : 'particle_leaf_gold';
    const x = scrollX + Math.random() * viewW;
    const y = scrollY - 5;

    const p = this.scene.add.sprite(x, y, tex);
    p.setDepth(18);
    p.setAlpha(0.7);
    p.setScale(0.8 + Math.random() * 0.5);

    const duration = 2000 + Math.random() * 1000;
    this.scene.tweens.add({
      targets: p,
      x: x + 30 + Math.random() * 40, // diagonal drift
      y: y + viewH * 0.6 + Math.random() * viewH * 0.3,
      alpha: 0,
      angle: 180 + Math.random() * 360, // rotate
      duration,
      ease: 'Sine.easeIn',
      onComplete: () => p.destroy(),
    });
  }

  _spawnMist(camera) {
    const { scrollX, scrollY, viewW, viewH } = this._getViewport(camera);
    const x = scrollX + Math.random() * viewW;
    const y = scrollY + viewH * 0.5 + Math.random() * viewH * 0.4;

    const p = this.scene.add.sprite(x, y, 'particle_mist');
    p.setDepth(17);
    p.setAlpha(0.25);
    p.setScale(1.5 + Math.random());

    const duration = 3000 + Math.random() * 1000;
    this.scene.tweens.add({
      targets: p,
      y: y - 20 - Math.random() * 15, // slow rise
      scaleX: p.scaleX * 1.8, // expand
      scaleY: p.scaleY * 1.8,
      alpha: 0,
      duration,
      ease: 'Sine.easeOut',
      onComplete: () => p.destroy(),
    });
  }

  _spawnDustMote(camera) {
    const { scrollX, scrollY, viewW, viewH } = this._getViewport(camera);
    const x = scrollX + Math.random() * viewW;
    const y = scrollY + viewH * 0.3 + Math.random() * viewH * 0.5;

    const p = this.scene.add.sprite(x, y, 'particle_dust_sand');
    p.setDepth(17);
    p.setAlpha(0.4);
    p.setScale(0.8 + Math.random() * 0.6);

    this.scene.tweens.add({
      targets: p,
      x: x + 20 + Math.random() * 30, // horizontal drift
      y: y + (Math.random() - 0.5) * 10,
      alpha: 0,
      duration: 1500,
      ease: 'Sine.easeOut',
      onComplete: () => p.destroy(),
    });
  }

  _spawnSnowSparkle(camera) {
    const { scrollX, scrollY, viewW, viewH } = this._getViewport(camera);
    const x = scrollX + Math.random() * viewW;
    const y = scrollY + Math.random() * viewH;

    const p = this.scene.add.sprite(x, y, 'particle_sparkle');
    p.setDepth(18);
    p.setAlpha(0);
    p.setScale(0.3);

    // Pulse scale + fade
    this.scene.tweens.add({
      targets: p,
      alpha: 0.8,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 300,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => p.destroy(),
    });
  }

  // ── Weather system ────────────────────────────────────────────────────

  createWeatherSystem(type) {
    // Don't recreate same weather
    if (this.weatherType === type) return;
    this.stopWeather();
    this.weatherType = type;

    if (type === 'none') return;

    const camera = this.scene.cameras.main;

    // Spawn weather particles on a timer
    this.weatherTimer = this.scene.time.addEvent({
      delay: type === 'rain' ? 50 : 120,
      loop: true,
      callback: () => {
        this._spawnWeatherParticle(type, camera);
      },
    });
  }

  _spawnWeatherParticle(type, camera) {
    // Spawn within the camera viewport
    const { scrollX, scrollY, viewW, viewH } = this._getViewport(camera);

    const x = scrollX + Math.random() * viewW * 1.2;
    const y = scrollY - 10;
    const textureKey = type === 'rain' ? 'particle_rain' : 'particle_snow';

    const p = this.scene.add.sprite(x, y, textureKey);
    p.setDepth(20);
    p.setAlpha(type === 'rain' ? 0.5 : 0.7);

    if (type === 'snow') {
      p.setScale(0.6 + Math.random() * 0.8); // wider size range
      p.setAngle(Math.random() * 360); // initial rotation
    } else {
      p.setScale(1);
    }

    const duration = type === 'rain' ? 600 + Math.random() * 300 : 2000 + Math.random() * 1500;
    const drift = type === 'rain' ? (Math.random() - 0.5) * 10 : (Math.random() - 0.5) * 30;

    const tweenConfig = {
      targets: p,
      x: x + drift,
      y: y + viewH + 20,
      alpha: 0,
      duration,
      ease: type === 'rain' ? 'Linear' : 'Sine.easeIn',
      onComplete: () => {
        // Rain splash effect
        if (type === 'rain' && Math.random() < 0.5) {
          this._spawnRainSplash(p.x, p.y);
        }
        p.destroy();
      },
    };

    // Snow gets gentle rotation
    if (type === 'snow') {
      tweenConfig.angle = p.angle + 90 + Math.random() * 180;
    }

    this.scene.tweens.add(tweenConfig);

    this.weatherEmitters.push(p);

    // Clean up old references
    if (this.weatherEmitters.length > 200) {
      this.weatherEmitters = this.weatherEmitters.filter(s => s.active);
    }
  }

  _spawnRainSplash(x, y) {
    const p = this.scene.add.sprite(x, y, 'particle_rainsplash');
    p.setDepth(19);
    p.setAlpha(0.6);
    p.setScale(0.5);

    this.scene.tweens.add({
      targets: p,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 200,
      ease: 'Power1',
      onComplete: () => p.destroy(),
    });
  }

  stopWeather() {
    if (this.weatherTimer) {
      this.weatherTimer.remove();
      this.weatherTimer = null;
    }
    this.weatherType = 'none';
    // Existing particles will fade out on their own
    this.weatherEmitters = [];
  }
}
