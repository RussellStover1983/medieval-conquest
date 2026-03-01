import Phaser from 'phaser';
import VillageNPC from '../entities/VillageNPC.js';
import ShopPanel from '../ui/ShopPanel.js';

const V_TILE = 32;
const V_WIDTH = 20;
const V_HEIGHT = 15;
const V_WORLD_W = V_WIDTH * V_TILE;
const V_WORLD_H = V_HEIGHT * V_TILE;

export default class VillageScene extends Phaser.Scene {
  constructor() {
    super('VillageScene');
  }

  init(data) {
    this.village = data.village;
    this.playerData = data.player;
    this.gameScene = data.gameScene;
    this.villageName = data.villageName;
  }

  create() {
    // Physics bounds for village interior
    this.physics.world.setBounds(0, 0, V_WORLD_W, V_WORLD_H);

    // Draw floor tiles
    this._drawFloor();

    // Place wall border along top and sides
    this._drawWalls();

    // Place buildings
    this.buildings = [];
    this._placeBuilding('detail_inn', 100, 120, 'Inn');
    this._placeBuilding('detail_shop', V_WORLD_W / 2, 120, 'Shop');
    this._placeBuilding('detail_blacksmith', V_WORLD_W - 100, 120, 'Blacksmith');

    // Place gate at bottom center
    this.gate = this.add.sprite(V_WORLD_W / 2, V_WORLD_H - 30, 'detail_gate');
    this.gate.setDepth(5);
    const gateLabel = this.add.text(V_WORLD_W / 2, V_WORLD_H - 60, 'Exit', {
      fontSize: '10px',
      fontFamily: 'Georgia, serif',
      color: '#f4e4c1',
      stroke: '#2c1810',
      strokeThickness: 2,
    });
    gateLabel.setOrigin(0.5);
    gateLabel.setDepth(11);

    // Place NPCs near buildings
    this.npcs = [
      new VillageNPC(this, 100, 190, 'innkeeper'),
      new VillageNPC(this, V_WORLD_W / 2, 190, 'shopkeeper'),
      new VillageNPC(this, V_WORLD_W - 100, 190, 'blacksmith'),
    ];

    // Create player sprite in village
    const startX = V_WORLD_W / 2;
    const startY = V_WORLD_H - 100;
    this.playerSprite = this.add.sprite(startX, startY, 'player_idle_down_0');
    this.playerSprite.setTint(this.playerData.classData.color);
    this.playerSprite.setDepth(10);
    this.physics.add.existing(this.playerSprite);
    this.playerSprite.body.setSize(16, 16);
    this.playerSprite.body.setOffset(4, 4);
    this.playerSprite.body.setCollideWorldBounds(true);

    // Camera
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, V_WORLD_W, V_WORLD_H);
    this.cameras.main.setZoom(2);

    // Input
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.eKeyJustPressed = false;
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKeyJustPressed = false;

    // Shop panel
    this.shopPanel = new ShopPanel(this, this.playerData);

    // Dialog UI
    this.dialogBg = this.add.rectangle(V_WORLD_W / 2, V_WORLD_H - 40, 280, 60, 0x2c1810, 0.9);
    this.dialogBg.setScrollFactor(0);
    this.dialogBg.setDepth(200);
    this.dialogBg.setVisible(false);

    this.dialogText = this.add.text(V_WORLD_W / 2, V_WORLD_H - 40, '', {
      fontSize: '11px',
      fontFamily: 'Georgia, serif',
      color: '#f4e4c1',
      wordWrap: { width: 260 },
      align: 'center',
    });
    this.dialogText.setOrigin(0.5);
    this.dialogText.setScrollFactor(0);
    this.dialogText.setDepth(201);
    this.dialogText.setVisible(false);

    // Interaction prompt
    this.promptText = this.add.text(V_WORLD_W / 2, V_WORLD_H - 80, 'Press E', {
      fontSize: '10px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      stroke: '#2c1810',
      strokeThickness: 2,
    });
    this.promptText.setOrigin(0.5);
    this.promptText.setScrollFactor(0);
    this.promptText.setDepth(150);
    this.promptText.setVisible(false);

    // State
    this.dialogTimer = 0;
    this.playerFacing = 'down';
    this.currentAnim = '';

    // Notify HUD we entered village
    this.scene.get('HUDScene').events.emit('enterVillage', this.villageName);

