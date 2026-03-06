import { CHARACTER_CLASSES } from './CharacterClasses.js';

export default class RemotePlayer {
  constructor(scene, playerId, displayName, selectedClass, x, y) {
    this.scene = scene;
    this.playerId = playerId;
    this.displayName = displayName;
    this.classData = CHARACTER_CLASSES[selectedClass] || CHARACTER_CLASSES.Knight;

    // Create sprite (no physics body for remote players)
    this.sprite = scene.add.sprite(x, y, 'player_idle_down_0');
    this.sprite.setTint(this.classData.color);
    this.sprite.setDepth(10);

    // Name label
    this.nameLabel = scene.add.text(x, y - 20, displayName, {
      fontSize: '10px',
      fontFamily: 'Georgia, serif',
      color: '#f4e4c1',
      stroke: '#2c1810',
      strokeThickness: 2
    });
    this.nameLabel.setOrigin(0.5).setDepth(11);

    // Interpolation state
    this.targetX = x;
    this.targetY = y;
    this.currentX = x;
    this.currentY = y;
    this.facing = 'down';
    this.currentAnim = '';
  }

  setTargetPosition(x, y, facing, animation) {
    this.targetX = x;
    this.targetY = y;
    this.facing = facing || this.facing;
  }

  update(dt) {
    const lerpSpeed = 0.15;
    this.currentX += (this.targetX - this.currentX) * lerpSpeed;
    this.currentY += (this.targetY - this.currentY) * lerpSpeed;

    this.sprite.setPosition(this.currentX, this.currentY);
    this.nameLabel.setPosition(this.currentX, this.currentY - 20);

    // Play appropriate animation
    const isMoving = Math.abs(this.targetX - this.currentX) > 0.5 ||
                     Math.abs(this.targetY - this.currentY) > 0.5;
    const animKey = isMoving ? `player_walk_${this.facing}` : `player_idle_${this.facing}`;
    if (this.currentAnim !== animKey) {
      this.currentAnim = animKey;
      if (this.sprite.scene) {
        this.sprite.play(animKey, true);
      }
    }
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.nameLabel) this.nameLabel.destroy();
  }
}
