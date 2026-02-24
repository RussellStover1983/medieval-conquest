import Phaser from 'phaser';

/**
 * Procedurally generates all pixel-art textures at boot time using Phaser Graphics.
 * No external image assets needed.
 */
export default class SpriteFactory {
  static generateAll(scene) {
    SpriteFactory.generatePlayerTextures(scene);
    SpriteFactory.generateEnemyTextures(scene);
    SpriteFactory.generateResourceTextures(scene);
    SpriteFactory.generateTerrainTextures(scene);
    SpriteFactory.generateParticleTextures(scene);
    SpriteFactory.generateVillageTextures(scene);
  }

  // ── Terrain tile textures (32x32 with noise variation) ─────────────────

  // ── Player textures ──────────────────────────────────────────────────────
  // 4 directions × (4 walk + 1 attack + 2 idle) = 28 textures
  // Rendered as white silhouettes so they can be tinted per class color

  static generatePlayerTextures(scene) {
    const SIZE = 24;
    const dirs = ['down', 'up', 'left', 'right'];

    for (const dir of dirs) {
      // 4 walk frames
      for (let f = 0; f < 4; f++) {
        const key = `player_walk_${dir}_${f}`;
        const g = scene.add.graphics();
        SpriteFactory._drawPlayerFrame(g, SIZE, dir, 'walk', f);
        g.generateTexture(key, SIZE, SIZE);
        g.destroy();
      }
      // 2 idle frames
      for (let f = 0; f < 2; f++) {
        const key = `player_idle_${dir}_${f}`;
        const g = scene.add.graphics();
        SpriteFactory._drawPlayerFrame(g, SIZE, dir, 'idle', f);
        g.generateTexture(key, SIZE, SIZE);
        g.destroy();
      }
      // 1 attack frame
      {
        const key = `player_attack_${dir}_0`;
        const g = scene.add.graphics();
        SpriteFactory._drawPlayerFrame(g, SIZE, dir, 'attack', 0);
        g.generateTexture(key, SIZE, SIZE);
        g.destroy();
      }
    }
  }

  static _drawPlayerFrame(g, size, dir, anim, frame) {
    const cx = size / 2;
    const cy = size / 2;

    // Shadow outline (+1,+1 dark)
    g.fillStyle(0x444444, 0.4);
    g.fillRect(cx - 3, cy - 3, 8, 10);
    g.fillRect(cx - 2, cy - 7, 6, 5);

    // Body base (torso) — lighter gray
    g.fillStyle(0xdddddd, 1);
    g.fillRect(cx - 4, cy - 4, 8, 10);

    // Torso bottom shading (darker 3px band)
    g.fillStyle(0xaaaaaa, 0.5);
    g.fillRect(cx - 4, cy + 3, 8, 3);

    // Head
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 3, cy - 8, 6, 5);

    // Head highlight (1px white top-left)
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(cx - 3, cy - 8, 1, 1);

    // Eyes based on facing direction
    g.fillStyle(0x333333, 1);
    if (dir === 'down') {
      g.fillRect(cx - 2, cy - 6, 1, 1);
      g.fillRect(cx + 1, cy - 6, 1, 1);
    } else if (dir === 'up') {
      // No eyes visible from behind
    } else if (dir === 'left') {
      g.fillRect(cx - 3, cy - 6, 1, 1);
    } else {
      g.fillRect(cx + 2, cy - 6, 1, 1);
    }

    // Legs — animate walk frames
    g.fillStyle(0xbbbbbb, 1);
    if (anim === 'walk') {
      const legOffset = [0, 2, 0, -2][frame];
      g.fillRect(cx - 3, cy + 6, 2, 4 + legOffset);
      g.fillRect(cx + 1, cy + 6, 2, 4 - legOffset);
    } else if (anim === 'idle') {
      const breathOffset = frame === 0 ? 0 : 1;
      g.fillRect(cx - 3, cy + 6, 2, 4);
      g.fillRect(cx + 1, cy + 6, 2, 4);
      // Subtle shoulder raise on idle frame 1
      if (breathOffset) {
        g.fillStyle(0xdddddd, 1);
        g.fillRect(cx - 5, cy - 3, 2, 1);
        g.fillRect(cx + 3, cy - 3, 2, 1);
      }
    } else {
      // attack
      g.fillRect(cx - 3, cy + 6, 2, 4);
      g.fillRect(cx + 1, cy + 6, 2, 4);
    }