    // Fade in
    this.cameras.main.fadeIn(400, 44, 24, 16);
  }

  _drawFloor() {
    for (let y = 0; y < V_HEIGHT; y++) {
      for (let x = 0; x < V_WIDTH; x++) {
        const tile = this.add.sprite(x * V_TILE + V_TILE / 2, y * V_TILE + V_TILE / 2, 'village_floor');
        tile.setDepth(0);
      }
    }
  }

  _drawWalls() {
    // Top wall
    for (let x = 0; x < V_WIDTH; x++) {
      const wall = this.add.sprite(x * V_TILE + V_TILE / 2, V_TILE / 2, 'village_wall');
      wall.setDepth(1);
    }
    // Left wall
    for (let y = 0; y < V_HEIGHT; y++) {
      const wall = this.add.sprite(V_TILE / 2, y * V_TILE + V_TILE / 2, 'village_wall');
      wall.setDepth(1);
    }
    // Right wall
    for (let y = 0; y < V_HEIGHT; y++) {
      const wall = this.add.sprite(V_WORLD_W - V_TILE / 2, y * V_TILE + V_TILE / 2, 'village_wall');
      wall.setDepth(1);
    }
  }

  _placeBuilding(texture, x, y, label) {
    const bldg = this.add.sprite(x, y, texture);
    bldg.setDepth(5);
    this.buildings.push(bldg);

    const text = this.add.text(x, y - 32, label, {
      fontSize: '10px',
      fontFamily: 'Georgia, serif',
      color: '#f4e4c1',
      stroke: '#2c1810',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    text.setDepth(11);
  }

  update() {
    // Escape key: close shop panel
    const escDown = this.escKey.isDown;
    if (escDown && !this.escKeyJustPressed) {
      this.escKeyJustPressed = true;
      if (this.shopPanel.isOpen) {
        this.shopPanel.close();
      }
    } else if (!escDown) {
      this.escKeyJustPressed = false;
    }

    // Skip movement when shop is open
    if (this.shopPanel.isOpen) return;

    const speed = 120;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown) vx = -1;
    else if (this.cursors.right.isDown) vx = 1;
    if (this.cursors.up.isDown) vy = -1;
    else if (this.cursors.down.isDown) vy = 1;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
    } else {
      vx *= speed;
      vy *= speed;
    }

    this.playerSprite.body.setVelocity(vx, vy);

    // Update facing
    if (Math.abs(vx) > Math.abs(vy)) {
      this.playerFacing = vx > 0 ? 'right' : 'left';
    } else if (vy !== 0) {
      this.playerFacing = vy > 0 ? 'down' : 'up';
    }

    // Animation
    const moving = vx !== 0 || vy !== 0;
    const animKey = moving ? `player_walk_${this.playerFacing}` : `player_idle_${this.playerFacing}`;
    if (this.currentAnim !== animKey) {
      this.currentAnim = animKey;
      this.playerSprite.play(animKey, true);
    }

    // Dialog auto-hide
    if (this.dialogTimer > 0) {
      this.dialogTimer -= this.game.loop.delta;
      if (this.dialogTimer <= 0) {
        this.dialogBg.setVisible(false);
        this.dialogText.setVisible(false);
      }
    }

    // E key handling (just-pressed logic)
    const eDown = this.eKey.isDown;
    if (eDown && !this.eKeyJustPressed) {
      this.eKeyJustPressed = true;
      this._handleInteraction();
    } else if (!eDown) {
      this.eKeyJustPressed = false;
    }

    // Proximity prompts
    this._updatePrompts();
  }

  _handleInteraction() {
    const px = this.playerSprite.x;
    const py = this.playerSprite.y;

    // Check gate proximity
    const gateDx = this.gate.x - px;
    const gateDy = this.gate.y - py;
    if (Math.sqrt(gateDx * gateDx + gateDy * gateDy) < 50) {
      this._exitVillage();
      return;
    }

    // Check NPCs
    for (const npc of this.npcs) {
      if (npc.isNear(px, py, 50)) {
        const result = npc.interact(this.playerData);

        // Blacksmith returns an action object
        if (result && typeof result === 'object' && result.action === 'openShop') {
          this.shopPanel.open();
          return;
        }

        const dialog = npc.getDialog();
        this._showDialog(dialog.join('\n') + '\n' + result);
        return;
      }
    }
  }

  _updatePrompts() {
    const px = this.playerSprite.x;
    const py = this.playerSprite.y;

    // Check if near any interactable
    let nearSomething = false;

    const gateDx = this.gate.x - px;
    const gateDy = this.gate.y - py;
    if (Math.sqrt(gateDx * gateDx + gateDy * gateDy) < 50) {
      nearSomething = true;
      this.promptText.setText('Press E to Exit');
    }

    if (!nearSomething) {
      for (const npc of this.npcs) {
        if (npc.isNear(px, py, 50)) {
          nearSomething = true;
          if (npc.type === 'blacksmith') {
            this.promptText.setText('Press E to Open Shop');
          } else {
            this.promptText.setText('Press E to Talk');
          }
          break;
        }
      }
    }

    this.promptText.setVisible(nearSomething);
  }

  _showDialog(text) {
    this.dialogBg.setVisible(true);
    this.dialogText.setVisible(true);
    this.dialogText.setText(text);
    this.dialogTimer = 3000;
  }

  _exitVillage() {
    // Destroy shop panel before leaving
    this.shopPanel.destroy();

    this.cameras.main.fadeOut(400, 44, 24, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Notify HUD
      this.scene.get('HUDScene').events.emit('exitVillage');

      // Clean up NPCs
      for (const npc of this.npcs) {
        npc.destroy();
      }

      // Wake GameScene
      this.scene.wake('GameScene');

      // Destroy this scene
      this.scene.stop('VillageScene');
    });
  }
}
