import Phaser from 'phaser';
import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, TERRAIN, ITEMS } from '../constants.js';
import MapGenerator from '../map/MapGenerator.js';
import MapRenderer from '../map/MapRenderer.js';
import TerritoryManager from '../map/TerritoryManager.js';
import Player from '../entities/Player.js';
import MovementSystem from '../systems/MovementSystem.js';
import ResourceSystem from '../systems/ResourceSystem.js';
import CameraController from '../systems/CameraController.js';
import EnemySpawner from '../systems/EnemySpawner.js';
import CombatSystem from '../systems/CombatSystem.js';
import ParticleManager from '../systems/ParticleManager.js';
import BuildingSystem from '../systems/BuildingSystem.js';
import { tileToWorld, worldToTile } from '../utils/MathHelpers.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    try {
      console.log('[GameScene] create() starting');

      // Set physics world bounds (not camera bounds - camera handles its own)
      this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      console.log('[GameScene] physics bounds set');

      // Generate map
      const generator = new MapGenerator(42);
      this.mapData = generator.generate();
      console.log('[GameScene] map generated, terrain rows:', this.mapData.terrain.length, 'resources:', this.mapData.resources.length);

      // Render terrain
      this.mapRenderer = new MapRenderer(this);
      this.mapRenderer.renderTerrain(this.mapData.terrain);
      console.log('[GameScene] terrain rendered');
      this.mapRenderer.renderResources(this.mapData.resources);
      console.log('[GameScene] resources rendered');

      // Territory system
      this.territoryManager = new TerritoryManager(this);
      this.territoryManager.renderOverlay(TILE_SIZE);
      console.log('[GameScene] territories rendered');

      // Create player at spawn point
      const spawn = generator.findSpawnPoint();
      const spawnWorld = tileToWorld(spawn.x, spawn.y, TILE_SIZE);
      console.log('[GameScene] spawn point:', spawn, 'world:', spawnWorld);
      const selectedClass = this.registry.get('selectedClass') || 'Knight';
      this.player = new Player(this, spawnWorld.x, spawnWorld.y, selectedClass);
      console.log('[GameScene] player created');

      // Particle manager (must be before systems that use it)
      this.particleManager = new ParticleManager(this);
      console.log('[GameScene] particle manager created');

      // Camera controller
      this.cameraController = new CameraController(this);
      console.log('[GameScene] camera zoom:', this.cameras.main.zoom, 'scroll:', this.cameras.main.scrollX, this.cameras.main.scrollY);

      // Movement system
      this.movementSystem = new MovementSystem(this, this.player);

      // Resource system
      this.resourceSystem = new ResourceSystem(this, this.player, this.mapRenderer);
      this.resourceSystem.onCollect = (type, value) => {
        this.events.emit('resourceCollected', type, value);
        // Sparkle particles on resource pickup
        this.particleManager.emitSparkle(this.player.sprite.x, this.player.sprite.y);
      };

      // Enemy spawner + combat system
      this.enemySpawner = new EnemySpawner(this, this.mapData.terrain, this.mapData.camps);
      this.combatSystem = new CombatSystem(this, this.player, this.enemySpawner);

      // Building system
      this.buildingSystem = new BuildingSystem(this, this.player, this.mapData.terrain, this.territoryManager);

      // Launch HUD overlay scene
      this.scene.launch('HUDScene', {
        player: this.player,
        cameraController: this.cameraController,
        movementSystem: this.movementSystem,
        territoryManager: this.territoryManager,
        mapData: this.mapData,
        combatSystem: this.combatSystem,
        buildingSystem: this.buildingSystem,
      });
      // Keep keyboard input active even with HUD scene on top
      this.input.keyboard.enabled = true;
      console.log('[GameScene] HUD launched');

      // Fade in
      this.cameras.main.fadeIn(500, 44, 24, 16);

      // Territory discovery tracking
      this.lastTileX = -1;
      this.lastTileY = -1;

      // Weather tracking
      this.lastWeatherTerrain = -1;


      // Input pause flag (set by HUD when inventory panel is open)
      this.inputPaused = false;
      const hudScene = this.scene.get('HUDScene');
      this.events.on('pauseInput', (paused) => {
        this.inputPaused = paused;
        if (paused) this.player.stop();
      });

      // Village entry
      this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.eKeyJustPressed = false;
      this.nearVillage = null;
      this.enteringVillage = false;

      // Handle wake from village
      this.events.on('wake', () => {
        this.cameras.main.fadeIn(400, 44, 24, 16);
      });

      console.log('[GameScene] create() complete');
    } catch (e) {
      console.error('[GameScene] ERROR in create():', e);
    }
  }

  update() {
    // Only process movement in explore view
    if (!this.cameraController.isMapView && !this.cameraController.isTransitioning) {
      const dt = this.game.loop.delta / 1000;

      // Skip movement and combat when input is paused (inventory open)
      if (!this.inputPaused) {
        this.movementSystem.update(this.mapData.terrain);
        this.resourceSystem.update();
        this.player.update(dt);

        // Combat
        const pos = this.player.getPosition();
        this.enemySpawner.update(dt, pos.x, pos.y);
        this.combatSystem.update(dt);

        // Building system ghost placement
        this.buildingSystem.update(dt);
      }

      // Track territory discovery
      const tilePos = this.player.getTilePosition();
      if (tilePos.x !== this.lastTileX || tilePos.y !== this.lastTileY) {
        this.lastTileX = tilePos.x;
        this.lastTileY = tilePos.y;

        // Discover surrounding tiles (visibility radius based on class + torch bonus)
        let radius = this.player.className === 'Scout' ? 5 : 3;
        if (this.player.activeTool === 'torch') {
          radius += ITEMS.torch.visibilityBonus;
        }
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const result = this.territoryManager.discoverTile(tilePos.x + dx, tilePos.y + dy);
            if (result && result.captured) {
              this.events.emit('territoryCaptured', result.region);
            }
          }
        }

        this.events.emit('playerMoved', tilePos);

        // Update weather based on terrain type
        this._updateWeather(tilePos);

        // Check village proximity
        this._checkVillageProximity(tilePos);
      }

      // E key: building placement takes priority over village entry
      if (!this.enteringVillage) {
        const eDown = this.eKey.isDown;
        if (eDown && !this.eKeyJustPressed) {
          this.eKeyJustPressed = true;
          if (this.buildingSystem.isPlacing) {
            const placed = this.buildingSystem.confirmPlacement();
            if (placed) {
              this.events.emit('buildingPlaced');
            }
          } else if (this.nearVillage) {
            this._enterVillage(this.nearVillage);
          }
        } else if (!eDown) {
          this.eKeyJustPressed = false;
        }
      }
    }
  }

  _updateWeather(tilePos) {
    const tx = tilePos.x;
    const ty = tilePos.y;
    if (tx < 0 || tx >= this.mapData.terrain[0].length ||
        ty < 0 || ty >= this.mapData.terrain.length) return;

    const terrainType = this.mapData.terrain[ty][tx];

    // Only update when terrain type changes
    if (terrainType === this.lastWeatherTerrain) return;
    this.lastWeatherTerrain = terrainType;

    if (terrainType === TERRAIN.SNOW) {
      this.particleManager.createWeatherSystem('snow');
    } else if (terrainType === TERRAIN.MOUNTAINS) {
      // 40% chance of rain in mountains
      if (Math.random() < 0.4) {
        this.particleManager.createWeatherSystem('rain');
      } else {
        this.particleManager.createWeatherSystem('none');
      }
    } else if (terrainType === TERRAIN.FOREST || terrainType === TERRAIN.PLAINS) {
      // 15% chance of rain
      if (Math.random() < 0.15) {
        this.particleManager.createWeatherSystem('rain');
      } else {
        this.particleManager.createWeatherSystem('none');
      }
    } else {
      this.particleManager.createWeatherSystem('none');
    }

    // Ambient particle effects based on terrain
    this.particleManager.startAmbientEffects(terrainType);
  }

  _checkVillageProximity(tilePos) {
    let found = null;
    for (const v of this.mapData.villages) {
      const dx = v.x - tilePos.x;
      const dy = v.y - tilePos.y;
      if (Math.sqrt(dx * dx + dy * dy) < 1.5) {
        found = v;
        break;
      }
    }

    if (found && !this.nearVillage) {
      this.nearVillage = found;
      this.events.emit('nearVillage', found);
    } else if (!found && this.nearVillage) {
      this.nearVillage = null;
      this.events.emit('leftVillage');
    }
  }

  _enterVillage(village) {
    this.enteringVillage = true;
    this.player.stop();

    this.cameras.main.fadeOut(400, 44, 24, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Sleep GameScene (preserves state), keep HUD awake for health/currency
      this.scene.sleep('GameScene');

      // Launch VillageScene
      this.scene.launch('VillageScene', {
        village,
        player: this.player,
        gameScene: this,
        villageName: village.name,
      });

      this.enteringVillage = false;
      this.nearVillage = null;
    });
  }
}