    // Arms
    g.fillStyle(0xcccccc, 1);
    if (anim === 'attack') {
      // Extended arm in facing direction
      if (dir === 'right') {
        g.fillRect(cx + 4, cy - 3, 7, 2);
        // Weapon tip with glow
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx + 10, cy - 4, 2, 4);
        g.fillStyle(0xffffcc, 0.5);
        g.fillRect(cx + 9, cy - 5, 4, 6);
      } else if (dir === 'left') {
        g.fillRect(cx - 11, cy - 3, 7, 2);
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx - 12, cy - 4, 2, 4);
        g.fillStyle(0xffffcc, 0.5);
        g.fillRect(cx - 13, cy - 5, 4, 6);
      } else if (dir === 'up') {
        g.fillRect(cx + 3, cy - 8, 2, 6);
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx + 2, cy - 10, 4, 2);
        g.fillStyle(0xffffcc, 0.5);
        g.fillRect(cx + 1, cy - 11, 6, 4);
      } else {
        g.fillRect(cx + 3, cy - 2, 2, 6);
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx + 2, cy + 4, 4, 2);
        g.fillStyle(0xffffcc, 0.5);
        g.fillRect(cx + 1, cy + 3, 6, 4);
      }
    } else {
      // Resting arms at sides
      const armSwing = anim === 'walk' ? [1, -1, -1, 1][frame] : 0;
      g.fillRect(cx - 6, cy - 3 + armSwing, 2, 6);
      g.fillRect(cx + 4, cy - 3 - armSwing, 2, 6);
    }
  }

  // ── Enemy textures ────────────────────────────────────────────────────────
  // Each enemy type: 2 idle frames + 2 chase frames

  static generateEnemyTextures(scene) {
    const types = {
      Wolf:       { size: 18, draw: SpriteFactory._drawWolf },
      Bandit:     { size: 22, draw: SpriteFactory._drawBandit },
      Troll:      { size: 28, draw: SpriteFactory._drawTroll },
      SeaSerpent: { size: 20, draw: SpriteFactory._drawSerpent },
      Skeleton:   { size: 20, draw: SpriteFactory._drawSkeleton },
    };

    for (const [name, info] of Object.entries(types)) {
      for (const state of ['idle', 'chase']) {
        for (let f = 0; f < 2; f++) {
          const key = `enemy_${name}_${state}_${f}`;
          const g = scene.add.graphics();
          info.draw(g, info.size, state, f);
          g.generateTexture(key, info.size, info.size);
          g.destroy();
        }
      }
    }
  }

  static _drawWolf(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;

    // Shadow outline
    g.fillStyle(0x333333, 0.3);
    g.fillRect(cx - 5, cy - 2, 12, 6);

    // 4-legged body
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 6, cy - 3, 12, 6); // body
    g.fillRect(cx + 5, cy - 5, 4, 3);  // head

    // Belly highlight
    g.fillStyle(0xdddddd, 0.6);
    g.fillRect(cx - 4, cy + 1, 8, 2);

    // Ears
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx + 6, cy - 7, 2, 2);
    g.fillRect(cx + 8, cy - 7, 2, 2);

    // Legs
    const legAnim = state === 'chase' ? (frame === 0 ? 2 : -1) : 0;
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(cx - 5, cy + 3, 2, 3 + legAnim);
    g.fillRect(cx - 2, cy + 3, 2, 3 - legAnim);
    g.fillRect(cx + 2, cy + 3, 2, 3 + legAnim);
    g.fillRect(cx + 5, cy + 3, 2, 3 - legAnim);

    // Tail
    g.fillStyle(0xbbbbbb, 1);
    g.fillRect(cx - 8, cy - 4 + (frame === 1 ? -1 : 0), 3, 2);

    // Eye - brighter gleam
    g.fillStyle(0xff4444, 1);
    g.fillRect(cx + 7, cy - 4, 1, 1);
    g.fillStyle(0xff8888, 0.7);
    g.fillRect(cx + 8, cy - 5, 1, 1);
  }

  static _drawBandit(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;

    // Shadow outline
    g.fillStyle(0x333333, 0.3);
    g.fillRect(cx - 3, cy - 3, 8, 10);

    // Humanoid with weapon
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 4, cy - 4, 8, 10); // torso

    // Belt detail
    g.fillStyle(0x666666, 0.8);
    g.fillRect(cx - 4, cy + 2, 8, 1);

    g.fillStyle(0xdddddd, 1);
    g.fillRect(cx - 3, cy - 8, 6, 5); // head

    // Hood/bandana
    g.fillStyle(0x888888, 1);
    g.fillRect(cx - 3, cy - 8, 6, 2);

    // Shadow under hood
    g.fillStyle(0x555555, 0.5);
    g.fillRect(cx - 3, cy - 6, 6, 1);

    // Legs
    g.fillStyle(0xaaaaaa, 1);
    const legOff = state === 'chase' ? (frame === 0 ? 2 : -1) : 0;
    g.fillRect(cx - 3, cy + 6, 2, 4 + legOff);
    g.fillRect(cx + 1, cy + 6, 2, 4 - legOff);

    // Weapon (sword on right) with metallic highlights
    g.fillStyle(0xdddddd, 1);
    const weapSwing = state === 'chase' && frame === 1 ? -3 : 0;
    g.fillRect(cx + 5, cy - 4 + weapSwing, 2, 8);
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx + 5, cy - 6 + weapSwing, 2, 2);
    // Metallic highlight on blade
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(cx + 5, cy - 3 + weapSwing, 1, 6);

    // Eye
    g.fillStyle(0x333333, 1);
    g.fillRect(cx - 1, cy - 6, 1, 1);
    g.fillRect(cx + 2, cy - 6, 1, 1);
  }

  static _drawTroll(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;

    // Shadow outline
    g.fillStyle(0x333333, 0.3);
    g.fillRect(cx - 7, cy - 4, 16, 12);

    // Bulky body
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 8, cy - 5, 16, 12); // wide torso

    // Shoulder shadow
    g.fillStyle(0x999999, 0.4);
    g.fillRect(cx - 8, cy - 5, 16, 2);

    // Loincloth
    g.fillStyle(0x886644, 0.7);
    g.fillRect(cx - 4, cy + 5, 8, 3);

    // Head (small relative to body)
    g.fillStyle(0xdddddd, 1);
    g.fillRect(cx - 3, cy - 10, 6, 6);

    // Brow ridge
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(cx - 4, cy - 10, 8, 2);

    // Arms (thick)
    g.fillStyle(0xbbbbbb, 1);
    const armOff = state === 'chase' && frame === 1 ? -2 : 0;
    g.fillRect(cx - 12, cy - 3 + armOff, 4, 8);
    g.fillRect(cx + 8, cy - 3 - armOff, 4, 8);

    // Knuckle highlights
    g.fillStyle(0xdddddd, 0.5);
    g.fillRect(cx - 12, cy + 4 + armOff, 4, 1);
    g.fillRect(cx + 8, cy + 4 - armOff, 4, 1);

    // Legs
    g.fillStyle(0xaaaaaa, 1);
    const legOff = state === 'chase' ? (frame === 0 ? 2 : -1) : 0;
    g.fillRect(cx - 5, cy + 7, 4, 5 + legOff);
    g.fillRect(cx + 1, cy + 7, 4, 5 - legOff);

    // Eyes
    g.fillStyle(0xff6600, 1);
    g.fillRect(cx - 2, cy - 8, 1, 1);
    g.fillRect(cx + 1, cy - 8, 1, 1);
  }

  static _drawSerpent(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;
    // Wavy body with alternating scale colors
    const wave = frame === 0 ? 0 : 2;

    // Shadow
    g.fillStyle(0x333333, 0.2);
    g.fillRect(cx - 1, cy - 5 + wave, 4, 4);

    // Segments forming an S-curve with alternating colors
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 2, cy - 6 + wave, 4, 4);
    g.fillStyle(0xbbbbbb, 1);
    g.fillRect(cx + 1, cy - 3 + wave, 4, 4);
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 2, cy + 0 + wave, 4, 4);
    g.fillStyle(0xbbbbbb, 1);
    g.fillRect(cx - 5, cy + 3, 4, 4);
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 2, cy + 6 - wave, 4, 3);

    // Underbelly lighter
    g.fillStyle(0xdddddd, 0.4);
    g.fillRect(cx - 1, cy - 5 + wave, 2, 3);
    g.fillRect(cx + 2, cy - 2 + wave, 2, 3);

    // Head
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 3, cy - 9, 6, 4);

    // Fangs with highlights
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 2, cy - 5, 1, 2);
    g.fillRect(cx + 1, cy - 5, 1, 2);
    g.fillStyle(0xffffdd, 0.6);
    g.fillRect(cx - 2, cy - 5, 1, 1);
    g.fillRect(cx + 1, cy - 5, 1, 1);

    // Eyes
    g.fillStyle(0x33ff33, 1);
    g.fillRect(cx - 2, cy - 8, 1, 1);
    g.fillRect(cx + 1, cy - 8, 1, 1);
  }

  static _drawSkeleton(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;
    // Bony humanoid
    g.fillStyle(0xeeeeee, 1);
    // Skull
    g.fillRect(cx - 3, cy - 8, 6, 5);

    // Eye sockets
    g.fillStyle(0x333333, 1);
    g.fillRect(cx - 2, cy - 7, 2, 2);
    g.fillRect(cx + 1, cy - 7, 2, 2);

    // Jaw with gap
    g.fillStyle(0xdddddd, 1);
    g.fillRect(cx - 2, cy - 3, 4, 1);
    g.fillStyle(0x333333, 1);
    g.fillRect(cx, cy - 3, 1, 1); // jaw gap

    // Ribcage with shadows
    g.fillStyle(0xdddddd, 1);
    g.fillRect(cx - 1, cy - 2, 2, 8); // spine
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 4, cy - 1, 8, 1); // ribs
    g.fillRect(cx - 3, cy + 1, 6, 1);
    g.fillRect(cx - 4, cy + 3, 8, 1);

    // Rib shadows
    g.fillStyle(0x999999, 0.3);
    g.fillRect(cx - 4, cy, 8, 1);
    g.fillRect(cx - 3, cy + 2, 6, 1);

    // Bone highlights on ribs
    g.fillStyle(0xffffff, 0.4);
    g.fillRect(cx - 3, cy - 1, 2, 1);
    g.fillRect(cx - 2, cy + 1, 2, 1);
    g.fillRect(cx - 3, cy + 3, 2, 1);

    // Arms (bone sticks)
    g.fillStyle(0xdddddd, 1);
    const armOff = state === 'chase' ? (frame === 0 ? -2 : 2) : 0;
    g.fillRect(cx - 6, cy - 1 + armOff, 2, 6);
    g.fillRect(cx + 4, cy - 1 - armOff, 2, 6);

    // Legs
    g.fillStyle(0xcccccc, 1);
    const legOff = state === 'chase' ? (frame === 0 ? 2 : -1) : 0;
    g.fillRect(cx - 3, cy + 6, 2, 4 + legOff);
    g.fillRect(cx + 1, cy + 6, 2, 4 - legOff);
  }

  // ── Resource textures ─────────────────────────────────────────────────────

  static generateResourceTextures(scene) {
    const resources = {
      gold:    { color: 0xffd700, highlight: 0xffee88 },
      silver:  { color: 0xc0c0c0, highlight: 0xe8e8e8 },
      emerald: { color: 0x50c878, highlight: 0x88eea8 },
      ruby:    { color: 0xe0115f, highlight: 0xff6688 },
    };

    for (const [name, info] of Object.entries(resources)) {
      const key = `resource_${name}`;
      const g = scene.add.graphics();
      const s = 12; // texture size
      const cx = s / 2, cy = s / 2;

      // Diamond shape
      g.fillStyle(info.color, 1);
      // Center diamond using triangles approximated with rects
      g.fillRect(cx - 1, cy - 4, 2, 8);  // vertical spine
      g.fillRect(cx - 2, cy - 3, 4, 6);  // wider middle
      g.fillRect(cx - 3, cy - 2, 6, 4);  // widest
      g.fillRect(cx - 4, cy - 1, 8, 2);  // widest center

      // Highlight facet (top-left quadrant)
      g.fillStyle(info.highlight, 0.7);
      g.fillRect(cx - 2, cy - 3, 2, 2);
      g.fillRect(cx - 1, cy - 4, 1, 1);

      g.generateTexture(key, s, s);
      g.destroy();
    }
  }

  // ── Terrain detail textures ───────────────────────────────────────────────

  static generateTerrainTextures(scene) {
    // Tree (with trunk shadow + canopy highlight)
    {
      const g = scene.add.graphics();
      const s = 16;
      // Trunk shadow
      g.fillStyle(0x4a2a10, 0.4);
      g.fillRect(7, 11, 4, 6);
      // Trunk
      g.fillStyle(0x6b4226, 1);
      g.fillRect(6, 10, 4, 6);
      // Canopy layers
      g.fillStyle(0x2d5a1e, 1);
      g.fillRect(3, 4, 10, 4);
      g.fillRect(4, 2, 8, 3);
      g.fillRect(5, 0, 6, 3);
      g.fillStyle(0x3a6b28, 1);
      g.fillRect(4, 5, 4, 2);
      g.fillRect(6, 3, 3, 2);
      // Canopy highlight
      g.fillStyle(0x5a8b48, 0.5);
      g.fillRect(5, 1, 3, 2);
      g.fillRect(4, 3, 2, 1);
      g.generateTexture('detail_tree', s, s);
      g.destroy();
    }

    // Pine tree (conifer/triangular, 2 green shades)
    {
      const g = scene.add.graphics();
      const s = 16;
      // Trunk
      g.fillStyle(0x6b4226, 1);
      g.fillRect(6, 12, 4, 4);
      // Triangular canopy layers
      g.fillStyle(0x1e4a16, 1);
      g.fillRect(4, 8, 8, 4);
      g.fillRect(5, 5, 6, 4);
      g.fillRect(6, 2, 4, 4);
      g.fillRect(7, 0, 2, 3);
      // Lighter highlight on left
      g.fillStyle(0x2d6b22, 0.7);
      g.fillRect(5, 6, 2, 3);
      g.fillRect(6, 3, 2, 3);
      g.fillRect(7, 1, 1, 2);
      g.generateTexture('detail_tree_pine', s, s);
      g.destroy();
    }

    // Bush (12x12 low rounded canopy)
    {
      const g = scene.add.graphics();
      const s = 12;
      g.fillStyle(0x3a6b28, 1);
      g.fillRect(2, 4, 8, 5);
      g.fillRect(3, 3, 6, 1);
      g.fillRect(3, 9, 6, 1);
      g.fillStyle(0x4a7b38, 0.6);
      g.fillRect(3, 4, 3, 2);
      // Small stem
      g.fillStyle(0x5a3a1e, 1);
      g.fillRect(5, 10, 2, 2);
      g.generateTexture('detail_bush', s, s);
      g.destroy();
    }

    // Grass (8x8 - 3 grass blades)
    {
      const g = scene.add.graphics();
      const s = 8;
      g.fillStyle(0x5a8b3a, 1);
      g.fillRect(1, 3, 1, 5); // left blade
      g.fillRect(3, 2, 1, 6); // center blade
      g.fillRect(5, 4, 1, 4); // right blade
      // Lighter tips
      g.fillStyle(0x7aab5a, 1);
      g.fillRect(1, 3, 1, 1);
      g.fillRect(3, 2, 1, 1);
      g.fillRect(5, 4, 1, 1);
      g.generateTexture('detail_grass', s, s);
      g.destroy();
    }

    // Rock small (10x10)
    {
      const g = scene.add.graphics();
      const s = 10;
      g.fillStyle(0x7a7068, 1);
      g.fillRect(2, 4, 6, 4);
      g.fillRect(3, 3, 4, 1);
      g.fillRect(3, 8, 4, 1);
      // Highlight
      g.fillStyle(0x9a9088, 0.6);
      g.fillRect(3, 4, 2, 2);
      // Shadow
      g.fillStyle(0x5a5048, 0.5);
      g.fillRect(6, 5, 2, 3);
      g.generateTexture('detail_rock', s, s);
      g.destroy();
    }

    // Rock large (14x14)
    {
      const g = scene.add.graphics();
      const s = 14;
      g.fillStyle(0x7a7068, 1);
      g.fillRect(2, 5, 10, 6);
      g.fillRect(3, 3, 8, 2);
      g.fillRect(3, 11, 8, 1);
      // Highlight
      g.fillStyle(0x9a9088, 0.5);
      g.fillRect(3, 4, 3, 3);
      // Shadow on right
      g.fillStyle(0x5a5048, 0.5);
      g.fillRect(9, 6, 3, 4);
      // Moss patch
      g.fillStyle(0x4a6b38, 0.6);
      g.fillRect(4, 8, 3, 2);
      g.generateTexture('detail_rock_large', s, s);
      g.destroy();
    }

    // Flowers (6x6 - red, yellow, purple)
    const flowerColors = [0xcc3333, 0xddaa22, 0x8844aa];
    for (let i = 0; i < 3; i++) {
      const g = scene.add.graphics();
      const s = 6;
      // Stem
      g.fillStyle(0x3a6b28, 1);
      g.fillRect(2, 3, 1, 3);
      // Petals
      g.fillStyle(flowerColors[i], 1);
      g.fillRect(1, 1, 3, 3);
      // Center
      g.fillStyle(0xffdd44, 1);
      g.fillRect(2, 2, 1, 1);
      g.generateTexture(`detail_flower_${i}`, s, s);
      g.destroy();
    }

    // Cattail (8x12 water-edge vegetation)
    {
      const g = scene.add.graphics();
      const w = 8, h = 12;
      // Stem
      g.fillStyle(0x4a7a38, 1);
      g.fillRect(3, 3, 1, 9);
      // Cattail head
      g.fillStyle(0x6b4226, 1);
      g.fillRect(2, 1, 3, 4);
      // Leaf
      g.fillStyle(0x5a8a48, 0.8);
      g.fillRect(4, 5, 2, 1);
      g.fillRect(5, 6, 2, 1);
      g.generateTexture('detail_cattail', w, h);
      g.destroy();
    }

    // Mountain peak (with right-face shadow + rock striations)
    {
      const g = scene.add.graphics();
      const s = 16;
      // Mountain body
      g.fillStyle(0x6b6157, 1);
      g.fillRect(2, 10, 12, 6);
      g.fillRect(3, 7, 10, 3);
      g.fillRect(4, 5, 8, 2);
      g.fillRect(5, 3, 6, 2);
      g.fillRect(6, 1, 4, 2);
      g.fillRect(7, 0, 2, 1);
      // Right-face shadow
      g.fillStyle(0x4a4a40, 0.4);
      g.fillRect(9, 7, 4, 9);
      g.fillRect(8, 5, 4, 2);
      // Rock striations
      g.fillStyle(0x5b5147, 0.5);
      g.fillRect(4, 9, 6, 1);
      g.fillRect(5, 12, 5, 1);
      // Snow cap
      g.fillStyle(0xe8e0d0, 1);
      g.fillRect(6, 1, 4, 2);
      g.fillRect(7, 0, 2, 1);
      g.generateTexture('detail_mountain', s, s);
      g.destroy();
    }

    // House (with chimney + window glow + shadow under eaves)
    {
      const g = scene.add.graphics();
      const s = 16;
      // Walls
      g.fillStyle(0x8b5e3c, 1);
      g.fillRect(3, 7, 10, 8);
      // Shadow under eaves
      g.fillStyle(0x5a3a20, 0.4);
      g.fillRect(3, 7, 10, 1);
      // Roof
      g.fillStyle(0x6b3a2a, 1);
      g.fillRect(2, 5, 12, 3);
      g.fillRect(3, 3, 10, 2);
      g.fillRect(5, 2, 6, 1);
      // Chimney
      g.fillStyle(0x5a4a3a, 1);
      g.fillRect(10, 1, 2, 4);
      // Door
      g.fillStyle(0x4a2a1a, 1);
      g.fillRect(6, 10, 4, 5);
      // Windows with glow
      g.fillStyle(0xddcc66, 0.8);
      g.fillRect(4, 8, 2, 2);
      g.fillRect(10, 8, 2, 2);
      // Window glow
      g.fillStyle(0xffee88, 0.3);
      g.fillRect(3, 7, 4, 4);
      g.fillRect(9, 7, 4, 4);
      g.generateTexture('detail_house', s, s);
      g.destroy();
    }
  }

  // ── Particle textures ─────────────────────────────────────────────────────

  static generateParticleTextures(scene) {
    // Dust (2×2 brown)
    {
      const g = scene.add.graphics();
      g.fillStyle(0xc8a870, 1);
      g.fillRect(0, 0, 2, 2);
      g.generateTexture('particle_dust', 2, 2);
      g.destroy();
    }

    // Blood (3×3 red)
    {
      const g = scene.add.graphics();
      g.fillStyle(0xcc2222, 1);
      g.fillRect(0, 0, 3, 3);
      g.generateTexture('particle_blood', 3, 3);
      g.destroy();
    }

    // Blood variant 1 - darker
    {
      const g = scene.add.graphics();
      g.fillStyle(0xaa1111, 1);
      g.fillRect(0, 0, 3, 3);
      g.generateTexture('particle_blood_1', 3, 3);
      g.destroy();
    }

    // Blood variant 2 - brighter
    {
      const g = scene.add.graphics();
      g.fillStyle(0xee3333, 1);
      g.fillRect(0, 0, 3, 3);
      g.generateTexture('particle_blood_2', 3, 3);
      g.destroy();
    }

    // Sparkle (4×4 cross)
    {
      const g = scene.add.graphics();
      g.fillStyle(0xffdd44, 1);
      g.fillRect(1, 0, 2, 4); // vertical
      g.fillRect(0, 1, 4, 2); // horizontal
      g.generateTexture('particle_sparkle', 4, 4);
      g.destroy();
    }

    // Rain (1×3 blue)
    {
      const g = scene.add.graphics();
      g.fillStyle(0x88aacc, 1);
      g.fillRect(0, 0, 1, 3);
      g.generateTexture('particle_rain', 1, 3);
      g.destroy();
    }

    // Snow (2×2 white)
    {
      const g = scene.add.graphics();
      g.fillStyle(0xeeeeff, 1);
      g.fillRect(0, 0, 2, 2);
      g.generateTexture('particle_snow', 2, 2);
      g.destroy();
    }

    // Leaf green (4x4)
    {
      const g = scene.add.graphics();
      g.fillStyle(0x4a7a38, 1);
      g.fillRect(0, 1, 3, 2);
      g.fillRect(1, 0, 2, 1);
      g.fillRect(1, 3, 2, 1);
      g.generateTexture('particle_leaf_green', 4, 4);
      g.destroy();
    }

    // Leaf gold (4x4)
    {
      const g = scene.add.graphics();
      g.fillStyle(0xbb8822, 1);
      g.fillRect(0, 1, 3, 2);
      g.fillRect(1, 0, 2, 1);
      g.fillRect(1, 3, 2, 1);
      g.generateTexture('particle_leaf_gold', 4, 4);
      g.destroy();
    }

    // Mist (6x6 soft circle at 0.3 alpha)
    {
      const g = scene.add.graphics();
      g.fillStyle(0xccddee, 0.3);
      g.fillRect(1, 0, 4, 1);
      g.fillRect(0, 1, 6, 4);
      g.fillRect(1, 5, 4, 1);
      g.generateTexture('particle_mist', 6, 6);
      g.destroy();
    }

    // Spark (3x3 yellow cross for combat impacts)
    {
      const g = scene.add.graphics();
      g.fillStyle(0xffdd44, 1);
      g.fillRect(1, 0, 1, 3);
      g.fillRect(0, 1, 3, 1);
      g.generateTexture('particle_spark', 3, 3);
      g.destroy();
    }

    // Rain splash (4x2)
    {
      const g = scene.add.graphics();
      g.fillStyle(0x88aacc, 0.7);
      g.fillRect(0, 1, 4, 1);
      g.fillRect(1, 0, 2, 1);
      g.generateTexture('particle_rainsplash', 4, 2);
      g.destroy();
    }

    // Dust sand (2x2)
    {
      const g = scene.add.graphics();
      g.fillStyle(0xd4bc8b, 1);
      g.fillRect(0, 0, 2, 2);
      g.generateTexture('particle_dust_sand', 2, 2);
      g.destroy();
    }

    // Dust snow (2x2)
    {
      const g = scene.add.graphics();
      g.fillStyle(0xd8d0c0, 1);
      g.fillRect(0, 0, 2, 2);
      g.generateTexture('particle_dust_snow', 2, 2);
      g.destroy();
    }
  }

  // ── Village textures ─────────────────────────────────────────────────────

  static generateVillageTextures(scene) {
    // Village floor tile (stone)
    {
      const g = scene.add.graphics();
      const s = 32;
      g.fillStyle(0x8a7d6b, 1);
      g.fillRect(0, 0, s, s);
      // Stone grid lines
      g.fillStyle(0x7a6d5b, 1);
      g.fillRect(0, 15, s, 2);
      g.fillRect(15, 0, 2, s);
      // Slight color variation
      g.fillStyle(0x9a8d7b, 0.3);
      g.fillRect(2, 2, 12, 12);
      g.fillRect(18, 18, 12, 12);
      g.generateTexture('village_floor', s, s);
      g.destroy();
    }

    // Village wall segment
    {
      const g = scene.add.graphics();
      const s = 32;
      g.fillStyle(0x6b5d4b, 1);
      g.fillRect(0, 0, s, s);
      g.fillStyle(0x5a4d3b, 1);
      g.fillRect(0, 0, s, 4);
      g.fillRect(0, 14, s, 4);
      g.fillRect(0, 28, s, 4);
      g.generateTexture('village_wall', s, s);
      g.destroy();
    }

    // Inn building
    {
      const g = scene.add.graphics();
      const s = 48;
      // Walls
      g.fillStyle(0x8b6b4a, 1);
      g.fillRect(4, 14, 40, 30);
      // Roof
      g.fillStyle(0x6b3a2a, 1);
      g.fillRect(2, 8, 44, 8);
      g.fillRect(6, 4, 36, 6);
      g.fillRect(10, 2, 28, 4);
      // Chimney
      g.fillStyle(0x5a4a3a, 1);
      g.fillRect(34, 0, 6, 8);
      // Smoke puff
      g.fillStyle(0xaaaaaa, 0.5);
      g.fillRect(35, -2, 4, 3);
      // Door
      g.fillStyle(0x4a2a1a, 1);
      g.fillRect(18, 28, 12, 16);
      // Windows
      g.fillStyle(0xddaa55, 1);
      g.fillRect(6, 20, 8, 6);
      g.fillRect(34, 20, 8, 6);
      // Sign "INN"
      g.fillStyle(0xc8a870, 1);
      g.fillRect(14, 12, 20, 6);
      g.fillStyle(0x3d2b1f, 1);
      g.fillRect(16, 13, 2, 4);
      g.fillRect(20, 13, 2, 4);
      g.fillRect(22, 13, 1, 1);
      g.fillRect(22, 16, 1, 1);
      g.fillRect(26, 13, 2, 4);
      g.fillRect(28, 13, 1, 1);
      g.fillRect(28, 16, 1, 1);
      g.generateTexture('detail_inn', s, s);
      g.destroy();
    }

    // Shop building
    {
      const g = scene.add.graphics();
      const s = 48;
      // Walls
      g.fillStyle(0x7a6b5a, 1);
      g.fillRect(4, 14, 40, 30);
      // Roof
      g.fillStyle(0x4a6a3a, 1);
      g.fillRect(2, 8, 44, 8);
      g.fillRect(6, 4, 36, 6);
      g.fillRect(10, 2, 28, 4);
      // Door
      g.fillStyle(0x4a2a1a, 1);
      g.fillRect(18, 28, 12, 16);
      // Windows (display cases)
      g.fillStyle(0x88ccee, 1);
      g.fillRect(6, 18, 10, 8);
      g.fillRect(32, 18, 10, 8);
      // Hanging sign
      g.fillStyle(0x5a4a3a, 1);
      g.fillRect(0, 10, 2, 12);
      g.fillRect(0, 10, 10, 2);
      g.fillStyle(0xc8a870, 1);
      g.fillRect(2, 12, 8, 8);
      g.generateTexture('detail_shop', s, s);
      g.destroy();
    }

    // Blacksmith building
    {
      const g = scene.add.graphics();
      const s = 48;
      // Walls
      g.fillStyle(0x5a5a5a, 1);
      g.fillRect(4, 14, 40, 30);
      // Roof
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(2, 8, 44, 8);
      g.fillRect(6, 4, 36, 6);
      g.fillRect(10, 2, 28, 4);
      // Open front (forge visible)
      g.fillStyle(0xff6622, 0.6);
      g.fillRect(14, 28, 20, 16);
      // Anvil
      g.fillStyle(0x444444, 1);
      g.fillRect(36, 36, 8, 4);
      g.fillRect(38, 32, 4, 4);
      // Chimney
      g.fillStyle(0x4a4a4a, 1);
      g.fillRect(6, 0, 8, 8);
      g.fillStyle(0xaa6622, 0.4);
      g.fillRect(7, -2, 6, 3);
      g.generateTexture('detail_blacksmith', s, s);
      g.destroy();
    }

    // Gate (stone archway)
    {
      const g = scene.add.graphics();
      const s = 48;
      // Left pillar
      g.fillStyle(0x6b6157, 1);
      g.fillRect(4, 4, 10, 40);
      // Right pillar
      g.fillRect(34, 4, 10, 40);
      // Arch top
      g.fillRect(4, 4, 40, 8);
      g.fillRect(8, 0, 32, 6);
      // Arch opening
      g.fillStyle(0x3d2b1f, 1);
      g.fillRect(14, 12, 20, 36);
      // Keystone
      g.fillStyle(0x8a7d6b, 1);
      g.fillRect(20, 4, 8, 6);
      g.generateTexture('detail_gate', s, s);
      g.destroy();
    }

    // NPC (humanoid figure - rendered white for tinting)
    {
      const g = scene.add.graphics();
      const s = 24;
      const cx = s / 2, cy = s / 2;
      // Body
      g.fillStyle(0xdddddd, 1);
      g.fillRect(cx - 4, cy - 4, 8, 10);
      // Head
      g.fillStyle(0xeeeeee, 1);
      g.fillRect(cx - 3, cy - 8, 6, 5);
      // Eyes
      g.fillStyle(0x333333, 1);
      g.fillRect(cx - 2, cy - 6, 1, 1);
      g.fillRect(cx + 1, cy - 6, 1, 1);
      // Arms at sides
      g.fillStyle(0xcccccc, 1);
      g.fillRect(cx - 6, cy - 3, 2, 6);
      g.fillRect(cx + 4, cy - 3, 2, 6);
      // Legs
      g.fillStyle(0xbbbbbb, 1);
      g.fillRect(cx - 3, cy + 6, 2, 4);
      g.fillRect(cx + 1, cy + 6, 2, 4);
      g.generateTexture('detail_npc', s, s);
      g.destroy();
    }
  }

  // ── Animation registration ────────────────────────────────────────────────

  static registerAnimations(scene) {
    const dirs = ['down', 'up', 'left', 'right'];

    for (const dir of dirs) {
      // Player walk
      scene.anims.create({
        key: `player_walk_${dir}`,
        frames: [0, 1, 2, 3].map(f => ({ key: `player_walk_${dir}_${f}` })),
        frameRate: 8,
        repeat: -1,
      });

      // Player idle
      scene.anims.create({
        key: `player_idle_${dir}`,
        frames: [0, 1].map(f => ({ key: `player_idle_${dir}_${f}` })),
        frameRate: 2,
        repeat: -1,
      });

      // Player attack
      scene.anims.create({
        key: `player_attack_${dir}`,
        frames: [{ key: `player_attack_${dir}_0` }],
        frameRate: 4,
        repeat: 0,
      });
    }

    // Enemy animations
    const enemyTypes = ['Wolf', 'Bandit', 'Troll', 'SeaSerpent', 'Skeleton'];
    for (const type of enemyTypes) {
      scene.anims.create({
        key: `enemy_${type}_idle`,
        frames: [0, 1].map(f => ({ key: `enemy_${type}_idle_${f}` })),
        frameRate: 3,
        repeat: -1,
      });

      scene.anims.create({
        key: `enemy_${type}_chase`,
        frames: [0, 1].map(f => ({ key: `enemy_${type}_chase_${f}` })),
        frameRate: 6,
        repeat: -1,
      });
    }
  }
}
