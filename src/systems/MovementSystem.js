export default class MovementSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // Use the global keyboard plugin for reliable input across scenes
    this.keys = scene.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      arrowUp: 'UP',
      arrowDown: 'DOWN',
      arrowLeft: 'LEFT',
      arrowRight: 'RIGHT',
    });

    // Virtual joystick input
    this.joystickVector = { x: 0, y: 0 };
  }

  setJoystickInput(x, y) {
    this.joystickVector.x = x;
    this.joystickVector.y = y;
  }

  update(terrain) {
    let vx = 0;
    let vy = 0;

    // Keyboard input
    if (this.keys.left.isDown || this.keys.arrowLeft.isDown) vx = -1;
    else if (this.keys.right.isDown || this.keys.arrowRight.isDown) vx = 1;

    if (this.keys.up.isDown || this.keys.arrowUp.isDown) vy = -1;
    else if (this.keys.down.isDown || this.keys.arrowDown.isDown) vy = 1;

    // Virtual joystick overrides if active
    if (Math.abs(this.joystickVector.x) > 0.1 || Math.abs(this.joystickVector.y) > 0.1) {
      vx = this.joystickVector.x;
      vy = this.joystickVector.y;
    }

    if (vx !== 0 || vy !== 0) {
      this.player.move(vx, vy, terrain);
    } else {
      this.player.stop();
    }
  }
}
