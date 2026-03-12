import Phaser from 'phaser';
import { TERRAIN, TILE_SIZE, SOLDIER_TYPES, VILLAGER_TYPES } from '../constants.js';
import { TERRAIN_PALETTE } from './ParchmentColors.js';

// Cel-shading grayscale palette (for tinted sprites: player, enemies, NPCs)
const SHADE = {
  OUTLINE:  0x404040,
  DEEP:     0x555555,
  SHADOW:   0x808080,
  BASE:     0xC0C0C0,
  HIGHLIGHT:0xF0F0F0,
  SPECULAR: 0xFFFFFF,
};

/**
 * Procedurally generates all pixel-art textures at boot time using Phaser Graphics.
 * No external image assets needed. Uses 3-tone cel shading with outlines.
 */
export default class SpriteFactory {
  static generateAll(scene) {
    SpriteFactory.generatePlayerTextures(scene);
    SpriteFactory.generateEnemyTextures(scene);
    SpriteFactory.generateResourceTextures(scene);
    SpriteFactory.generateTerrainTextures(scene);
    SpriteFactory.generateParticleTextures(scene);
    SpriteFactory.generateVillageTextures(scene);
    SpriteFactory._generateItemIcons(scene);
    SpriteFactory.generateCampTextures(scene);
    SpriteFactory.generateBuildingTextures(scene);
    SpriteFactory.generateKeepItemTextures(scene);
    SpriteFactory.generateStructureTextures(scene);
    SpriteFactory.generateTerrainTileTextures(scene);
    SpriteFactory.generateTransitionTextures(scene);
    SpriteFactory.generateUnitTextures(scene);
  }

  // ── Terrain tile textures (32x32 with internal detail) ──────────────────

  static generateTerrainTileTextures(scene) {
    const S = TILE_SIZE; // 32
    const S3 = Math.floor(S / 3);
    const S2 = Math.floor(S / 2);

    // Depth helpers — called as last step in each drawer
    const _applyLandDepth = (g, pal) => {
      // Vertical gradient
      g.fillStyle(pal.light, 0.12);
      g.fillRect(0, 0, S, S3);
      g.fillStyle(pal.dark, 0.12);
      g.fillRect(0, S - S3, S, S3);
      // Bevel: highlight top-left, shadow bottom-right
      g.fillStyle(pal.light, 0.2);
      g.fillRect(0, 0, S, 1);
      g.fillRect(0, 0, 1, S);
      g.fillStyle(pal.dark, 0.25);
      g.fillRect(0, S - 1, S, 1);
      g.fillRect(S - 1, 0, 1, S);
      // Edge vignette
      g.fillStyle(pal.dark, 0.06);
      g.fillRect(0, 0, S, 2);
      g.fillRect(0, S - 2, S, 2);
      g.fillRect(0, 0, 2, S);
      g.fillRect(S - 2, 0, 2, S);
    };

    const _applyWaterDepth = (g, pal) => {
      // Vertical gradient
      g.fillStyle(pal.light, 0.12);
      g.fillRect(0, 0, S, S3);
      g.fillStyle(pal.dark, 0.12);
      g.fillRect(0, S - S3, S, S3);
      // Inverted bevel: dark top-left = concave
      g.fillStyle(pal.dark, 0.2);
      g.fillRect(0, 0, S, 1);
      g.fillRect(0, 0, 1, S);
      g.fillStyle(pal.light, 0.15);
      g.fillRect(0, S - 1, S, 1);
      g.fillRect(S - 1, 0, 1, S);
      // Edge vignette
      g.fillStyle(pal.dark, 0.06);
      g.fillRect(0, 0, S, 2);
      g.fillRect(0, S - 2, S, 2);
      g.fillRect(0, 0, 2, S);
      g.fillRect(S - 2, 0, 2, S);
    };

    const terrainDrawers = {
      [TERRAIN.PLAINS]: (g, pal, variant) => {
        g.fillStyle(variant < 2 ? pal.base : pal.light, 1);
        g.fillRect(0, 0, S, S);

        // Grass blade clusters — lean right (wind effect)
        for (let i = 0; i < 14; i++) {
          const bx = (i * 7 + variant * 3) % (S - 2);
          const by = (i * 11 + variant * 5) % (S - 4);
          g.fillStyle(pal.accent1, 0.65);
          g.fillRect(bx, by + 1, 1, 2);
          g.fillRect(bx + 1, by, 1, 2);
          if (i % 3 === 0) {
            g.fillStyle(pal.accent1, 0.5);
            g.fillRect(bx + 2, by + 1, 1, 2);
          }
        }

        // Light catching grass tips (upper-left quadrant only)
        for (let i = 0; i < 4; i++) {
          const hx = (i * 11 + variant * 7) % S2;
          const hy = (i * 13 + variant * 3) % S2;
          g.fillStyle(pal.light, 0.5);
          g.fillRect(hx, hy, 1, 1);
        }

        // Soil speck clusters (L-shapes)
        for (let i = 0; i < 4; i++) {
          const sx = (i * 13 + variant * 9) % (S - 2);
          const sy = (i * 17 + variant * 7) % (S - 2);
          g.fillStyle(pal.accent2, 0.3);
          g.fillRect(sx, sy, 2, 1);
          g.fillRect(sx, sy + 1, 1, 1);
        }

        _applyLandDepth(g, pal);
      },

      [TERRAIN.FOREST]: (g, pal, variant) => {
        g.fillStyle(pal.dark, 1);
        g.fillRect(0, 0, S, S);

        // Leaf litter clusters (overlapping shapes at varying opacities = depth layers)
        for (let i = 0; i < 10; i++) {
          const lx = (i * 11 + variant * 7) % (S - 3);
          const ly = (i * 13 + variant * 5) % (S - 3);
          const opacity = 0.3 + (i % 3) * 0.15;
          g.fillStyle(pal.accent1, opacity);
          g.fillRect(lx, ly, 2, 1);
          g.fillRect(lx + 1, ly + 1, 1, 2);
        }

        // Root lines with shadow underneath
        for (let i = 0; i < 4; i++) {
          const rx = (i * 17 + variant * 3) % (S - 7);
          const ry = (i * 19 + variant * 9) % (S - 2);
          g.fillStyle(pal.accent2, 0.55);
          g.fillRect(rx, ry, 6, 1);
          g.fillStyle(pal.dark, 0.3);
          g.fillRect(rx, ry + 1, 6, 1);
        }

        // Dappled light with dithered edges (checkerboard border)
        for (let i = 0; i < 5; i++) {
          const px = (i * 23 + variant * 11) % (S - 4);
          const py = (i * 29 + variant * 7) % (S - 4);
          g.fillStyle(pal.light, 0.2);
          g.fillRect(px + 1, py + 1, 2, 2);
          g.fillStyle(pal.light, 0.1);
          g.fillRect(px, py, 1, 1);
          g.fillRect(px + 2, py, 1, 1);
          g.fillRect(px, py + 2, 1, 1);
          g.fillRect(px + 3, py + 1, 1, 1);
          g.fillRect(px + 1, py + 3, 1, 1);
        }

        _applyLandDepth(g, pal);
      },

      [TERRAIN.SAND]: (g, pal, variant) => {
        g.fillStyle(variant < 2 ? pal.base : pal.light, 1);
        g.fillRect(0, 0, S, S);

        // Curved wind ripple lines (segmented with vertical offset)
        for (let i = 0; i < 5; i++) {
          const baseY = 3 + i * 6 + (variant * 2) % 4;
          if (baseY >= S - 1) continue;
          const segW = S3;
          for (let seg = 0; seg < 3; seg++) {
            const sy = baseY + ((seg + variant) % 2);
            g.fillStyle(pal.dark, 0.18);
            g.fillRect(seg * segW, sy, segW, 1);
            g.fillStyle(pal.light, 0.12);
            g.fillRect(seg * segW, sy + 1, segW, 1);
          }
        }

        // Pebble clusters (2-3 pixel groups)
        for (let i = 0; i < 3; i++) {
          const px = (i * 17 + variant * 13) % (S - 2);
          const py = (i * 23 + variant * 7) % (S - 2);
          g.fillStyle(pal.accent2, 0.3);
          g.fillRect(px, py, 2, 1);
          g.fillRect(px + 1, py + 1, 1, 1);
        }

        _applyLandDepth(g, pal);
      },

      [TERRAIN.MOUNTAINS]: (g, pal, variant) => {
        // Dark ground base (shadow at base of mountain)
        g.fillStyle(pal.dark, 1);
        g.fillRect(0, 0, S, S);

        // Contour rings: nested lighter rectangles = peak shape
        g.fillStyle(pal.base, 1);
        g.fillRect(4, 4, S - 8, S - 8);
        g.fillStyle(pal.light, 0.7);
        g.fillRect(7, 6, S - 14, S - 16);
        g.fillStyle(pal.accent2, 0.5);
        g.fillRect(10, 8, S - 20, S - 22);

        // Left face lighter (sunlit), right face darker (shadow)
        const halfW = Math.floor((S - 8) / 2);
        g.fillStyle(pal.light, 0.2);
        g.fillRect(4, 4, halfW, S - 8);
        g.fillStyle(pal.dark, 0.15);
        g.fillRect(4 + halfW, 4, halfW, S - 8);

        // Diagonal crevice cracks with lit edge above
        for (let i = 0; i < 8 + variant; i++) {
          const cx = (i * 9 + variant * 5) % (S - 6);
          const cy = (i * 7 + variant * 3) % (S - 8);
          g.fillStyle(pal.dark, 0.4);
          for (let d = 0; d < 4; d++) g.fillRect(cx + d, cy + d, 1, 1);
          g.fillStyle(pal.light, 0.25);
          for (let d = 0; d < 4; d++) g.fillRect(cx + d, Math.max(0, cy + d - 1), 1, 1);
        }

        // Snow cap hint at top (variant-dependent)
        if (variant < 2) {
          g.fillStyle(0xd0c8c0, 0.3);
          g.fillRect(S2 - 4, 6, 8, 3);
        }

        _applyLandDepth(g, pal);
      },

      [TERRAIN.SNOW]: (g, pal, variant) => {
        g.fillStyle(pal.base, 1);
        g.fillRect(0, 0, S, S);

        // Subtle drift mound contour
        g.fillStyle(pal.light, 0.1);
        g.fillRect(6, 5, S - 12, S - 12);
        g.fillStyle(pal.light, 0.08);
        g.fillRect(10, 8, S - 20, S - 18);

        // Drift arcs with blue shadow + dithered edge
        for (let i = 0; i < 4; i++) {
          const ax = (i * 13 + variant * 7) % (S - 10);
          const ay = (i * 11 + variant * 5) % (S - 4);
          g.fillStyle(pal.accent1, 0.15);
          g.fillRect(ax, ay, 9, 1);
          g.fillRect(ax + 1, ay + 1, 7, 1);
          g.fillStyle(pal.accent1, 0.08);
          g.fillRect(ax + 9, ay, 1, 1);
          g.fillRect(ax, ay + 2, 1, 1);
        }

        // Ice sparkle in upper-left (lit side)
        const sparkleRange = Math.floor(S * 2 / 3);
        for (let i = 0; i < 5; i++) {
          const sx = (i * 19 + variant * 11) % sparkleRange;
          const sy = (i * 17 + variant * 3) % sparkleRange;
          g.fillStyle(pal.accent2, 0.7);
          g.fillRect(sx, sy, 1, 1);
        }

        _applyLandDepth(g, pal);
      },

      [TERRAIN.HILLS]: (g, pal, variant) => {
        g.fillStyle(pal.base, 1);
        g.fillRect(0, 0, S, S);

        // Mound contour
        g.fillStyle(pal.light, 0.2);
        g.fillRect(4, 3, S - 8, S - 8);
        g.fillStyle(pal.light, 0.15);
        g.fillRect(8, 6, S - 16, S - 14);

        // Rocky clusters with light/dark pairs (reads as 3D bumps)
        for (let i = 0; i < 6; i++) {
          const rx = (i * 11 + variant * 9) % (S - 4);
          const ry = (i * 13 + variant * 7) % (S - 4);
          g.fillStyle(pal.accent1, 0.4);
          g.fillRect(rx, ry, 2, 2);
          g.fillStyle(pal.light, 0.3);
          g.fillRect(rx, ry, 2, 1);
          g.fillStyle(pal.dark, 0.3);
          g.fillRect(rx, ry + 1, 2, 1);
        }

        // Grass blades at bottom edge
        for (let i = 0; i < 5; i++) {
          const gx = (i * 7 + variant * 11) % S;
          g.fillStyle(pal.accent2, 0.35);
          g.fillRect(gx, S - 4, 1, 3);
        }

        // Erosion streaks with lit/shadow edges
        for (let i = 0; i < 3; i++) {
          const ex = (i * 17 + variant * 5) % (S - 8);
          const ey = (i * 19 + variant * 3) % (S - 4);
          g.fillStyle(pal.light, 0.2);
          g.fillRect(ex, ey, 6, 1);
          g.fillStyle(pal.dark, 0.25);
          g.fillRect(ex, ey + 1, 6, 1);
        }

        _applyLandDepth(g, pal);
      },

      [TERRAIN.WATER]: (g, pal, variant) => {
        g.fillStyle(pal.light, 1);
        g.fillRect(0, 0, S, S2);
        g.fillStyle(pal.base, 1);
        g.fillRect(0, S2, S, S2);
        for (let i = 0; i < 4; i++) {
          const wy = 4 + i * 7 + (variant * 3) % 4;
          if (wy >= S) continue;
          g.fillStyle(pal.accent1, 0.3);
          g.fillRect(2, wy, S - 4, 1);
        }
        _applyWaterDepth(g, pal);
      },

      [TERRAIN.DEEP_WATER]: (g, pal, variant) => {
        g.fillStyle(pal.dark, 1);
        g.fillRect(0, 0, S, S);
        g.fillStyle(pal.base, 0.5);
        g.fillRect(0, 0, S, S3);
        for (let i = 0; i < 2; i++) {
          const wy = 8 + i * 12 + (variant * 5) % 6;
          if (wy >= S) continue;
          g.fillStyle(pal.accent1, 0.2);
          g.fillRect(1, wy, S - 2, 2);
        }
        _applyWaterDepth(g, pal);
      },

      [TERRAIN.RIVER]: (g, pal, variant) => {
        g.fillStyle(pal.base, 1);
        g.fillRect(0, 0, S, S);
        for (let i = 0; i < 5; i++) {
          const fx = (i * 7 + variant * 3) % (S - 4);
          const fy = (i * 5 + variant * 9) % (S - 3);
          g.fillStyle(pal.light, 0.3);
          for (let d = 0; d < 4; d++) g.fillRect(fx + d, fy + d, 1, 1);
        }
        g.fillStyle(pal.accent2, 0.15);
        g.fillRect(0, 0, S, S3);
        _applyWaterDepth(g, pal);
      },

      [TERRAIN.VILLAGE]: (g, pal, variant) => {
        g.fillStyle(pal.dark, 1);
        g.fillRect(0, 0, S, S);
        const stoneW = 6;
        const stoneH = 5;
        const gap = 1;
        for (let row = 0; row < Math.ceil(S / (stoneH + gap)); row++) {
          const offsetX = (row % 2 === 0 ? 0 : 3) + (variant % 2);
          for (let col = 0; col < Math.ceil(S / (stoneW + gap)) + 1; col++) {
            const sx = offsetX + col * (stoneW + gap);
            const sy = row * (stoneH + gap);
            if (sx >= S || sy >= S) continue;
            const toneIdx = (row * 3 + col * 5 + variant) % 4;
            const tones = [pal.base, pal.light, pal.detail, pal.accent2];
            g.fillStyle(tones[toneIdx], 1);
            const w = Math.min(stoneW, S - sx);
            const h = Math.min(stoneH, S - sy);
            g.fillRect(sx, sy, w, h);
            // Per-stone bevel: lit top, shadow bottom
            g.fillStyle(pal.light, 0.25);
            g.fillRect(sx, sy, w, 1);
            g.fillStyle(pal.dark, 0.3);
            g.fillRect(sx, sy + h - 1, w, 1);
          }
        }
        _applyLandDepth(g, pal);
      },

      [TERRAIN.ROAD]: (g, pal, variant) => {
        g.fillStyle(pal.base, 1);
        g.fillRect(0, 0, S, S);
        // Cart track lines with shadow
        g.fillStyle(pal.accent1, 0.4);
        g.fillRect(8, 0, 2, S);
        g.fillRect(22, 0, 2, S);
        g.fillStyle(pal.dark, 0.25);
        g.fillRect(10, 0, 1, S);
        g.fillRect(24, 0, 1, S);
        // Packed dirt texture
        for (let i = 0; i < 6; i++) {
          const dx = (i * 11 + variant * 7) % S;
          const dy = (i * 13 + variant * 5) % S;
          g.fillStyle(pal.dark, 0.2);
          g.fillRect(dx, dy, 2, 1);
        }
        // Scattered pebble clusters with highlight
        for (let i = 0; i < 4; i++) {
          const px = (i * 19 + variant * 9) % (S - 1);
          const py = (i * 17 + variant * 3) % (S - 1);
          g.fillStyle(pal.accent2, 0.35);
          g.fillRect(px, py, 1, 1);
          g.fillStyle(pal.light, 0.2);
          g.fillRect(px, Math.max(0, py - 1), 1, 1);
        }
        _applyLandDepth(g, pal);
      },
    };

    // Generate 4 variants for each terrain type
    const terrainNames = {
      [TERRAIN.DEEP_WATER]: 'deep_water',
      [TERRAIN.WATER]: 'water',
      [TERRAIN.SAND]: 'sand',
      [TERRAIN.PLAINS]: 'plains',
      [TERRAIN.FOREST]: 'forest',
      [TERRAIN.HILLS]: 'hills',
      [TERRAIN.MOUNTAINS]: 'mountains',
      [TERRAIN.SNOW]: 'snow',
      [TERRAIN.VILLAGE]: 'village',
      [TERRAIN.ROAD]: 'road',
      [TERRAIN.RIVER]: 'river',
    };

    let count = 0;
    for (const [terrainTypeStr, drawFn] of Object.entries(terrainDrawers)) {
      const terrainType = Number(terrainTypeStr);
      const pal = TERRAIN_PALETTE[terrainType];
      const name = terrainNames[terrainType];
      if (!pal || !name) continue;

      for (let v = 0; v < 4; v++) {
        const key = `terrain_${name}_${v}`;
        const g = scene.add.graphics();
        drawFn(g, pal, v);
        g.generateTexture(key, S, S);
        g.destroy();
        count++;
      }
    }
    console.log(`[SpriteFactory] Generated ${count} terrain tile textures`);

    // Elevation drop shadow textures
    for (const dir of ['n', 'w']) {
      const key = `shadow_${dir}`;
      const g = scene.add.graphics();
      const shadowDepth = 3;
      for (let d = 0; d < shadowDepth; d++) {
        const alpha = 0.18 * (1 - d / shadowDepth);
        g.fillStyle(0x1a1820, alpha);
        if (dir === 'n') {
          g.fillRect(0, d, S, 1);
        } else {
          g.fillRect(d, 0, 1, S);
        }
      }
      g.generateTexture(key, S, S);
      g.destroy();
    }
  }

  // ── Terrain transition textures (edge overlays) ────────────────────────

  static generateTransitionTextures(scene) {
    const S = TILE_SIZE;
    const dirs = ['n', 's', 'e', 'w'];

    const terrainNames = {
      [TERRAIN.DEEP_WATER]: 'deep_water',
      [TERRAIN.WATER]: 'water',
      [TERRAIN.SAND]: 'sand',
      [TERRAIN.PLAINS]: 'plains',
      [TERRAIN.FOREST]: 'forest',
      [TERRAIN.HILLS]: 'hills',
      [TERRAIN.MOUNTAINS]: 'mountains',
      [TERRAIN.SNOW]: 'snow',
      [TERRAIN.VILLAGE]: 'village',
      [TERRAIN.ROAD]: 'road',
      [TERRAIN.RIVER]: 'river',
    };

    // For each terrain type, generate 4 directional edge overlays
    for (const [terrainTypeStr, name] of Object.entries(terrainNames)) {
      const pal = TERRAIN_PALETTE[Number(terrainTypeStr)];
      if (!pal) continue;

      for (const dir of dirs) {
        const key = `transition_${name}_${dir}`;
        const g = scene.add.graphics();

        // Draw a gradient fade from the terrain color on the edge side
        const fadeDepth = 8; // pixels of fade
        for (let d = 0; d < fadeDepth; d++) {
          const alpha = 0.5 * (1 - d / fadeDepth);
          g.fillStyle(pal.base, alpha);

          if (dir === 'n') {
            g.fillRect(0, d, S, 1);
          } else if (dir === 's') {
            g.fillRect(0, S - 1 - d, S, 1);
          } else if (dir === 'w') {
            g.fillRect(d, 0, 1, S);
          } else if (dir === 'e') {
            g.fillRect(S - 1 - d, 0, 1, S);
          }
        }

        g.generateTexture(key, S, S);
        g.destroy();
      }
    }
  }

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

    // === 1. OUTLINE SILHOUETTE (1px border in dark gray) ===
    g.fillStyle(SHADE.OUTLINE, 1);
    // Head outline
    g.fillRect(cx - 4, cy - 9, 8, 7);
    // Torso outline
    g.fillRect(cx - 5, cy - 5, 10, 12);
    // Leg outlines
    g.fillRect(cx - 4, cy + 5, 3, 6);
    g.fillRect(cx + 0, cy + 5, 3, 6);

    // === 2. HEAD ===
    // Base tone
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 3, cy - 8, 6, 5);
    // Left highlight (light source top-left)
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy - 8, 3, 3);
    // Right shadow
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 1, cy - 6, 2, 3);
    // Chin shadow
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 2, cy - 4, 4, 1);
    // Hair volume (top strip)
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 3, cy - 8, 6, 2);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy - 8, 2, 1);

    // Eyes
    g.fillStyle(SHADE.OUTLINE, 1);
    if (dir === 'down') {
      g.fillRect(cx - 2, cy - 6, 1, 1);
      g.fillRect(cx + 1, cy - 6, 1, 1);
      // Eye highlights
      g.fillStyle(SHADE.SPECULAR, 1);
      g.fillRect(cx - 2, cy - 6, 1, 1);
      g.fillStyle(SHADE.DEEP, 1);
      g.fillRect(cx - 2, cy - 6, 1, 1);  // pupil
      g.fillRect(cx + 1, cy - 6, 1, 1);
    } else if (dir === 'up') {
      // No eyes from behind - show hair back
      g.fillStyle(SHADE.SHADOW, 1);
      g.fillRect(cx - 3, cy - 8, 6, 3);
    } else if (dir === 'left') {
      g.fillStyle(SHADE.DEEP, 1);
      g.fillRect(cx - 3, cy - 6, 1, 1);
    } else {
      g.fillStyle(SHADE.DEEP, 1);
      g.fillRect(cx + 2, cy - 6, 1, 1);
    }

    // === 3. TORSO - 3-column lighting ===
    // Base fill
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 4, cy - 4, 8, 10);
    // Left highlight column
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 4, cy - 4, 3, 8);
    // Right shadow column
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 1, cy - 4, 3, 8);
    // Bottom shadow band
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 4, cy + 4, 8, 2);
    // Belt detail
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 4, cy + 2, 8, 1);
    // Belt buckle
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx - 1, cy + 2, 2, 1);
    // Shoulder highlights
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 4, cy - 4, 2, 1);
    g.fillRect(cx + 2, cy - 4, 2, 1);
    // Armor band across chest
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 3, cy - 2, 6, 1);

    // === 4. LEGS ===
    if (anim === 'walk') {
      const legOffset = [0, 2, 0, -2][frame];
      // Left leg (lit side)
      g.fillStyle(SHADE.BASE, 1);
      g.fillRect(cx - 3, cy + 6, 2, 4 + legOffset);
      g.fillStyle(SHADE.HIGHLIGHT, 1);
      g.fillRect(cx - 3, cy + 6, 1, 3 + legOffset);
      // Right leg (shadow side)
      g.fillStyle(SHADE.BASE, 1);
      g.fillRect(cx + 1, cy + 6, 2, 4 - legOffset);
      g.fillStyle(SHADE.SHADOW, 1);
      g.fillRect(cx + 2, cy + 6, 1, 3 - legOffset);
      // Inner edge shadows
      g.fillStyle(SHADE.DEEP, 1);
      g.fillRect(cx - 1, cy + 6, 1, 2);
      g.fillRect(cx + 0, cy + 6, 1, 2);
    } else if (anim === 'idle') {
      // Legs base
      g.fillStyle(SHADE.BASE, 1);
      g.fillRect(cx - 3, cy + 6, 2, 4);
      g.fillRect(cx + 1, cy + 6, 2, 4);
      // Highlights on left leg
      g.fillStyle(SHADE.HIGHLIGHT, 1);
      g.fillRect(cx - 3, cy + 6, 1, 3);
      // Shadow on right leg
      g.fillStyle(SHADE.SHADOW, 1);
      g.fillRect(cx + 2, cy + 6, 1, 3);
      // Inner shadows
      g.fillStyle(SHADE.DEEP, 1);
      g.fillRect(cx - 1, cy + 6, 1, 2);
      g.fillRect(cx + 0, cy + 6, 1, 2);
      // Breathing animation
      if (frame === 1) {
        g.fillStyle(SHADE.HIGHLIGHT, 1);
        g.fillRect(cx - 5, cy - 3, 2, 1);
        g.fillRect(cx + 3, cy - 3, 2, 1);
      }
    } else {
      // Attack stance legs
      g.fillStyle(SHADE.BASE, 1);
      g.fillRect(cx - 3, cy + 6, 2, 4);
      g.fillRect(cx + 1, cy + 6, 2, 4);
      g.fillStyle(SHADE.SHADOW, 1);
      g.fillRect(cx + 2, cy + 6, 1, 3);
      g.fillStyle(SHADE.DEEP, 1);
      g.fillRect(cx - 1, cy + 6, 1, 2);
    }

    // === 5. ARMS ===
    if (anim === 'attack') {
      if (dir === 'right') {
        // Left arm (lit, at side)
        g.fillStyle(SHADE.HIGHLIGHT, 1);
        g.fillRect(cx - 6, cy - 3, 2, 6);
        // Right arm extended
        g.fillStyle(SHADE.BASE, 1);
        g.fillRect(cx + 4, cy - 3, 7, 2);
        g.fillStyle(SHADE.SHADOW, 1);
        g.fillRect(cx + 4, cy - 2, 7, 1);
        // Weapon blade with metallic gradient
        g.fillStyle(SHADE.HIGHLIGHT, 1);
        g.fillRect(cx + 10, cy - 4, 2, 4);
        g.fillStyle(SHADE.SPECULAR, 1);
        g.fillRect(cx + 10, cy - 4, 1, 4);
        g.fillStyle(SHADE.SHADOW, 1);
        g.fillRect(cx + 11, cy - 3, 1, 2);
      } else if (dir === 'left') {
        // Right arm (shadow, at side)
        g.fillStyle(SHADE.SHADOW, 1);
        g.fillRect(cx + 4, cy - 3, 2, 6);
        // Left arm extended
        g.fillStyle(SHADE.BASE, 1);
        g.fillRect(cx - 11, cy - 3, 7, 2);
        g.fillStyle(SHADE.HIGHLIGHT, 1);
        g.fillRect(cx - 11, cy - 3, 7, 1);
        // Weapon
        g.fillStyle(SHADE.HIGHLIGHT, 1);
        g.fillRect(cx - 12, cy - 4, 2, 4);
        g.fillStyle(SHADE.SPECULAR, 1);
        g.fillRect(cx - 12, cy - 4, 1, 4);
        g.fillStyle(SHADE.SHADOW, 1);
        g.fillRect(cx - 11, cy - 3, 1, 2);
      } else if (dir === 'up') {
        g.fillStyle(SHADE.BASE, 1);
        g.fillRect(cx + 3, cy - 8, 2, 6);
        g.fillStyle(SHADE.HIGHLIGHT, 1);
        g.fillRect(cx + 3, cy - 8, 1, 6);
        // Weapon overhead
        g.fillStyle(SHADE.HIGHLIGHT, 1);
        g.fillRect(cx + 2, cy - 10, 4, 2);
        g.fillStyle(SHADE.SPECULAR, 1);
        g.fillRect(cx + 2, cy - 10, 2, 2);
      } else {
        // Down attack
        g.fillStyle(SHADE.BASE, 1);
        g.fillRect(cx + 3, cy - 2, 2, 6);
        g.fillStyle(SHADE.SHADOW, 1);
        g.fillRect(cx + 4, cy - 2, 1, 6);
        // Weapon below
        g.fillStyle(SHADE.HIGHLIGHT, 1);
        g.fillRect(cx + 2, cy + 4, 4, 2);
        g.fillStyle(SHADE.SPECULAR, 1);
        g.fillRect(cx + 2, cy + 4, 2, 2);
      }
    } else {
      const armSwing = anim === 'walk' ? [1, -1, -1, 1][frame] : 0;
      // Left arm (faces light = highlight)
      g.fillStyle(SHADE.HIGHLIGHT, 1);
      g.fillRect(cx - 6, cy - 3 + armSwing, 2, 6);
      g.fillStyle(SHADE.BASE, 1);
      g.fillRect(cx - 5, cy - 3 + armSwing, 1, 5);
      // Right arm (faces away = shadow)
      g.fillStyle(SHADE.SHADOW, 1);
      g.fillRect(cx + 4, cy - 3 - armSwing, 2, 6);
      g.fillStyle(SHADE.BASE, 1);
      g.fillRect(cx + 4, cy - 3 - armSwing, 1, 5);
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

    // === OUTLINE ===
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 7, cy - 4, 14, 8);
    g.fillRect(cx + 5, cy - 6, 5, 4);
    g.fillRect(cx - 9, cy - 5 + (frame === 1 ? -1 : 0), 4, 3);

    // === BODY - base ===
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 6, cy - 3, 12, 6);
    // Top highlight (light from top-left)
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 6, cy - 3, 8, 2);
    // Bottom shadow
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 5, cy + 1, 10, 2);
    // Fur texture stripes
    g.fillStyle(SHADE.SHADOW, 0.5);
    g.fillRect(cx - 4, cy - 2, 1, 4);
    g.fillRect(cx - 1, cy - 2, 1, 4);
    g.fillRect(cx + 2, cy - 2, 1, 4);

    // === HEAD ===
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx + 5, cy - 5, 4, 3);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx + 5, cy - 5, 3, 1);
    // Snout
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 7, cy - 3, 2, 1);

    // === EARS ===
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx + 6, cy - 7, 2, 2);
    g.fillRect(cx + 8, cy - 7, 2, 2);
    // Ear interior shadows
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx + 7, cy - 6, 1, 1);
    g.fillRect(cx + 9, cy - 6, 1, 1);

    // === LEGS with ground-contact shadow ===
    const legAnim = state === 'chase' ? (frame === 0 ? 2 : -1) : 0;
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 5, cy + 3, 2, 3 + legAnim);
    g.fillRect(cx - 2, cy + 3, 2, 3 - legAnim);
    g.fillRect(cx + 2, cy + 3, 2, 3 + legAnim);
    g.fillRect(cx + 5, cy + 3, 2, 3 - legAnim);
    // Leg highlights (front-left lit)
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 5, cy + 3, 1, 2 + legAnim);
    g.fillRect(cx + 2, cy + 3, 1, 2 + legAnim);
    // Leg shadows (right side)
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 1, cy + 3, 1, 2 - legAnim);
    g.fillRect(cx + 6, cy + 3, 1, 2 - legAnim);
    // Paw ground-contact darkening
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 5, cy + 5 + legAnim, 2, 1);
    g.fillRect(cx + 2, cy + 5 + legAnim, 2, 1);

    // === TAIL ===
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 8, cy - 4 + (frame === 1 ? -1 : 0), 3, 2);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 8, cy - 4 + (frame === 1 ? -1 : 0), 2, 1);

    // === EYE ===
    g.fillStyle(0xff4444, 1);
    g.fillRect(cx + 7, cy - 4, 1, 1);
    g.fillStyle(0xff8888, 0.7);
    g.fillRect(cx + 8, cy - 5, 1, 1);
  }

  static _drawBandit(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;

    // === OUTLINE ===
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 5, cy - 9, 8, 7);   // head outline
    g.fillRect(cx - 5, cy - 5, 10, 12);  // torso outline
    g.fillRect(cx - 4, cy + 5, 3, 6);    // leg outlines
    g.fillRect(cx + 0, cy + 5, 3, 6);

    // === HEAD ===
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 3, cy - 8, 6, 5);
    // Hood
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 3, cy - 8, 6, 2);
    // Hood brim shadow
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 3, cy - 6, 6, 1);
    // Head highlight left
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy - 7, 2, 1);

    // === TORSO ===
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 4, cy - 4, 8, 10);
    // Left highlight
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 4, cy - 4, 3, 7);
    // Right shadow
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 1, cy - 4, 3, 7);
    // Belt
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 4, cy + 2, 8, 1);
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx, cy + 2, 1, 1);
    // Tunic stitch lines
    g.fillStyle(SHADE.SHADOW, 0.4);
    g.fillRect(cx, cy - 3, 1, 5);
    // Bottom shadow
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 4, cy + 4, 8, 2);

    // === LEGS ===
    const legOff = state === 'chase' ? (frame === 0 ? 2 : -1) : 0;
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 3, cy + 6, 2, 4 + legOff);
    g.fillRect(cx + 1, cy + 6, 2, 4 - legOff);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy + 6, 1, 3 + legOff);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 2, cy + 6, 1, 3 - legOff);
    // Boots
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 3, cy + 8 + legOff, 2, 2);
    g.fillRect(cx + 1, cy + 8 - legOff, 2, 2);

    // === WEAPON (sword) with metallic gradient ===
    const weapSwing = state === 'chase' && frame === 1 ? -3 : 0;
    // Blade outline
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx + 4, cy - 7 + weapSwing, 3, 10);
    // Blade body
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx + 5, cy - 6 + weapSwing, 2, 8);
    // Specular edge
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx + 5, cy - 5 + weapSwing, 1, 6);
    // Shadow edge
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 6, cy - 4 + weapSwing, 1, 5);
    // Blade tip
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx + 5, cy - 6 + weapSwing, 1, 1);

    // === EYES ===
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 1, cy - 6, 1, 1);
    g.fillRect(cx + 2, cy - 6, 1, 1);
  }

  static _drawTroll(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;

    // === OUTLINE ===
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 9, cy - 6, 18, 14);  // body
    g.fillRect(cx - 4, cy - 11, 8, 7);   // head
    g.fillRect(cx - 13, cy - 4, 5, 10);  // left arm
    g.fillRect(cx + 8, cy - 4, 5, 10);   // right arm

    // === HEAD ===
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 3, cy - 10, 6, 6);
    // Brow ridge deep shadow
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 4, cy - 10, 8, 2);
    // Eye socket shadows
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 3, cy - 8, 2, 2);
    g.fillRect(cx + 1, cy - 8, 2, 2);
    // Left highlight
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy - 8, 1, 3);

    // === BODY ===
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 8, cy - 5, 16, 12);
    // Left highlight column
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 8, cy - 5, 5, 8);
    // Right shadow
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 3, cy - 5, 5, 8);
    // Belly crease lines
    g.fillStyle(SHADE.SHADOW, 0.5);
    g.fillRect(cx - 5, cy, 10, 1);
    g.fillRect(cx - 4, cy + 3, 8, 1);
    // Belly bottom shadow
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 8, cy + 5, 16, 2);
    // Wart bumps
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 4, cy - 2, 2, 2);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx + 4, cy - 2, 1, 1);

    // Loincloth
    g.fillStyle(0x886644, 0.7);
    g.fillRect(cx - 4, cy + 5, 8, 3);
    g.fillStyle(0x664422, 0.5);
    g.fillRect(cx - 4, cy + 7, 8, 1);

    // === ARMS ===
    const armOff = state === 'chase' && frame === 1 ? -2 : 0;
    // Left arm (lit)
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 12, cy - 3 + armOff, 4, 8);
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 11, cy - 2 + armOff, 3, 6);
    // Right arm (shadow)
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 8, cy - 3 - armOff, 4, 8);
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx + 8, cy - 2 - armOff, 3, 6);
    // Knuckle highlights
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 12, cy + 4 + armOff, 4, 1);
    g.fillRect(cx + 8, cy + 4 - armOff, 4, 1);

    // === LEGS ===
    const legOff = state === 'chase' ? (frame === 0 ? 2 : -1) : 0;
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 5, cy + 7, 4, 5 + legOff);
    g.fillRect(cx + 1, cy + 7, 4, 5 - legOff);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 5, cy + 7, 1, 4 + legOff);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 4, cy + 7, 1, 4 - legOff);

    // === EYES ===
    g.fillStyle(0xff6600, 1);
    g.fillRect(cx - 2, cy - 8, 1, 1);
    g.fillRect(cx + 1, cy - 8, 1, 1);
  }

  static _drawSerpent(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;
    const wave = frame === 0 ? 0 : 2;

    // === OUTLINE for entire serpent body ===
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 4, cy - 10, 8, 5);   // head outline
    g.fillRect(cx - 3, cy - 7 + wave, 5, 5);
    g.fillRect(cx + 0, cy - 4 + wave, 5, 5);
    g.fillRect(cx - 3, cy - 1 + wave, 5, 5);
    g.fillRect(cx - 6, cy + 2, 5, 5);
    g.fillRect(cx - 3, cy + 5 - wave, 5, 4);

    // === BODY SEGMENTS - alternating highlight/shadow scale pattern ===
    // Segment 1 - highlight
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 2, cy - 6 + wave, 4, 4);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 1, cy - 5 + wave, 1, 3);
    // Segment 2 - shadow
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 1, cy - 3 + wave, 4, 4);
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx + 1, cy - 3 + wave, 3, 3);
    // Segment 3 - highlight
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 2, cy + 0 + wave, 4, 4);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 1, cy + 1 + wave, 1, 3);
    // Segment 4 - shadow
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 5, cy + 3, 4, 4);
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 5, cy + 3, 3, 3);
    // Segment 5 - tail
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy + 6 - wave, 4, 3);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 2, cy + 6 - wave, 2, 2);

    // Fin ridges (dorsal spines)
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 3, cy - 6 + wave, 1, 2);
    g.fillRect(cx - 3, cy + 0 + wave, 1, 2);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx + 4, cy - 2 + wave, 1, 2);

    // === HEAD ===
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 3, cy - 9, 6, 4);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy - 9, 3, 2);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 1, cy - 7, 2, 2);

    // Fangs
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx - 2, cy - 5, 1, 2);
    g.fillRect(cx + 1, cy - 5, 1, 2);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 2, cy - 5, 1, 1);

    // Eyes
    g.fillStyle(0x33ff33, 1);
    g.fillRect(cx - 2, cy - 8, 1, 1);
    g.fillRect(cx + 1, cy - 8, 1, 1);
  }

  static _drawSkeleton(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;

    // === OUTLINE ===
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 4, cy - 9, 8, 7);    // skull outline
    g.fillRect(cx - 2, cy - 3, 4, 10);   // spine outline
    g.fillRect(cx - 5, cy - 2, 10, 2);   // rib outline
    g.fillRect(cx - 4, cy + 5, 3, 6);    // leg outline
    g.fillRect(cx + 0, cy + 5, 3, 6);

    // === SKULL ===
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy - 8, 6, 5);
    // Skull facets - left highlight, right shadow
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx - 3, cy - 8, 3, 3);
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx + 1, cy - 7, 2, 3);
    // Forehead ridge
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 3, cy - 5, 6, 1);
    // Eye sockets (deep shadow)
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 2, cy - 7, 2, 2);
    g.fillRect(cx + 1, cy - 7, 2, 2);
    // Eye socket inner glow
    g.fillStyle(0xff4444, 0.4);
    g.fillRect(cx - 2, cy - 7, 1, 1);
    g.fillRect(cx + 1, cy - 7, 1, 1);
    // Jaw
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy - 3, 4, 1);
    // Jaw gap / teeth
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 1, cy - 3, 1, 1);
    g.fillRect(cx + 1, cy - 3, 1, 1);
    // Crack detail on skull
    g.fillStyle(SHADE.SHADOW, 0.5);
    g.fillRect(cx + 1, cy - 8, 1, 3);

    // === RIBCAGE ===
    // Spine with cylindrical shading
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 1, cy - 2, 2, 8);
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx - 1, cy - 2, 1, 7);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx, cy - 1, 1, 6);
    // Ribs with roundness
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 4, cy - 1, 8, 1);
    g.fillRect(cx - 3, cy + 1, 6, 1);
    g.fillRect(cx - 4, cy + 3, 8, 1);
    // Rib left highlight
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx - 4, cy - 1, 2, 1);
    g.fillRect(cx - 3, cy + 1, 2, 1);
    g.fillRect(cx - 4, cy + 3, 2, 1);
    // Rib right shadow
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 2, cy - 1, 2, 1);
    g.fillRect(cx + 1, cy + 1, 2, 1);
    g.fillRect(cx + 2, cy + 3, 2, 1);
    // Gaps between ribs (deep)
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 3, cy, 6, 1);
    g.fillRect(cx - 2, cy + 2, 4, 1);

    // === ARM BONES ===
    const armOff = state === 'chase' ? (frame === 0 ? -2 : 2) : 0;
    // Left arm (lit)
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 6, cy - 1 + armOff, 2, 6);
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx - 6, cy - 1 + armOff, 1, 5);
    // Joint knobs
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 7, cy - 1 + armOff, 1, 1);
    g.fillRect(cx - 7, cy + 3 + armOff, 1, 1);
    // Right arm (shadow)
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx + 4, cy - 1 - armOff, 2, 6);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 5, cy - 1 - armOff, 1, 5);

    // === LEGS ===
    const legOff = state === 'chase' ? (frame === 0 ? 2 : -1) : 0;
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy + 6, 2, 4 + legOff);
    g.fillRect(cx + 1, cy + 6, 2, 4 - legOff);
    // Cylindrical bone shading
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx - 3, cy + 6, 1, 3 + legOff);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 2, cy + 6, 1, 3 - legOff);
  }

  // ── Resource textures ─────────────────────────────────────────────────────

  static generateResourceTextures(scene) {
    const resources = {
      gold:    { color: 0xffd700, highlight: 0xffee88, shadow: 0xaa8800, outline: 0x664400 },
      silver:  { color: 0xc0c0c0, highlight: 0xe8e8e8, shadow: 0x808080, outline: 0x404040 },
      emerald: { color: 0x50c878, highlight: 0x88eea8, shadow: 0x2a6a40, outline: 0x1a3a20 },
      ruby:    { color: 0xe0115f, highlight: 0xff6688, shadow: 0x880830, outline: 0x440418 },
    };

    for (const [name, info] of Object.entries(resources)) {
      const key = `resource_${name}`;
      const g = scene.add.graphics();
      const s = 12;
      const cx = s / 2, cy = s / 2;

      // Outline
      g.fillStyle(info.outline, 1);
      g.fillRect(cx - 2, cy - 5, 4, 10);
      g.fillRect(cx - 3, cy - 4, 6, 8);
      g.fillRect(cx - 4, cy - 3, 8, 6);
      g.fillRect(cx - 5, cy - 2, 10, 4);

      // Diamond base
      g.fillStyle(info.color, 1);
      g.fillRect(cx - 1, cy - 4, 2, 8);
      g.fillRect(cx - 2, cy - 3, 4, 6);
      g.fillRect(cx - 3, cy - 2, 6, 4);
      g.fillRect(cx - 4, cy - 1, 8, 2);

      // Shadow facet (bottom-right)
      g.fillStyle(info.shadow, 0.6);
      g.fillRect(cx, cy, 3, 2);
      g.fillRect(cx + 1, cy + 1, 2, 2);
      g.fillRect(cx, cy + 2, 1, 2);

      // Highlight facet (top-left) — sharper
      g.fillStyle(info.highlight, 0.8);
      g.fillRect(cx - 3, cy - 2, 3, 2);
      g.fillRect(cx - 2, cy - 3, 2, 2);
      g.fillRect(cx - 1, cy - 4, 1, 1);

      // Specular sparkle
      g.fillStyle(0xffffff, 0.7);
      g.fillRect(cx - 2, cy - 2, 1, 1);

      g.generateTexture(key, s, s);
      g.destroy();
    }

    // Wood resource — bark texture
    {
      const g = scene.add.graphics();
      const s = 12;
      // Outline
      g.fillStyle(0x2a1808, 1);
      g.fillRect(0, 1, 12, 10);
      // Three stacked logs
      g.fillStyle(0x6b4226, 1);
      g.fillRect(1, 2, 10, 3);
      g.fillRect(2, 5, 8, 3);
      g.fillRect(3, 8, 6, 3);
      // Bark texture lines
      g.fillStyle(0x5a3418, 0.4);
      g.fillRect(3, 3, 6, 1);
      g.fillRect(4, 6, 4, 1);
      g.fillRect(5, 9, 2, 1);
      // Highlights on each log
      g.fillStyle(0x8b5e3c, 0.8);
      g.fillRect(1, 2, 8, 1);
      g.fillRect(2, 5, 6, 1);
      g.fillRect(3, 8, 4, 1);
      // Shadows on bottom
      g.fillStyle(0x4a2a10, 0.5);
      g.fillRect(1, 4, 10, 1);
      g.fillRect(2, 7, 8, 1);
      // End grain circles
      g.fillStyle(0x5a3520, 1);
      g.fillRect(1, 3, 2, 1);
      g.fillRect(9, 3, 2, 1);
      g.generateTexture('resource_wood', s, s);
      g.destroy();
    }

    // Stone resource — faceted with outline
    {
      const g = scene.add.graphics();
      const s = 12;
      // Outline
      g.fillStyle(0x3a3830, 1);
      g.fillRect(1, 2, 10, 8);
      g.fillRect(2, 1, 8, 10);
      g.fillRect(0, 3, 12, 6);
      // Base
      g.fillStyle(0x7a7068, 1);
      g.fillRect(2, 3, 8, 6);
      g.fillRect(3, 2, 6, 8);
      g.fillRect(1, 4, 10, 4);
      // Highlight facet
      g.fillStyle(0x9a9088, 0.8);
      g.fillRect(2, 2, 4, 4);
      g.fillRect(1, 4, 3, 2);
      // Shadow facet
      g.fillStyle(0x4a4840, 0.6);
      g.fillRect(7, 6, 3, 3);
      g.fillRect(8, 5, 2, 3);
      // Faceted crack
      g.fillStyle(0x4a4840, 0.4);
      g.fillRect(5, 3, 1, 5);
      g.generateTexture('resource_stone', s, s);
      g.destroy();
    }
  }

  // ── Terrain detail textures ───────────────────────────────────────────────

  static generateTerrainTextures(scene) {
    // Tree (with 3-4 shade canopy, trunk wood grain, ground shadow, dark outline)
    {
      const g = scene.add.graphics();
      const s = 16;
      // Ground shadow ellipse
      g.fillStyle(0x1a1a10, 0.25);
      g.fillRect(2, 14, 12, 2);
      // Trunk outline
      g.fillStyle(0x2a1808, 1);
      g.fillRect(5, 9, 6, 7);
      // Trunk base
      g.fillStyle(0x6b4226, 1);
      g.fillRect(6, 10, 4, 6);
      // Trunk wood grain lines
      g.fillStyle(0x5a3418, 0.6);
      g.fillRect(7, 10, 1, 6);
      // Trunk highlight left
      g.fillStyle(0x7b5236, 0.7);
      g.fillRect(6, 10, 1, 5);
      // Trunk shadow right
      g.fillStyle(0x4a2a10, 0.5);
      g.fillRect(9, 10, 1, 6);

      // Canopy dark outline
      g.fillStyle(0x1a3a10, 1);
      g.fillRect(2, 3, 12, 6);
      g.fillRect(3, 1, 10, 3);
      g.fillRect(4, 0, 8, 2);
      // Canopy layer 1 - deep shadow (base)
      g.fillStyle(0x1e4a16, 1);
      g.fillRect(3, 4, 10, 4);
      g.fillRect(4, 2, 8, 3);
      g.fillRect(5, 1, 6, 2);
      // Canopy layer 2 - mid tone
      g.fillStyle(0x2d5a1e, 1);
      g.fillRect(3, 4, 7, 3);
      g.fillRect(4, 2, 5, 3);
      // Canopy layer 3 - highlight (top-left lit)
      g.fillStyle(0x4a8b38, 1);
      g.fillRect(4, 2, 3, 2);
      g.fillRect(3, 4, 3, 2);
      // Canopy layer 4 - specular
      g.fillStyle(0x6aab58, 0.6);
      g.fillRect(5, 1, 2, 1);
      g.fillRect(4, 3, 1, 1);
      g.generateTexture('detail_tree', s, s);
      g.destroy();
    }

    // Pine tree — tiered shading per layer
    {
      const g = scene.add.graphics();
      const s = 16;
      // Ground shadow
      g.fillStyle(0x1a1a10, 0.2);
      g.fillRect(4, 14, 8, 2);
      // Trunk outline
      g.fillStyle(0x2a1808, 1);
      g.fillRect(5, 11, 6, 5);
      // Trunk
      g.fillStyle(0x6b4226, 1);
      g.fillRect(6, 12, 4, 4);
      g.fillStyle(0x7b5236, 0.6);
      g.fillRect(6, 12, 1, 3);

      // Canopy outline
      g.fillStyle(0x0e3008, 1);
      g.fillRect(3, 7, 10, 5);
      g.fillRect(4, 4, 8, 4);
      g.fillRect(5, 1, 6, 4);
      g.fillRect(6, 0, 4, 2);
      // Bottom tier - darkest
      g.fillStyle(0x1e4a16, 1);
      g.fillRect(4, 8, 8, 4);
      g.fillStyle(0x2d6b22, 1);
      g.fillRect(4, 8, 3, 3);  // left highlight
      g.fillStyle(0x163a10, 1);
      g.fillRect(9, 9, 3, 3);  // right shadow
      // Middle tier
      g.fillStyle(0x1e4a16, 1);
      g.fillRect(5, 5, 6, 4);
      g.fillStyle(0x2d6b22, 1);
      g.fillRect(5, 5, 2, 3);
      g.fillStyle(0x163a10, 1);
      g.fillRect(9, 6, 2, 3);
      // Top tier
      g.fillStyle(0x1e4a16, 1);
      g.fillRect(6, 2, 4, 4);
      g.fillStyle(0x2d6b22, 1);
      g.fillRect(6, 2, 2, 3);
      // Tip
      g.fillStyle(0x3a8b2e, 1);
      g.fillRect(7, 1, 1, 1);
      g.generateTexture('detail_tree_pine', s, s);
      g.destroy();
    }

    // Bush — outlined silhouette, 3-tone
    {
      const g = scene.add.graphics();
      const s = 12;
      // Outline
      g.fillStyle(0x1a3a10, 1);
      g.fillRect(1, 3, 10, 7);
      g.fillRect(2, 2, 8, 1);
      g.fillRect(2, 10, 8, 1);
      // Base
      g.fillStyle(0x3a6b28, 1);
      g.fillRect(2, 4, 8, 5);
      g.fillRect(3, 3, 6, 1);
      g.fillRect(3, 9, 6, 1);
      // Highlight (top-left)
      g.fillStyle(0x5a8b48, 0.8);
      g.fillRect(2, 4, 4, 2);
      g.fillRect(3, 3, 3, 1);
      // Shadow (bottom-right)
      g.fillStyle(0x2a4a1a, 0.7);
      g.fillRect(7, 7, 3, 2);
      g.fillRect(6, 8, 3, 1);
      // Stem
      g.fillStyle(0x5a3a1e, 1);
      g.fillRect(5, 10, 2, 2);
      g.generateTexture('detail_bush', s, s);
      g.destroy();
    }

    // Grass — varying blade heights, dark base → light tips
    {
      const g = scene.add.graphics();
      const s = 8;
      // Dark base of blades
      g.fillStyle(0x3a5a28, 1);
      g.fillRect(1, 5, 1, 3);
      g.fillRect(3, 4, 1, 4);
      g.fillRect(5, 6, 1, 2);
      g.fillRect(6, 5, 1, 3);
      // Mid tone
      g.fillStyle(0x5a8b3a, 1);
      g.fillRect(1, 3, 1, 3);
      g.fillRect(3, 2, 1, 3);
      g.fillRect(5, 4, 1, 3);
      g.fillRect(6, 3, 1, 3);
      // Light tips
      g.fillStyle(0x8abb6a, 1);
      g.fillRect(1, 3, 1, 1);
      g.fillRect(3, 2, 1, 1);
      g.fillRect(5, 4, 1, 1);
      g.fillRect(6, 3, 1, 1);
      g.generateTexture('detail_grass', s, s);
      g.destroy();
    }

    // Rock small — faceted shading, crack lines, dark outline
    {
      const g = scene.add.graphics();
      const s = 10;
      // Dark outline
      g.fillStyle(0x3a3830, 1);
      g.fillRect(1, 3, 8, 6);
      g.fillRect(2, 2, 6, 1);
      g.fillRect(2, 9, 6, 1);
      // Base stone
      g.fillStyle(0x7a7068, 1);
      g.fillRect(2, 4, 6, 4);
      g.fillRect(3, 3, 4, 1);
      g.fillRect(3, 8, 4, 1);
      // Highlight facet (top-left)
      g.fillStyle(0x9a9088, 0.8);
      g.fillRect(2, 3, 3, 3);
      // Shadow facet (bottom-right)
      g.fillStyle(0x4a4840, 0.7);
      g.fillRect(6, 5, 2, 3);
      g.fillRect(5, 7, 2, 1);
      // Crack line
      g.fillStyle(0x4a4840, 0.6);
      g.fillRect(4, 4, 1, 3);
      g.generateTexture('detail_rock', s, s);
      g.destroy();
    }

    // Rock large — faceted, crack lines, moss, dark outline
    {
      const g = scene.add.graphics();
      const s = 14;
      // Dark outline
      g.fillStyle(0x3a3830, 1);
      g.fillRect(1, 4, 12, 8);
      g.fillRect(2, 2, 10, 2);
      g.fillRect(2, 12, 10, 1);
      // Base
      g.fillStyle(0x7a7068, 1);
      g.fillRect(2, 5, 10, 6);
      g.fillRect(3, 3, 8, 2);
      g.fillRect(3, 11, 8, 1);
      // Highlight facet (top-left)
      g.fillStyle(0x9a9088, 0.8);
      g.fillRect(2, 3, 5, 4);
      // Specular spot
      g.fillStyle(0xaaa098, 0.5);
      g.fillRect(3, 4, 2, 2);
      // Shadow facet (bottom-right)
      g.fillStyle(0x4a4840, 0.7);
      g.fillRect(9, 6, 3, 4);
      g.fillRect(8, 8, 3, 3);
      // Crack lines
      g.fillStyle(0x4a4840, 0.6);
      g.fillRect(5, 5, 1, 4);
      g.fillRect(7, 7, 1, 3);
      // Moss patches
      g.fillStyle(0x4a6b38, 0.7);
      g.fillRect(3, 8, 3, 2);
      g.fillStyle(0x5a7b48, 0.5);
      g.fillRect(4, 8, 1, 1);
      g.generateTexture('detail_rock_large', s, s);
      g.destroy();
    }

    // Flowers — outlined petals, center highlight, stem gradient
    const flowerColors = [0xcc3333, 0xddaa22, 0x8844aa];
    const flowerDark  = [0x881818, 0x886610, 0x552266];
    const flowerLight = [0xff5555, 0xffcc44, 0xaa66cc];
    for (let i = 0; i < 3; i++) {
      const g = scene.add.graphics();
      const s = 6;
      // Stem gradient (dark base, light top)
      g.fillStyle(0x2a4a18, 1);
      g.fillRect(2, 4, 1, 2);
      g.fillStyle(0x4a7a38, 1);
      g.fillRect(2, 3, 1, 2);
      // Petal outline
      g.fillStyle(flowerDark[i], 1);
      g.fillRect(0, 0, 5, 4);
      // Petals base
      g.fillStyle(flowerColors[i], 1);
      g.fillRect(1, 1, 3, 3);
      // Petal highlight
      g.fillStyle(flowerLight[i], 0.6);
      g.fillRect(1, 1, 1, 1);
      // Center with highlight
      g.fillStyle(0xffdd44, 1);
      g.fillRect(2, 2, 1, 1);
      g.fillStyle(0xffee88, 0.5);
      g.fillRect(2, 2, 1, 1);
      g.generateTexture(`detail_flower_${i}`, s, s);
      g.destroy();
    }

    // Cattail
    {
      const g = scene.add.graphics();
      const w = 8, h = 12;
      // Stem
      g.fillStyle(0x2a4a18, 1);
      g.fillRect(3, 5, 1, 7);
      g.fillStyle(0x4a7a38, 1);
      g.fillRect(3, 3, 1, 4);
      // Cattail head outline
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(1, 0, 5, 5);
      // Head
      g.fillStyle(0x6b4226, 1);
      g.fillRect(2, 1, 3, 4);
      g.fillStyle(0x7b5236, 0.6);
      g.fillRect(2, 1, 1, 3);
      // Leaf
      g.fillStyle(0x5a8a48, 0.8);
      g.fillRect(4, 5, 2, 1);
      g.fillRect(5, 6, 2, 1);
      g.generateTexture('detail_cattail', w, h);
      g.destroy();
    }

    // Mountain peak — sharper light/shadow divide, deeper striations, snow specular
    {
      const g = scene.add.graphics();
      const s = 16;
      // Mountain outline
      g.fillStyle(0x2a2820, 1);
      g.fillRect(1, 9, 14, 7);
      g.fillRect(2, 6, 12, 3);
      g.fillRect(3, 4, 10, 2);
      g.fillRect(4, 2, 8, 2);
      g.fillRect(5, 0, 6, 2);
      g.fillRect(6, 0, 4, 1);
      // Left face (lit)
      g.fillStyle(0x7b7167, 1);
      g.fillRect(2, 10, 6, 6);
      g.fillRect(3, 7, 5, 3);
      g.fillRect(4, 5, 4, 2);
      g.fillRect(5, 3, 3, 2);
      g.fillRect(6, 1, 2, 2);
      // Right face (shadow) — sharp divide
      g.fillStyle(0x4a4a3a, 1);
      g.fillRect(8, 10, 6, 6);
      g.fillRect(8, 7, 5, 3);
      g.fillRect(8, 5, 4, 2);
      g.fillRect(8, 3, 3, 2);
      // Highlight on left face
      g.fillStyle(0x8a8078, 0.6);
      g.fillRect(3, 8, 3, 4);
      g.fillRect(5, 5, 2, 3);
      // Deep striations
      g.fillStyle(0x3a3830, 0.5);
      g.fillRect(3, 9, 8, 1);
      g.fillRect(4, 12, 6, 1);
      g.fillRect(5, 6, 4, 1);
      // Snow cap base
      g.fillStyle(0xe8e0d0, 1);
      g.fillRect(6, 1, 4, 2);
      g.fillRect(7, 0, 2, 1);
      // Snow specular
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(6, 1, 2, 1);
      g.fillRect(7, 0, 1, 1);
      // Snow shadow
      g.fillStyle(0xc8c0b0, 0.5);
      g.fillRect(9, 2, 1, 1);
      g.generateTexture('detail_mountain', s, s);
      g.destroy();
    }

    // House — mortar lines, roof tiles, window cross-panes, door planks, eave shadow
    {
      const g = scene.add.graphics();
      const s = 16;
      // Ground shadow strip
      g.fillStyle(0x1a1a10, 0.2);
      g.fillRect(2, 14, 12, 2);
      // Wall outline
      g.fillStyle(0x3a2810, 1);
      g.fillRect(2, 6, 12, 10);
      // Walls
      g.fillStyle(0x8b5e3c, 1);
      g.fillRect(3, 7, 10, 8);
      // Mortar lines
      g.fillStyle(0x6b4226, 0.4);
      g.fillRect(3, 10, 10, 1);
      g.fillRect(7, 7, 1, 8);
      // Wall highlight (left)
      g.fillStyle(0x9b6e4c, 0.5);
      g.fillRect(3, 7, 3, 7);
      // Wall shadow (right)
      g.fillStyle(0x6b3e2c, 0.4);
      g.fillRect(10, 7, 3, 7);
      // Eave shadow
      g.fillStyle(0x3a2010, 0.5);
      g.fillRect(3, 7, 10, 1);
      // Roof outline
      g.fillStyle(0x3a1a0a, 1);
      g.fillRect(1, 4, 14, 4);
      g.fillRect(2, 2, 12, 2);
      g.fillRect(4, 1, 8, 1);
      // Roof base
      g.fillStyle(0x6b3a2a, 1);
      g.fillRect(2, 5, 12, 3);
      g.fillRect(3, 3, 10, 2);
      g.fillRect(5, 2, 6, 1);
      // Roof tile lines
      g.fillStyle(0x5a2a1a, 0.4);
      g.fillRect(2, 6, 12, 1);
      // Roof highlight
      g.fillStyle(0x8b4a3a, 0.5);
      g.fillRect(3, 3, 5, 2);
      // Chimney
      g.fillStyle(0x4a3a2a, 1);
      g.fillRect(10, 1, 2, 4);
      g.fillStyle(0x5a4a3a, 0.6);
      g.fillRect(10, 1, 1, 3);
      // Door with plank lines
      g.fillStyle(0x3a1a0a, 1);
      g.fillRect(6, 10, 4, 5);
      g.fillStyle(0x4a2a1a, 1);
      g.fillRect(6, 10, 3, 5);
      g.fillStyle(0x3a1a0a, 0.3);
      g.fillRect(7, 10, 1, 5);
      // Windows with cross-panes
      g.fillStyle(0xddcc66, 0.8);
      g.fillRect(4, 8, 2, 2);
      g.fillRect(10, 8, 2, 2);
      g.fillStyle(0x4a2a1a, 0.6);
      g.fillRect(5, 8, 1, 2);   // cross pane
      g.fillRect(4, 9, 2, 1);
      g.fillStyle(0x4a2a1a, 0.6);
      g.fillRect(11, 8, 1, 2);
      g.fillRect(10, 9, 2, 1);
      // Window glow
      g.fillStyle(0xffee88, 0.2);
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

    // Inn building — brick chimney, enhanced smoke, sign wood grain
    {
      const g = scene.add.graphics();
      const s = 48;
      // Ground shadow
      g.fillStyle(0x1a1a10, 0.2);
      g.fillRect(2, 42, 44, 4);
      // Wall outline
      g.fillStyle(0x3a2810, 1);
      g.fillRect(3, 13, 42, 32);
      // Walls
      g.fillStyle(0x8b6b4a, 1);
      g.fillRect(4, 14, 40, 30);
      // Wall left highlight
      g.fillStyle(0x9b7b5a, 0.4);
      g.fillRect(4, 14, 14, 28);
      // Wall right shadow
      g.fillStyle(0x6b4b3a, 0.3);
      g.fillRect(32, 14, 12, 28);
      // Mortar lines
      g.fillStyle(0x6b4b3a, 0.3);
      g.fillRect(4, 22, 40, 1);
      g.fillRect(4, 30, 40, 1);
      g.fillRect(4, 38, 40, 1);
      // Eave shadow
      g.fillStyle(0x3a2010, 0.5);
      g.fillRect(4, 14, 40, 2);
      // Roof outline
      g.fillStyle(0x3a1a0a, 1);
      g.fillRect(1, 7, 46, 9);
      g.fillRect(5, 3, 38, 6);
      g.fillRect(9, 1, 30, 4);
      // Roof base
      g.fillStyle(0x6b3a2a, 1);
      g.fillRect(2, 8, 44, 8);
      g.fillRect(6, 4, 36, 6);
      g.fillRect(10, 2, 28, 4);
      // Roof tile pattern
      g.fillStyle(0x5a2a1a, 0.3);
      g.fillRect(2, 10, 44, 1);
      g.fillRect(2, 13, 44, 1);
      g.fillRect(6, 6, 36, 1);
      // Roof highlight
      g.fillStyle(0x8b4a3a, 0.4);
      g.fillRect(6, 4, 16, 4);
      g.fillRect(10, 2, 10, 2);
      // Brick chimney pattern
      g.fillStyle(0x4a3a2a, 1);
      g.fillRect(34, 0, 6, 8);
      g.fillStyle(0x5a4a3a, 0.6);
      g.fillRect(34, 0, 3, 7);
      g.fillStyle(0x3a2a1a, 0.4);
      g.fillRect(34, 2, 6, 1);
      g.fillRect(34, 5, 6, 1);
      // Enhanced smoke puffs
      g.fillStyle(0xbbbbbb, 0.35);
      g.fillRect(35, -3, 4, 3);
      g.fillStyle(0xcccccc, 0.2);
      g.fillRect(34, -5, 3, 2);
      g.fillRect(37, -4, 2, 2);
      // Door with plank lines
      g.fillStyle(0x3a1a0a, 1);
      g.fillRect(17, 27, 14, 17);
      g.fillStyle(0x4a2a1a, 1);
      g.fillRect(18, 28, 12, 16);
      g.fillStyle(0x3a1a0a, 0.3);
      g.fillRect(21, 28, 1, 16);
      g.fillRect(25, 28, 1, 16);
      // Door handle
      g.fillStyle(0xc8a870, 0.8);
      g.fillRect(27, 35, 2, 2);
      // Windows with cross-panes
      g.fillStyle(0xddaa55, 1);
      g.fillRect(6, 20, 8, 6);
      g.fillRect(34, 20, 8, 6);
      g.fillStyle(0x4a2a1a, 0.5);
      g.fillRect(10, 20, 1, 6);
      g.fillRect(6, 23, 8, 1);
      g.fillRect(38, 20, 1, 6);
      g.fillRect(34, 23, 8, 1);
      // Window glow
      g.fillStyle(0xffee88, 0.2);
      g.fillRect(5, 19, 10, 8);
      g.fillRect(33, 19, 10, 8);
      // Sign with wood grain
      g.fillStyle(0x5a3a20, 1);
      g.fillRect(13, 11, 22, 8);
      g.fillStyle(0xc8a870, 1);
      g.fillRect(14, 12, 20, 6);
      g.fillStyle(0xb89860, 0.3);
      g.fillRect(14, 14, 20, 1);
      // "INN" text
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

    // Shop building — display window items, awning detail
    {
      const g = scene.add.graphics();
      const s = 48;
      // Ground shadow
      g.fillStyle(0x1a1a10, 0.2);
      g.fillRect(2, 42, 44, 4);
      // Wall outline
      g.fillStyle(0x3a3028, 1);
      g.fillRect(3, 13, 42, 32);
      // Walls
      g.fillStyle(0x7a6b5a, 1);
      g.fillRect(4, 14, 40, 30);
      // Wall highlight left
      g.fillStyle(0x8a7b6a, 0.4);
      g.fillRect(4, 14, 14, 28);
      // Wall shadow right
      g.fillStyle(0x5a4b3a, 0.3);
      g.fillRect(32, 14, 12, 28);
      // Mortar
      g.fillStyle(0x5a4b3a, 0.3);
      g.fillRect(4, 22, 40, 1);
      g.fillRect(4, 30, 40, 1);
      // Eave shadow
      g.fillStyle(0x3a3020, 0.5);
      g.fillRect(4, 14, 40, 2);
      // Roof outline
      g.fillStyle(0x2a3a1a, 1);
      g.fillRect(1, 7, 46, 9);
      g.fillRect(5, 3, 38, 6);
      g.fillRect(9, 1, 30, 4);
      // Roof
      g.fillStyle(0x4a6a3a, 1);
      g.fillRect(2, 8, 44, 8);
      g.fillRect(6, 4, 36, 6);
      g.fillRect(10, 2, 28, 4);
      // Roof tile lines
      g.fillStyle(0x3a5a2a, 0.3);
      g.fillRect(2, 10, 44, 1);
      g.fillRect(6, 6, 36, 1);
      // Roof highlight
      g.fillStyle(0x5a8a4a, 0.4);
      g.fillRect(6, 4, 16, 4);
      // Door
      g.fillStyle(0x3a1a0a, 1);
      g.fillRect(17, 27, 14, 17);
      g.fillStyle(0x4a2a1a, 1);
      g.fillRect(18, 28, 12, 16);
      g.fillStyle(0x3a1a0a, 0.3);
      g.fillRect(21, 28, 1, 16);
      g.fillRect(25, 28, 1, 16);
      // Display windows with items inside
      g.fillStyle(0x4a5a6a, 1);
      g.fillRect(5, 17, 12, 10);
      g.fillStyle(0x88ccee, 1);
      g.fillRect(6, 18, 10, 8);
      g.fillStyle(0x4a5a6a, 0.4);
      g.fillRect(11, 18, 1, 8);  // cross pane
      g.fillRect(6, 22, 10, 1);
      // Display items (tiny colored squares)
      g.fillStyle(0xffd700, 0.6);
      g.fillRect(8, 20, 2, 2);
      g.fillStyle(0xcc3333, 0.6);
      g.fillRect(13, 19, 2, 2);
      // Right window
      g.fillStyle(0x4a5a6a, 1);
      g.fillRect(31, 17, 12, 10);
      g.fillStyle(0x88ccee, 1);
      g.fillRect(32, 18, 10, 8);
      g.fillStyle(0x4a5a6a, 0.4);
      g.fillRect(37, 18, 1, 8);
      g.fillRect(32, 22, 10, 1);
      // Display items
      g.fillStyle(0x50c878, 0.6);
      g.fillRect(34, 20, 2, 2);
      // Hanging sign with bracket
      g.fillStyle(0x3a2a1a, 1);
      g.fillRect(0, 10, 2, 12);
      g.fillRect(0, 10, 10, 2);
      g.fillStyle(0x5a3a20, 1);
      g.fillRect(1, 11, 9, 1);
      g.fillStyle(0xc8a870, 1);
      g.fillRect(2, 12, 8, 8);
      g.fillStyle(0xb89860, 0.3);
      g.fillRect(2, 15, 8, 1);
      g.generateTexture('detail_shop', s, s);
      g.destroy();
    }

    // Blacksmith — graduated forge glow, metallic anvil, soot smoke
    {
      const g = scene.add.graphics();
      const s = 48;
      // Ground shadow
      g.fillStyle(0x1a1a10, 0.2);
      g.fillRect(2, 42, 44, 4);
      // Wall outline
      g.fillStyle(0x2a2a2a, 1);
      g.fillRect(3, 13, 42, 32);
      // Walls
      g.fillStyle(0x5a5a5a, 1);
      g.fillRect(4, 14, 40, 30);
      // Wall left highlight
      g.fillStyle(0x6a6a6a, 0.4);
      g.fillRect(4, 14, 14, 28);
      // Wall right shadow
      g.fillStyle(0x3a3a3a, 0.3);
      g.fillRect(32, 14, 12, 28);
      // Mortar lines
      g.fillStyle(0x3a3a3a, 0.3);
      g.fillRect(4, 22, 40, 1);
      g.fillRect(4, 30, 40, 1);
      // Eave shadow
      g.fillStyle(0x2a2a2a, 0.5);
      g.fillRect(4, 14, 40, 2);
      // Roof outline
      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(1, 7, 46, 9);
      g.fillRect(5, 3, 38, 6);
      g.fillRect(9, 1, 30, 4);
      // Roof
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(2, 8, 44, 8);
      g.fillRect(6, 4, 36, 6);
      g.fillRect(10, 2, 28, 4);
      // Roof highlight
      g.fillStyle(0x4a4a4a, 0.4);
      g.fillRect(6, 4, 16, 4);
      // Graduated forge glow (bright center fading outward)
      g.fillStyle(0xff2200, 0.3);
      g.fillRect(12, 26, 24, 18);
      g.fillStyle(0xff4400, 0.4);
      g.fillRect(14, 28, 20, 16);
      g.fillStyle(0xff6622, 0.6);
      g.fillRect(16, 30, 16, 12);
      g.fillStyle(0xff8844, 0.5);
      g.fillRect(18, 32, 12, 8);
      g.fillStyle(0xffaa66, 0.3);
      g.fillRect(20, 34, 8, 4);
      // Metallic anvil with shading
      g.fillStyle(0x2a2a2a, 1);
      g.fillRect(35, 35, 10, 6);
      g.fillRect(37, 31, 6, 4);
      g.fillStyle(0x444444, 1);
      g.fillRect(36, 36, 8, 4);
      g.fillRect(38, 32, 4, 4);
      // Anvil highlight
      g.fillStyle(0x666666, 0.6);
      g.fillRect(38, 32, 2, 2);
      g.fillRect(36, 36, 3, 1);
      // Anvil specular
      g.fillStyle(0x888888, 0.4);
      g.fillRect(38, 32, 1, 1);
      // Chimney with soot
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(5, -1, 10, 9);
      g.fillStyle(0x4a4a4a, 1);
      g.fillRect(6, 0, 8, 8);
      g.fillStyle(0x5a5a5a, 0.5);
      g.fillRect(6, 0, 3, 7);
      // Soot smoke (darker than inn's)
      g.fillStyle(0x666666, 0.4);
      g.fillRect(7, -3, 6, 3);
      g.fillStyle(0x777777, 0.25);
      g.fillRect(8, -5, 4, 2);
      g.fillStyle(0x888888, 0.15);
      g.fillRect(6, -6, 3, 2);
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

    // NPC (humanoid figure - same 3-tone cel-shading as player)
    {
      const g = scene.add.graphics();
      const s = 24;
      const cx = s / 2, cy = s / 2;
      // Outline silhouette
      g.fillStyle(SHADE.OUTLINE, 1);
      g.fillRect(cx - 4, cy - 9, 8, 7);
      g.fillRect(cx - 5, cy - 5, 10, 12);
      g.fillRect(cx - 4, cy + 5, 3, 6);
      g.fillRect(cx + 0, cy + 5, 3, 6);
      // Head
      g.fillStyle(SHADE.BASE, 1);
      g.fillRect(cx - 3, cy - 8, 6, 5);
      g.fillStyle(SHADE.HIGHLIGHT, 1);
      g.fillRect(cx - 3, cy - 8, 3, 3);
      g.fillStyle(SHADE.SHADOW, 1);
      g.fillRect(cx + 1, cy - 6, 2, 3);
      // Eyes
      g.fillStyle(SHADE.DEEP, 1);
      g.fillRect(cx - 2, cy - 6, 1, 1);
      g.fillRect(cx + 1, cy - 6, 1, 1);
      // Torso 3-column lighting
      g.fillStyle(SHADE.BASE, 1);
      g.fillRect(cx - 4, cy - 4, 8, 10);
      g.fillStyle(SHADE.HIGHLIGHT, 1);
      g.fillRect(cx - 4, cy - 4, 3, 8);
      g.fillStyle(SHADE.SHADOW, 1);
      g.fillRect(cx + 1, cy - 4, 3, 8);
      g.fillStyle(SHADE.DEEP, 1);
      g.fillRect(cx - 4, cy + 4, 8, 2);
      // Belt
      g.fillStyle(SHADE.OUTLINE, 1);
      g.fillRect(cx - 4, cy + 2, 8, 1);
      // Arms
      g.fillStyle(SHADE.HIGHLIGHT, 1);
      g.fillRect(cx - 6, cy - 3, 2, 6);
      g.fillStyle(SHADE.SHADOW, 1);
      g.fillRect(cx + 4, cy - 3, 2, 6);
      // Legs
      g.fillStyle(SHADE.BASE, 1);
      g.fillRect(cx - 3, cy + 6, 2, 4);
      g.fillRect(cx + 1, cy + 6, 2, 4);
      g.fillStyle(SHADE.HIGHLIGHT, 1);
      g.fillRect(cx - 3, cy + 6, 1, 3);
      g.fillStyle(SHADE.SHADOW, 1);
      g.fillRect(cx + 2, cy + 6, 1, 3);
      g.generateTexture('detail_npc', s, s);
      g.destroy();
    }
  }

  // ── Item icon textures (24x24) ──────────────────────────────────────────

  static _generateItemIcons(scene) {
    const s = 24;

    // Sword icon — outlined with metallic shading
    {
      const g = scene.add.graphics();
      // Blade outline
      g.fillStyle(0x3a4a5a, 1);
      g.fillRect(10, 1, 4, 18);
      // Blade body
      g.fillStyle(0xb0c4de, 1);
      g.fillRect(11, 2, 2, 16);
      // Blade highlight (left edge)
      g.fillStyle(0xddeeff, 0.7);
      g.fillRect(11, 2, 1, 14);
      // Blade shadow (right edge)
      g.fillStyle(0x7a8a9a, 0.5);
      g.fillRect(12, 3, 1, 13);
      // Blade tip specular
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(11, 2, 1, 2);
      // Crossguard outline
      g.fillStyle(0x4a3220, 1);
      g.fillRect(7, 16, 10, 3);
      g.fillStyle(0x8b7355, 1);
      g.fillRect(8, 17, 8, 2);
      g.fillStyle(0xa08060, 0.4);
      g.fillRect(8, 17, 4, 1);
      // Grip outline
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(9, 18, 6, 5);
      g.fillStyle(0x6b4226, 1);
      g.fillRect(10, 19, 4, 4);
      g.fillStyle(0x7b5236, 0.5);
      g.fillRect(10, 19, 2, 3);
      g.generateTexture('item_icon_sword', s, s);
      g.destroy();
    }

    // Axe icon — outlined with metallic shading
    {
      const g = scene.add.graphics();
      // Handle outline
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(10, 5, 4, 18);
      g.fillStyle(0x6b4226, 1);
      g.fillRect(11, 6, 2, 16);
      g.fillStyle(0x7b5236, 0.5);
      g.fillRect(11, 6, 1, 14);
      // Axe head outline
      g.fillStyle(0x5a3a1a, 1);
      g.fillRect(5, 1, 10, 10);
      g.fillStyle(0xcd853f, 1);
      g.fillRect(6, 2, 8, 8);
      g.fillStyle(0xe8a860, 0.5);
      g.fillRect(6, 2, 4, 6);
      g.fillStyle(0x9a6530, 0.4);
      g.fillRect(11, 5, 3, 5);
      // Blade edge metallic
      g.fillStyle(0x888888, 1);
      g.fillRect(13, 3, 2, 6);
      g.fillStyle(0xaaaaaa, 0.5);
      g.fillRect(13, 3, 1, 5);
      g.generateTexture('item_icon_axe', s, s);
      g.destroy();
    }

    // Spear icon — outlined
    {
      const g = scene.add.graphics();
      // Shaft outline
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(10, 7, 4, 16);
      g.fillStyle(0x6b4226, 1);
      g.fillRect(11, 8, 2, 14);
      g.fillStyle(0x7b5236, 0.5);
      g.fillRect(11, 8, 1, 12);
      // Spearhead outline
      g.fillStyle(0x0a4a0a, 1);
      g.fillRect(9, 1, 6, 9);
      g.fillStyle(0x228b22, 1);
      g.fillRect(10, 2, 4, 8);
      g.fillStyle(0x44bb44, 0.5);
      g.fillRect(10, 2, 2, 6);
      g.fillStyle(0x165a16, 0.4);
      g.fillRect(13, 4, 1, 5);
      g.generateTexture('item_icon_spear', s, s);
      g.destroy();
    }

    // Health potion icon — glass reflection
    {
      const g = scene.add.graphics();
      // Bottle outline
      g.fillStyle(0x4a2020, 1);
      g.fillRect(6, 7, 12, 14);
      g.fillRect(8, 5, 8, 3);
      // Bottle body
      g.fillStyle(0xcc3333, 1);
      g.fillRect(7, 8, 10, 12);
      // Liquid shadow (right)
      g.fillStyle(0x881818, 0.4);
      g.fillRect(13, 9, 4, 10);
      // Liquid highlight (left)
      g.fillStyle(0xff5555, 0.5);
      g.fillRect(8, 9, 4, 8);
      // Glass reflection (specular)
      g.fillStyle(0xffffff, 0.4);
      g.fillRect(9, 10, 1, 4);
      g.fillStyle(0xffffff, 0.2);
      g.fillRect(10, 10, 1, 2);
      // Neck
      g.fillStyle(0x886666, 1);
      g.fillRect(9, 6, 6, 2);
      // Cork outline + body
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(7, 4, 10, 3);
      g.fillStyle(0x6b4226, 1);
      g.fillRect(8, 5, 8, 2);
      g.fillStyle(0x7b5236, 0.5);
      g.fillRect(8, 5, 4, 1);
      g.generateTexture('item_icon_potion', s, s);
      g.destroy();
    }

    // Pickaxe icon — outlined
    {
      const g = scene.add.graphics();
      // Handle outline
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(5, 9, 16, 3);
      g.fillRect(7, 11, 4, 10);
      g.fillStyle(0x6b4226, 1);
      g.fillRect(6, 10, 14, 2);
      g.fillRect(8, 12, 2, 8);
      g.fillStyle(0x7b5236, 0.4);
      g.fillRect(6, 10, 12, 1);
      // Pick head outline
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(3, 3, 12, 6);
      g.fillRect(2, 5, 3, 5);
      g.fillRect(11, 5, 3, 5);
      // Pick head
      g.fillStyle(0x888888, 1);
      g.fillRect(4, 4, 10, 4);
      g.fillRect(3, 6, 3, 4);
      g.fillRect(12, 6, 3, 4);
      g.fillStyle(0xaaaaaa, 0.5);
      g.fillRect(4, 4, 5, 2);
      g.fillStyle(0x555555, 0.4);
      g.fillRect(9, 6, 4, 2);
      g.generateTexture('item_icon_pickaxe', s, s);
      g.destroy();
    }

    // Torch icon — enhanced flame
    {
      const g = scene.add.graphics();
      // Handle outline
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(9, 9, 6, 14);
      g.fillStyle(0x6b4226, 1);
      g.fillRect(10, 10, 4, 12);
      g.fillStyle(0x7b5236, 0.4);
      g.fillRect(10, 10, 2, 10);
      // Flame outer glow
      g.fillStyle(0xff4400, 0.2);
      g.fillRect(7, 1, 10, 10);
      // Flame base
      g.fillStyle(0xff6600, 1);
      g.fillRect(9, 4, 6, 8);
      // Flame core
      g.fillStyle(0xffaa00, 1);
      g.fillRect(10, 2, 4, 6);
      // Flame bright
      g.fillStyle(0xffcc00, 1);
      g.fillRect(10, 3, 4, 4);
      // Flame tip
      g.fillStyle(0xffee66, 0.8);
      g.fillRect(11, 1, 2, 3);
      g.generateTexture('item_icon_torch', s, s);
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

    // Unit animations (soldiers + villagers)
    const soldierNames = Object.keys(SOLDIER_TYPES);
    const villagerNames = Object.keys(VILLAGER_TYPES);
    const unitNames = [...soldierNames, ...villagerNames];
    for (const name of unitNames) {
      scene.anims.create({
        key: `unit_${name}_idle`,
        frames: [0, 1].map(f => ({ key: `unit_${name}_idle_${f}` })),
        frameRate: 3,
        repeat: -1,
      });
      scene.anims.create({
        key: `unit_${name}_move`,
        frames: [0, 1].map(f => ({ key: `unit_${name}_move_${f}` })),
        frameRate: 6,
        repeat: -1,
      });
    }
  }

  // ── Unit textures (soldiers + villagers) ──────────────────────────────────

  static generateUnitTextures(scene) {
    // Soldiers
    const soldierDrawers = {
      Pawn: SpriteFactory._drawPawnUnit,
      Archer: SpriteFactory._drawArcherUnit,
      WhiteKnight: SpriteFactory._drawWhiteKnightUnit,
      Barbarian: SpriteFactory._drawBarbarianUnit,
      BlackKnight: SpriteFactory._drawBlackKnightUnit,
    };

    for (const [name, config] of Object.entries(SOLDIER_TYPES)) {
      const drawer = soldierDrawers[name];
      for (const state of ['idle', 'move']) {
        for (let f = 0; f < 2; f++) {
          const key = `unit_${name}_idle_${f}`;
          const moveKey = `unit_${name}_move_${f}`;
          const g = scene.add.graphics();
          drawer(g, config.size, state, f);
          if (state === 'idle') {
            g.generateTexture(key, config.size, config.size);
          } else {
            g.generateTexture(moveKey, config.size, config.size);
          }
          g.destroy();
        }
      }
    }

    // Villagers
    const villagerDrawers = {
      Farmer: SpriteFactory._drawFarmerUnit,
      Builder: SpriteFactory._drawBuilderUnit,
      Miner: SpriteFactory._drawMinerUnit,
      Lumberjack: SpriteFactory._drawLumberjackUnit,
    };

    for (const [name, config] of Object.entries(VILLAGER_TYPES)) {
      const drawer = villagerDrawers[name];
      for (const state of ['idle', 'move']) {
        for (let f = 0; f < 2; f++) {
          const key = `unit_${name}_idle_${f}`;
          const moveKey = `unit_${name}_move_${f}`;
          const g = scene.add.graphics();
          drawer(g, config.size, state, f);
          if (state === 'idle') {
            g.generateTexture(key, config.size, config.size);
          } else {
            g.generateTexture(moveKey, config.size, config.size);
          }
          g.destroy();
        }
      }
    }

    // Selection circle texture
    const sg = scene.add.graphics();
    sg.lineStyle(1, 0xffffff, 0.8);
    sg.strokeCircle(12, 12, 10);
    sg.generateTexture('unit_selection_circle', 24, 24);
    sg.destroy();

    // Arrow projectile
    const ag = scene.add.graphics();
    ag.fillStyle(SHADE.BASE, 1);
    ag.fillRect(0, 2, 8, 2);
    ag.fillStyle(SHADE.HIGHLIGHT, 1);
    ag.fillRect(6, 1, 2, 4);
    ag.generateTexture('unit_arrow', 8, 6);
    ag.destroy();
  }

  // --- Soldier sprite drawers ---

  static _drawPawnUnit(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;
    // Outline
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 3, cy - 7, 6, 5);
    g.fillRect(cx - 4, cy - 3, 8, 7);
    // Head
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy - 6, 4, 4);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 2, cy - 6, 2, 2);
    // Helmet
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 3, cy - 7, 6, 2);
    // Body
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 3, cy - 2, 6, 5);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy - 2, 3, 4);
    // Legs
    const legOff = state === 'move' ? (frame === 0 ? 1 : -1) : 0;
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 3, cy + 3, 2, 3 + legOff);
    g.fillRect(cx + 1, cy + 3, 2, 3 - legOff);
    // Short sword (right side)
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx + 4, cy - 3, 2, 6);
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx + 4, cy - 3, 1, 4);
    // Banner (small green pennant on back)
    g.fillStyle(0x44aa44, 1);
    g.fillRect(cx - 4, cy - 6, 2, 3);
  }

  static _drawArcherUnit(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 3, cy - 7, 6, 5);
    g.fillRect(cx - 4, cy - 3, 8, 7);
    // Head with hood
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy - 6, 4, 4);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 2, cy - 7, 4, 2);
    // Body
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 3, cy - 2, 6, 5);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy - 2, 3, 3);
    // Legs
    const legOff = state === 'move' ? (frame === 0 ? 1 : -1) : 0;
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy + 3, 2, 3 + legOff);
    g.fillRect(cx + 1, cy + 3, 2, 3 - legOff);
    // Bow
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 4, cy - 5, 1, 8);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx + 5, cy - 3, 1, 4);
    // Banner
    g.fillStyle(0x44aa44, 1);
    g.fillRect(cx - 4, cy - 6, 2, 3);
  }

  static _drawWhiteKnightUnit(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 4, cy - 8, 8, 6);
    g.fillRect(cx - 5, cy - 3, 10, 8);
    // Helm
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx - 3, cy - 7, 6, 5);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy - 7, 3, 3);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 1, cy - 4, 4, 1);
    // Visor slit
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 1, cy - 5, 3, 1);
    // Body (armored)
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 4, cy - 2, 8, 6);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 4, cy - 2, 4, 4);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 1, cy + 1, 3, 3);
    // Shield (left)
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 6, cy - 2, 3, 5);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 6, cy - 2, 2, 3);
    // Longsword (right)
    g.fillStyle(SHADE.SPECULAR, 1);
    g.fillRect(cx + 5, cy - 5, 2, 8);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx + 5, cy - 5, 1, 6);
    // Legs
    const legOff = state === 'move' ? (frame === 0 ? 1 : -1) : 0;
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 3, cy + 4, 2, 3 + legOff);
    g.fillRect(cx + 1, cy + 4, 2, 3 - legOff);
    // Banner
    g.fillStyle(0x44aa44, 1);
    g.fillRect(cx - 5, cy - 7, 2, 4);
  }

  static _drawBarbarianUnit(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 4, cy - 8, 8, 6);
    g.fillRect(cx - 5, cy - 3, 10, 9);
    // Head (wild hair)
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 3, cy - 7, 6, 5);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 4, cy - 8, 8, 2);
    g.fillRect(cx - 4, cy - 7, 1, 3);
    g.fillRect(cx + 3, cy - 7, 1, 3);
    // Body (muscular)
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 4, cy - 2, 8, 7);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 4, cy - 2, 4, 4);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 1, cy + 2, 3, 3);
    // Two-handed axe (right)
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 5, cy - 6, 2, 10);
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx + 6, cy - 4, 3, 4);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx + 6, cy - 4, 2, 2);
    // Legs
    const legOff = state === 'move' ? (frame === 0 ? 2 : -1) : 0;
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 3, cy + 5, 3, 3 + legOff);
    g.fillRect(cx + 1, cy + 5, 3, 3 - legOff);
    // Banner
    g.fillStyle(0x44aa44, 1);
    g.fillRect(cx - 5, cy - 7, 2, 4);
  }

  static _drawBlackKnightUnit(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 4, cy - 9, 8, 6);
    g.fillRect(cx - 5, cy - 4, 10, 9);
    // Dark helm
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 3, cy - 8, 6, 5);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 3, cy - 8, 3, 3);
    // Visor (red glow)
    g.fillStyle(0xff4444, 1);
    g.fillRect(cx - 1, cy - 6, 3, 1);
    // Cape (flowing behind)
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx - 5, cy - 4, 2, 8 + (frame === 1 ? 1 : 0));
    g.fillStyle(SHADE.SHADOW, 0.5);
    g.fillRect(cx - 5, cy - 4, 1, 6);
    // Body (heavy armor)
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 4, cy - 3, 8, 7);
    g.fillStyle(SHADE.BASE, 0.5);
    g.fillRect(cx - 4, cy - 3, 4, 4);
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx + 1, cy + 1, 3, 3);
    // Dark sword
    g.fillStyle(SHADE.DEEP, 1);
    g.fillRect(cx + 5, cy - 7, 2, 10);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 5, cy - 7, 1, 8);
    g.fillStyle(0xff4444, 0.5);
    g.fillRect(cx + 5, cy - 7, 2, 1);
    // Legs
    const legOff = state === 'move' ? (frame === 0 ? 1 : -1) : 0;
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 3, cy + 4, 2, 4 + legOff);
    g.fillRect(cx + 1, cy + 4, 2, 4 - legOff);
    // Banner (dark red)
    g.fillStyle(0xaa2222, 1);
    g.fillRect(cx - 6, cy - 8, 2, 4);
  }

  // --- Villager sprite drawers ---

  static _drawFarmerUnit(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 3, cy - 6, 6, 4);
    g.fillRect(cx - 3, cy - 3, 6, 6);
    // Head (straw hat)
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy - 5, 4, 3);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy - 6, 6, 2);
    // Body
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy - 2, 4, 4);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 2, cy - 2, 2, 3);
    // Legs
    const legOff = state === 'move' ? (frame === 0 ? 1 : -1) : 0;
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy + 2, 2, 3 + legOff);
    g.fillRect(cx + 1, cy + 2, 2, 3 - legOff);
    // Hoe
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 3, cy - 4, 1, 6);
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx + 3, cy - 4, 3, 1);
    // Banner
    g.fillStyle(0x44aa44, 1);
    g.fillRect(cx - 3, cy - 5, 1, 3);
  }

  static _drawBuilderUnit(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 3, cy - 6, 6, 4);
    g.fillRect(cx - 3, cy - 3, 6, 6);
    // Head
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy - 5, 4, 3);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 2, cy - 5, 2, 2);
    // Body (apron)
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy - 2, 4, 4);
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx - 1, cy - 1, 2, 3);
    // Legs
    const legOff = state === 'move' ? (frame === 0 ? 1 : -1) : 0;
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy + 2, 2, 3 + legOff);
    g.fillRect(cx + 1, cy + 2, 2, 3 - legOff);
    // Hammer
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 3, cy - 3, 1, 5);
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx + 3, cy - 3, 3, 2);
    // Banner
    g.fillStyle(0x44aa44, 1);
    g.fillRect(cx - 3, cy - 5, 1, 3);
  }

  static _drawMinerUnit(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 3, cy - 6, 6, 4);
    g.fillRect(cx - 3, cy - 3, 6, 6);
    // Head (hard hat)
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy - 5, 4, 3);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 3, cy - 6, 6, 1);
    g.fillRect(cx - 2, cy - 5, 2, 1);
    // Body
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy - 2, 4, 4);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 2, cy - 2, 2, 3);
    // Legs
    const legOff = state === 'move' ? (frame === 0 ? 1 : -1) : 0;
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy + 2, 2, 3 + legOff);
    g.fillRect(cx + 1, cy + 2, 2, 3 - legOff);
    // Pickaxe
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 3, cy - 3, 1, 5);
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx + 2, cy - 3, 3, 1);
    g.fillRect(cx + 4, cy - 2, 1, 2);
    // Banner
    g.fillStyle(0x44aa44, 1);
    g.fillRect(cx - 3, cy - 5, 1, 3);
  }

  static _drawLumberjackUnit(g, size, state, frame) {
    const cx = size / 2, cy = size / 2;
    g.fillStyle(SHADE.OUTLINE, 1);
    g.fillRect(cx - 3, cy - 6, 6, 4);
    g.fillRect(cx - 3, cy - 3, 6, 6);
    // Head
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy - 5, 4, 3);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 2, cy - 5, 2, 2);
    // Body
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy - 2, 4, 4);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx - 2, cy - 2, 2, 3);
    // Legs
    const legOff = state === 'move' ? (frame === 0 ? 1 : -1) : 0;
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx - 2, cy + 2, 2, 3 + legOff);
    g.fillRect(cx + 1, cy + 2, 2, 3 - legOff);
    // Axe
    g.fillStyle(SHADE.SHADOW, 1);
    g.fillRect(cx + 3, cy - 3, 1, 6);
    g.fillStyle(SHADE.BASE, 1);
    g.fillRect(cx + 3, cy - 3, 3, 2);
    g.fillStyle(SHADE.HIGHLIGHT, 1);
    g.fillRect(cx + 3, cy - 3, 2, 1);
    // Banner
    g.fillStyle(0x44aa44, 1);
    g.fillRect(cx - 3, cy - 5, 1, 3);
  }

  // ── Camp textures ─────────────────────────────────────────────────────────

  static generateCampTextures(scene) {
    // Tent (24x24) — canvas stripes, shading
    {
      const g = scene.add.graphics();
      const s = 24;
      // Ground shadow
      g.fillStyle(0x1a1a10, 0.2);
      g.fillRect(1, 20, 22, 3);
      // Tent outline
      g.fillStyle(0x3a2810, 1);
      g.fillRect(1, 15, 22, 8);
      g.fillRect(3, 11, 18, 4);
      g.fillRect(5, 7, 14, 4);
      g.fillRect(7, 4, 10, 3);
      g.fillRect(9, 2, 6, 2);
      // Tent body
      g.fillStyle(0x8b6b4a, 1);
      g.fillRect(2, 16, 20, 6);
      g.fillRect(4, 12, 16, 4);
      g.fillRect(6, 8, 12, 4);
      g.fillRect(8, 5, 8, 3);
      g.fillRect(10, 3, 4, 2);
      // Canvas stripe pattern
      g.fillStyle(0x7b5b3a, 0.3);
      g.fillRect(4, 12, 16, 1);
      g.fillRect(6, 9, 12, 1);
      g.fillRect(8, 6, 8, 1);
      // Left highlight
      g.fillStyle(0xa08060, 0.5);
      g.fillRect(2, 16, 6, 5);
      g.fillRect(4, 12, 5, 3);
      g.fillRect(6, 8, 4, 3);
      g.fillRect(8, 5, 3, 3);
      // Right shadow
      g.fillStyle(0x5a3a20, 0.4);
      g.fillRect(14, 16, 8, 5);
      g.fillRect(13, 12, 7, 3);
      g.fillRect(12, 8, 6, 3);
      // Entrance flap
      g.fillStyle(0x4a2a10, 1);
      g.fillRect(9, 14, 6, 8);
      g.fillStyle(0x5c3a1e, 1);
      g.fillRect(9, 14, 5, 7);
      // Pole at peak
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(10, 0, 4, 5);
      g.fillStyle(0x4a2a10, 1);
      g.fillRect(11, 1, 2, 4);
      g.fillStyle(0x5a3a20, 0.5);
      g.fillRect(11, 1, 1, 3);
      g.generateTexture('detail_camp_tent', s, s);
      g.destroy();
    }

    // Campfire (16x16) — ember glow, detailed flames
    {
      const g = scene.add.graphics();
      const s = 16;
      // Ember glow (warm halo)
      g.fillStyle(0xff2200, 0.12);
      g.fillCircle(8, 10, 7);
      g.fillStyle(0xff4400, 0.15);
      g.fillCircle(8, 9, 5);
      // Log outline
      g.fillStyle(0x2a1808, 1);
      g.fillRect(2, 10, 12, 4);
      // Crossed logs
      g.fillStyle(0x6b4226, 1);
      g.fillRect(3, 11, 10, 2);
      g.fillRect(5, 10, 2, 4);
      g.fillRect(9, 10, 2, 4);
      // Log highlight
      g.fillStyle(0x8b5e3c, 0.5);
      g.fillRect(3, 11, 8, 1);
      // Embers (small orange dots at base)
      g.fillStyle(0xff6600, 0.6);
      g.fillRect(4, 10, 1, 1);
      g.fillRect(7, 13, 1, 1);
      g.fillRect(11, 10, 1, 1);
      // Flame outer
      g.fillStyle(0xff4400, 1);
      g.fillRect(4, 6, 8, 5);
      g.fillRect(5, 4, 6, 3);
      // Flame mid
      g.fillStyle(0xff6600, 1);
      g.fillRect(5, 6, 6, 5);
      g.fillRect(6, 4, 4, 3);
      // Flame inner
      g.fillStyle(0xffaa00, 1);
      g.fillRect(6, 5, 4, 4);
      g.fillRect(7, 3, 2, 3);
      // Flame core (brightest)
      g.fillStyle(0xffdd00, 0.9);
      g.fillRect(7, 5, 2, 3);
      // Flame tip
      g.fillStyle(0xffee66, 0.7);
      g.fillRect(7, 3, 2, 2);
      g.fillRect(8, 2, 1, 1);
      g.generateTexture('detail_camp_fire', s, s);
      g.destroy();
    }
  }

  // ── Building textures ─────────────────────────────────────────────────────

  static generateStructureTextures(scene) {
    // Builder's Hall (64x64) — enhanced with shading
    {
      const g = scene.add.graphics();
      // Ground shadow
      g.fillStyle(0x1a1a10, 0.2);
      g.fillRect(2, 58, 60, 4);
      // Wall outline
      g.fillStyle(0x3a3830, 1);
      g.fillRect(3, 19, 58, 42);
      // Stone walls
      g.fillStyle(0x7a7068, 1);
      g.fillRect(4, 20, 56, 40);
      // Wall left highlight
      g.fillStyle(0x8a8078, 0.3);
      g.fillRect(4, 20, 20, 38);
      // Wall right shadow
      g.fillStyle(0x5a5850, 0.2);
      g.fillRect(40, 20, 20, 38);
      // Mortar lines
      g.fillStyle(0x5a5850, 0.3);
      g.fillRect(4, 30, 56, 1);
      g.fillRect(4, 45, 56, 1);
      // Wooden beams
      g.fillStyle(0x5a3418, 1);
      g.fillRect(4, 20, 56, 3);
      g.fillRect(4, 40, 56, 2);
      g.fillRect(4, 20, 3, 40);
      g.fillRect(57, 20, 3, 40);
      g.fillRect(30, 20, 4, 40);
      // Beam highlight
      g.fillStyle(0x6b4226, 0.5);
      g.fillRect(4, 20, 56, 1);
      g.fillRect(4, 20, 1, 40);
      // Roof outline
      g.fillStyle(0x2a1a0a, 1);
      g.fillRect(1, 13, 62, 9);
      g.fillRect(5, 9, 54, 6);
      g.fillRect(9, 5, 46, 6);
      g.fillRect(15, 2, 34, 4);
      // Roof
      g.fillStyle(0x5a3a2a, 1);
      g.fillRect(2, 14, 60, 8);
      g.fillRect(6, 10, 52, 6);
      g.fillRect(10, 6, 44, 6);
      g.fillRect(16, 3, 32, 4);
      // Roof highlight
      g.fillStyle(0x7a4a3a, 0.4);
      g.fillRect(6, 10, 24, 5);
      g.fillRect(10, 6, 18, 4);
      // Chimney
      g.fillStyle(0x4a3a2a, 1);
      g.fillRect(46, 0, 8, 10);
      g.fillStyle(0x5a4a3a, 0.5);
      g.fillRect(46, 0, 3, 9);
      // Smoke
      g.fillStyle(0xaaaaaa, 0.3);
      g.fillRect(47, -3, 6, 4);
      g.fillStyle(0xbbbbbb, 0.2);
      g.fillRect(48, -5, 4, 2);
      // Door
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(25, 41, 14, 19);
      g.fillStyle(0x4a2a1a, 1);
      g.fillRect(26, 42, 12, 18);
      g.fillStyle(0x3a1a08, 0.3);
      g.fillRect(29, 42, 1, 18);
      g.fillRect(33, 42, 1, 18);
      // Planning table with shading
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(11, 49, 12, 8);
      g.fillStyle(0x555555, 1);
      g.fillRect(12, 50, 10, 6);
      g.fillStyle(0x666666, 1);
      g.fillRect(13, 48, 8, 3);
      g.fillStyle(0x777777, 0.4);
      g.fillRect(13, 48, 4, 1);
      // Glowing accent
      g.fillStyle(0xffaa33, 0.6);
      g.fillRect(14, 49, 4, 2);
      // Windows with cross-panes
      g.fillStyle(0xddaa55, 1);
      g.fillRect(8, 28, 8, 6);
      g.fillRect(48, 28, 8, 6);
      g.fillStyle(0x4a2a1a, 0.4);
      g.fillRect(12, 28, 1, 6);
      g.fillRect(8, 31, 8, 1);
      g.fillRect(52, 28, 1, 6);
      g.fillRect(48, 31, 8, 1);
      g.generateTexture('structure_builders_hall', 64, 64);
      g.destroy();
    }

    // Chronicle (48x48) — enhanced obelisk
    {
      const g = scene.add.graphics();
      // Ground shadow
      g.fillStyle(0x1a1a10, 0.2);
      g.fillRect(14, 44, 20, 3);
      // Base outline
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(15, 39, 18, 8);
      g.fillRect(17, 7, 14, 34);
      g.fillRect(19, 3, 10, 6);
      // Base pedestal
      g.fillStyle(0x7a7a7a, 1);
      g.fillRect(16, 40, 16, 6);
      g.fillStyle(0x8a8a8a, 0.4);
      g.fillRect(16, 40, 8, 3);
      // Obelisk body
      g.fillStyle(0x8a8a8a, 1);
      g.fillRect(18, 8, 12, 36);
      // Left highlight
      g.fillStyle(0x9a9a9a, 0.5);
      g.fillRect(18, 8, 5, 30);
      // Right shadow
      g.fillStyle(0x6a6a6a, 0.3);
      g.fillRect(26, 8, 4, 30);
      // Top
      g.fillStyle(0x9a9a9a, 1);
      g.fillRect(20, 4, 8, 6);
      g.fillStyle(0xaaaaaa, 0.4);
      g.fillRect(20, 4, 4, 3);
      // Carved rune details
      g.fillStyle(0x4488cc, 0.7);
      g.fillRect(22, 14, 4, 2);
      g.fillRect(21, 20, 6, 1);
      g.fillRect(22, 26, 4, 2);
      g.fillRect(21, 32, 6, 1);
      // Glowing blue top
      g.fillStyle(0x66aaff, 0.5);
      g.fillRect(21, 5, 6, 3);
      g.fillStyle(0x88ccff, 0.3);
      g.fillRect(22, 4, 4, 1);
      g.generateTexture('structure_chronicle', 48, 48);
      g.destroy();
    }

    // Notice Board (32x32) — enhanced with outline
    {
      const g = scene.add.graphics();
      // Post outlines
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(3, 7, 5, 24);
      g.fillRect(24, 7, 5, 24);
      // Posts
      g.fillStyle(0x6b4226, 1);
      g.fillRect(4, 8, 3, 22);
      g.fillRect(25, 8, 3, 22);
      g.fillStyle(0x7b5236, 0.4);
      g.fillRect(4, 8, 1, 20);
      g.fillRect(25, 8, 1, 20);
      // Board outline
      g.fillStyle(0x3a2810, 1);
      g.fillRect(1, 5, 30, 20);
      // Board
      g.fillStyle(0x8b6b4a, 1);
      g.fillRect(2, 6, 28, 18);
      // Board highlight
      g.fillStyle(0x9b7b5a, 0.3);
      g.fillRect(2, 6, 14, 8);
      // Board shadow
      g.fillStyle(0x6b4b3a, 0.2);
      g.fillRect(18, 14, 12, 10);
      // Papers with slight shadow
      g.fillStyle(0xd4c4a1, 0.5);
      g.fillRect(6, 10, 8, 6);
      g.fillRect(16, 10, 8, 6);
      g.fillStyle(0xf4e4c1, 0.9);
      g.fillRect(5, 9, 8, 6);
      g.fillRect(15, 9, 8, 6);
      g.fillRect(8, 17, 8, 4);
      g.fillRect(18, 17, 6, 4);
      // Text lines on papers
      g.fillStyle(0x5a4a38, 0.3);
      g.fillRect(6, 10, 6, 1);
      g.fillRect(6, 12, 5, 1);
      g.fillRect(16, 10, 6, 1);
      g.fillRect(16, 12, 5, 1);
      g.generateTexture('structure_notice_board', 32, 32);
      g.destroy();
    }

    // Testing Grounds Portal (48x48) — enhanced glow
    {
      const g = scene.add.graphics();
      // Stone archway outline
      g.fillStyle(0x3a3830, 1);
      g.fillRect(7, 3, 10, 42);
      g.fillRect(31, 3, 10, 42);
      g.fillRect(7, 1, 34, 9);
      // Left pillar
      g.fillStyle(0x6b6157, 1);
      g.fillRect(8, 4, 8, 40);
      g.fillStyle(0x7b7167, 0.4);
      g.fillRect(8, 4, 3, 38);
      g.fillStyle(0x4b4137, 0.3);
      g.fillRect(14, 4, 2, 38);
      // Right pillar
      g.fillStyle(0x6b6157, 1);
      g.fillRect(32, 4, 8, 40);
      g.fillStyle(0x7b7167, 0.4);
      g.fillRect(32, 4, 3, 38);
      g.fillStyle(0x4b4137, 0.3);
      g.fillRect(38, 4, 2, 38);
      // Top arch
      g.fillStyle(0x6b6157, 1);
      g.fillRect(8, 2, 32, 8);
      g.fillStyle(0x7b7167, 0.4);
      g.fillRect(8, 2, 32, 3);
      // Inner arch
      g.fillStyle(0x5b5147, 1);
      g.fillRect(10, 8, 4, 36);
      g.fillRect(34, 8, 4, 36);
      // Glowing portal interior (layered glow)
      g.fillStyle(0x6622aa, 0.4);
      g.fillRect(14, 8, 20, 36);
      g.fillStyle(0x8844cc, 0.5);
      g.fillRect(16, 10, 16, 34);
      g.fillStyle(0xaa66ff, 0.3);
      g.fillRect(18, 12, 12, 30);
      g.fillStyle(0xcc88ff, 0.15);
      g.fillRect(20, 16, 8, 24);
      // Runes on arch (glowing)
      g.fillStyle(0xaa66ff, 0.7);
      g.fillRect(12, 4, 4, 2);
      g.fillRect(20, 3, 8, 2);
      g.fillRect(32, 4, 4, 2);
      g.fillStyle(0xcc88ff, 0.4);
      g.fillRect(13, 4, 2, 1);
      g.fillRect(22, 3, 4, 1);
      g.generateTexture('structure_portal', 48, 48);
      g.destroy();
    }

    // Monument (48x48) — enhanced shading
    {
      const g = scene.add.graphics();
      // Outline
      g.fillStyle(0x3a3830, 1);
      g.fillRect(5, 9, 10, 36);
      g.fillRect(33, 9, 10, 36);
      g.fillRect(5, 5, 38, 9);
      // Left pillar
      g.fillStyle(0x8a8078, 1);
      g.fillRect(6, 10, 8, 34);
      g.fillStyle(0x9a9088, 0.4);
      g.fillRect(6, 10, 3, 32);
      g.fillStyle(0x6a6058, 0.3);
      g.fillRect(12, 10, 2, 32);
      // Right pillar
      g.fillStyle(0x8a8078, 1);
      g.fillRect(34, 10, 8, 34);
      g.fillStyle(0x9a9088, 0.4);
      g.fillRect(34, 10, 3, 32);
      g.fillStyle(0x6a6058, 0.3);
      g.fillRect(40, 10, 2, 32);
      // Top beam
      g.fillStyle(0x8a8078, 1);
      g.fillRect(6, 6, 36, 8);
      g.fillStyle(0x9a9088, 0.3);
      g.fillRect(6, 6, 36, 3);
      // Inner opening
      g.fillStyle(0x2c1810, 0.3);
      g.fillRect(14, 14, 20, 30);
      // Carved text area
      g.fillStyle(0x9a9088, 1);
      g.fillRect(16, 18, 16, 10);
      g.fillStyle(0xaaa098, 0.3);
      g.fillRect(16, 18, 8, 5);
      // Text lines
      g.fillStyle(0x5a5248, 0.7);
      g.fillRect(18, 20, 12, 1);
      g.fillRect(18, 23, 10, 1);
      g.fillRect(18, 26, 8, 1);
      // Decorative gold top
      g.fillStyle(0xffd700, 0.5);
      g.fillRect(20, 7, 8, 3);
      g.fillStyle(0xffee66, 0.3);
      g.fillRect(20, 7, 4, 1);
      g.generateTexture('structure_monument', 48, 48);
      g.destroy();
    }
  }

  static generateKeepItemTextures(scene) {
    // Oak Table (32x22) — wood grain, shading
    {
      const g = scene.add.graphics();
      // Outline
      g.fillStyle(0x3a2810, 1);
      g.fillRect(1, 5, 30, 10);
      g.fillRect(3, 13, 5, 9);
      g.fillRect(24, 13, 5, 9);
      // Tabletop
      g.fillStyle(0x8b6b4a, 1);
      g.fillRect(2, 6, 28, 8);
      // Wood grain
      g.fillStyle(0x7b5b3a, 0.3);
      g.fillRect(4, 8, 24, 1);
      g.fillRect(6, 11, 20, 1);
      // Top highlight
      g.fillStyle(0x9b7b5a, 0.5);
      g.fillRect(2, 6, 26, 2);
      // Bottom shadow
      g.fillStyle(0x5a3a20, 0.3);
      g.fillRect(2, 12, 28, 2);
      // Legs
      g.fillStyle(0x7b5b3a, 1);
      g.fillRect(4, 14, 3, 8);
      g.fillRect(25, 14, 3, 8);
      g.fillStyle(0x8b6b4a, 0.5);
      g.fillRect(4, 14, 1, 6);
      g.fillStyle(0x5a3a20, 0.3);
      g.fillRect(6, 14, 1, 6);
      g.fillRect(27, 14, 1, 6);
      g.generateTexture('keep_table_oak', 32, 22);
      g.destroy();
    }

    // Oak Chair (16x16) — wood grain
    {
      const g = scene.add.graphics();
      // Outline
      g.fillStyle(0x3a2810, 1);
      g.fillRect(1, 0, 14, 6);
      g.fillRect(2, 3, 12, 3);
      g.fillRect(2, 5, 3, 10);
      g.fillRect(10, 5, 3, 10);
      // Backrest
      g.fillStyle(0x8b6b4a, 1);
      g.fillRect(2, 0, 12, 5);
      g.fillStyle(0x9b7b5a, 0.4);
      g.fillRect(2, 0, 6, 3);
      // Seat
      g.fillStyle(0x7b5b3a, 1);
      g.fillRect(3, 4, 10, 2);
      g.fillStyle(0x8b6b4a, 0.4);
      g.fillRect(3, 4, 8, 1);
      // Legs
      g.fillRect(3, 6, 2, 8);
      g.fillRect(11, 6, 2, 8);
      g.generateTexture('keep_chair_oak', 16, 16);
      g.destroy();
    }

    // Straw Bed (32x16) — fold shadows
    {
      const g = scene.add.graphics();
      // Frame outline
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(0, 3, 32, 13);
      // Frame
      g.fillStyle(0x6b4226, 1);
      g.fillRect(0, 4, 32, 12);
      g.fillStyle(0x7b5236, 0.4);
      g.fillRect(0, 4, 32, 2);
      // Straw
      g.fillStyle(0xc8a870, 1);
      g.fillRect(2, 2, 28, 10);
      // Pillow with highlight
      g.fillStyle(0xd4bc8b, 0.7);
      g.fillRect(4, 3, 8, 6);
      g.fillStyle(0xe0ccaa, 0.4);
      g.fillRect(4, 3, 4, 3);
      // Fold shadows
      g.fillStyle(0xa89060, 0.3);
      g.fillRect(14, 4, 14, 1);
      g.fillRect(10, 7, 18, 1);
      g.fillRect(6, 10, 22, 1);
      g.generateTexture('keep_bed_basic', 32, 16);
      g.destroy();
    }

    // Wooden Chest (16x16) — metal banding
    {
      const g = scene.add.graphics();
      // Outline
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(0, 3, 16, 12);
      g.fillRect(1, 1, 14, 4);
      // Chest body
      g.fillStyle(0x6b4226, 1);
      g.fillRect(1, 4, 14, 10);
      g.fillStyle(0x7b5236, 0.4);
      g.fillRect(1, 4, 6, 8);
      g.fillStyle(0x4a2a10, 0.3);
      g.fillRect(10, 4, 5, 8);
      // Lid
      g.fillStyle(0x8b5a2a, 1);
      g.fillRect(2, 2, 12, 4);
      g.fillStyle(0x9b6a3a, 0.4);
      g.fillRect(2, 2, 6, 2);
      // Metal banding
      g.fillStyle(0x555555, 0.7);
      g.fillRect(1, 4, 14, 1);
      g.fillRect(1, 9, 14, 1);
      // Gold lock
      g.fillStyle(0xffd700, 1);
      g.fillRect(6, 6, 4, 3);
      g.fillStyle(0xffee66, 0.4);
      g.fillRect(6, 6, 2, 1);
      g.generateTexture('keep_chest_wood', 16, 16);
      g.destroy();
    }

    // Wall Torch (16x16) — enhanced
    {
      const g = scene.add.graphics();
      // Bracket outline
      g.fillStyle(0x2a1a0a, 1);
      g.fillRect(5, 5, 6, 11);
      g.fillStyle(0x5a4a3a, 1);
      g.fillRect(6, 6, 4, 10);
      g.fillStyle(0x6a5a4a, 0.4);
      g.fillRect(6, 6, 2, 8);
      // Flame glow
      g.fillStyle(0xff4400, 0.15);
      g.fillRect(3, 0, 10, 8);
      // Flame
      g.fillStyle(0xff6600, 1);
      g.fillRect(5, 2, 6, 5);
      g.fillStyle(0xffaa00, 1);
      g.fillRect(6, 1, 4, 4);
      g.fillStyle(0xffcc00, 0.8);
      g.fillRect(6, 0, 4, 3);
      g.fillStyle(0xffee66, 0.6);
      g.fillRect(7, 0, 2, 2);
      g.generateTexture('keep_torch_wall', 16, 16);
      g.destroy();
    }

    // Banner (16x32) — ripple, fold shadows
    {
      const g = scene.add.graphics();
      // Pole outline
      g.fillStyle(0x2a1a08, 1);
      g.fillRect(6, 0, 4, 32);
      g.fillStyle(0x5a4a3a, 1);
      g.fillRect(7, 0, 2, 32);
      g.fillStyle(0x6a5a4a, 0.4);
      g.fillRect(7, 0, 1, 28);
      // Banner fabric
      g.fillStyle(0xcc3333, 1);
      g.fillRect(2, 4, 12, 20);
      // Banner fold highlight
      g.fillStyle(0xff5555, 0.3);
      g.fillRect(2, 4, 4, 18);
      g.fillRect(8, 10, 3, 8);
      // Banner fold shadow
      g.fillStyle(0x881111, 0.3);
      g.fillRect(10, 4, 4, 18);
      g.fillRect(5, 12, 3, 6);
      // Banner tail
      g.fillStyle(0xaa2222, 1);
      g.fillRect(4, 24, 8, 4);
      g.fillRect(6, 28, 4, 2);
      g.fillStyle(0x881111, 0.3);
      g.fillRect(8, 24, 4, 4);
      g.generateTexture('keep_banner_basic', 16, 32);
      g.destroy();
    }

    // Wolf Trophy (16x16)
    {
      const g = scene.add.graphics();
      // Plaque outline
      g.fillStyle(0x2a1a08, 1);
      g.fillRect(2, 2, 12, 12);
      // Plaque
      g.fillStyle(0x5a4a3a, 1);
      g.fillRect(3, 3, 10, 10);
      g.fillStyle(0x6a5a4a, 0.4);
      g.fillRect(3, 3, 5, 5);
      // Wolf head
      g.fillStyle(0x666666, 1);
      g.fillRect(5, 4, 6, 6);
      g.fillStyle(0x888888, 0.5);
      g.fillRect(5, 4, 3, 3);
      g.fillStyle(0x444444, 0.3);
      g.fillRect(9, 7, 2, 3);
      // Eyes
      g.fillStyle(0xff4444, 1);
      g.fillRect(6, 6, 1, 1);
      g.fillRect(9, 6, 1, 1);
      g.generateTexture('keep_trophy_wolf', 16, 16);
      g.destroy();
    }
  }

  static generateBuildingTextures(scene) {
    // Wall (32x32) — mortar lines, crenellation highlights
    {
      const g = scene.add.graphics();
      const s = 32;
      // Outline
      g.fillStyle(0x3a3830, 1);
      g.fillRect(0, 3, 32, 29);
      // Stone blocks
      g.fillStyle(0x7a7068, 1);
      g.fillRect(0, 4, 32, 28);
      // Left highlight
      g.fillStyle(0x8a8078, 0.4);
      g.fillRect(0, 4, 12, 28);
      // Right shadow
      g.fillStyle(0x5a5850, 0.3);
      g.fillRect(22, 4, 10, 28);
      // Mortar lines
      g.fillStyle(0x4a4840, 0.5);
      g.fillRect(0, 10, 32, 1);
      g.fillRect(0, 18, 32, 1);
      g.fillRect(0, 26, 32, 1);
      g.fillRect(8, 4, 1, 6);
      g.fillRect(16, 11, 1, 7);
      g.fillRect(24, 4, 1, 6);
      g.fillRect(8, 19, 1, 7);
      g.fillRect(24, 19, 1, 7);
      // Top crenellation outline
      g.fillStyle(0x3a3830, 1);
      g.fillRect(0, 0, 9, 6);
      g.fillRect(11, 0, 10, 6);
      g.fillRect(23, 0, 9, 6);
      // Crenellation
      g.fillStyle(0x8a8078, 1);
      g.fillRect(0, 0, 8, 6);
      g.fillRect(12, 0, 8, 6);
      g.fillRect(24, 0, 8, 6);
      // Crenellation highlight
      g.fillStyle(0x9a9088, 0.5);
      g.fillRect(0, 0, 4, 3);
      g.fillRect(12, 0, 4, 3);
      g.fillRect(24, 0, 4, 3);
      // Crenellation shadow
      g.fillStyle(0x5a5850, 0.3);
      g.fillRect(5, 3, 3, 3);
      g.fillRect(17, 3, 3, 3);
      g.fillRect(29, 3, 3, 3);
      g.generateTexture('building_wall', s, s);
      g.destroy();
    }

    // Tower (32x48) — arrow slits, detailed roof
    {
      const g = scene.add.graphics();
      const w = 32, h = 48;
      // Outline
      g.fillStyle(0x3a3830, 1);
      g.fillRect(3, 15, 26, 33);
      // Stone base
      g.fillStyle(0x7a7068, 1);
      g.fillRect(4, 16, 24, 32);
      // Left highlight
      g.fillStyle(0x8a8078, 0.4);
      g.fillRect(4, 16, 10, 30);
      // Right shadow
      g.fillStyle(0x5a5850, 0.3);
      g.fillRect(18, 16, 10, 30);
      // Mortar
      g.fillStyle(0x4a4840, 0.4);
      g.fillRect(4, 24, 24, 1);
      g.fillRect(4, 32, 24, 1);
      g.fillRect(4, 40, 24, 1);
      g.fillRect(16, 16, 1, 32);
      // Arrow slits
      g.fillStyle(0x1c1810, 1);
      g.fillRect(14, 26, 4, 6);
      g.fillRect(14, 36, 4, 6);
      // Arrow slit inner frame
      g.fillStyle(0x5a5850, 0.5);
      g.fillRect(14, 26, 1, 6);
      g.fillRect(14, 36, 1, 6);
      // Roof outline
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(5, 9, 22, 9);
      g.fillRect(7, 5, 18, 6);
      g.fillRect(9, 2, 14, 4);
      g.fillRect(12, 0, 8, 3);
      // Pointed roof
      g.fillStyle(0x8b4513, 1);
      g.fillRect(6, 10, 20, 8);
      g.fillRect(8, 6, 16, 6);
      g.fillRect(10, 3, 12, 4);
      g.fillRect(13, 0, 6, 4);
      // Roof highlight
      g.fillStyle(0xab6523, 0.4);
      g.fillRect(6, 10, 10, 7);
      g.fillRect(8, 6, 7, 5);
      g.fillRect(10, 3, 5, 3);
      // Roof shadow
      g.fillStyle(0x5b2503, 0.3);
      g.fillRect(20, 10, 6, 7);
      g.fillRect(18, 6, 6, 5);
      // Flag at top
      g.fillStyle(0xcc3333, 1);
      g.fillRect(18, 0, 6, 4);
      g.fillRect(18, 4, 4, 2);
      // Flag ripple highlight
      g.fillStyle(0xff5555, 0.4);
      g.fillRect(19, 1, 2, 2);
      // Pole
      g.fillStyle(0x4a2a10, 1);
      g.fillRect(16, 0, 2, 10);
      g.generateTexture('building_tower', w, h);
      g.destroy();
    }

    // Fort (48x48) — courtyard texture, gate detail
    {
      const g = scene.add.graphics();
      const s = 48;
      // Outer wall outline
      g.fillStyle(0x3a3830, 1);
      g.fillRect(0, 0, 48, 48);
      // Outer walls
      g.fillStyle(0x7a7068, 1);
      g.fillRect(1, 1, 46, 46);
      // Inner courtyard with texture
      g.fillStyle(0x9e8e6e, 1);
      g.fillRect(8, 8, 32, 32);
      // Courtyard texture detail
      g.fillStyle(0x8e7e5e, 0.3);
      g.fillRect(12, 12, 24, 1);
      g.fillRect(12, 20, 24, 1);
      g.fillRect(12, 28, 24, 1);
      g.fillRect(20, 8, 1, 32);
      g.fillRect(28, 8, 1, 32);
      // Wall top highlight
      g.fillStyle(0x8a8078, 0.4);
      g.fillRect(1, 1, 46, 3);
      // Corner turrets
      g.fillStyle(0x8a8078, 1);
      g.fillRect(0, 0, 10, 10);
      g.fillRect(38, 0, 10, 10);
      g.fillRect(0, 38, 10, 10);
      g.fillRect(38, 38, 10, 10);
      // Turret highlights (top-left lit)
      g.fillStyle(0x9a9088, 0.5);
      g.fillRect(0, 0, 5, 5);
      g.fillRect(38, 0, 5, 5);
      g.fillRect(0, 38, 5, 5);
      g.fillRect(38, 38, 5, 5);
      // Turret shadows
      g.fillStyle(0x5a5850, 0.3);
      g.fillRect(6, 6, 4, 4);
      g.fillRect(44, 6, 4, 4);
      g.fillRect(6, 44, 4, 4);
      g.fillRect(44, 44, 4, 4);
      // Gate arch
      g.fillStyle(0x6b6157, 1);
      g.fillRect(16, 38, 16, 3);
      g.fillStyle(0x7a7068, 0.5);
      g.fillRect(16, 38, 8, 1);
      // Gate
      g.fillStyle(0x4a2a10, 1);
      g.fillRect(18, 40, 12, 8);
      // Gate plank lines
      g.fillStyle(0x3a1a08, 0.3);
      g.fillRect(21, 40, 1, 8);
      g.fillRect(25, 40, 1, 8);
      g.generateTexture('building_fort', s, s);
      g.destroy();
    }

    // Castle (64x64) — portcullis grid, banner ripple
    {
      const g = scene.add.graphics();
      const s = 64;
      // Outline
      g.fillStyle(0x3a3830, 1);
      g.fillRect(0, 0, 64, 64);
      // Thick outer walls
      g.fillStyle(0x6b6157, 1);
      g.fillRect(1, 1, 62, 62);
      // Wall highlight (top & left)
      g.fillStyle(0x7b7167, 0.3);
      g.fillRect(1, 1, 30, 62);
      g.fillRect(1, 1, 62, 4);
      // Wall shadow (right)
      g.fillStyle(0x4b4137, 0.2);
      g.fillRect(44, 1, 20, 62);
      // Inner area
      g.fillStyle(0x9e8e6e, 1);
      g.fillRect(10, 10, 44, 44);
      // Courtyard texture
      g.fillStyle(0x8e7e5e, 0.2);
      g.fillRect(14, 16, 36, 1);
      g.fillRect(14, 26, 36, 1);
      g.fillRect(14, 36, 36, 1);
      g.fillRect(24, 10, 1, 44);
      g.fillRect(40, 10, 1, 44);
      // 4 corner towers
      g.fillStyle(0x7a7068, 1);
      g.fillRect(0, 0, 14, 14);
      g.fillRect(50, 0, 14, 14);
      g.fillRect(0, 50, 14, 14);
      g.fillRect(50, 50, 14, 14);
      // Tower highlights
      g.fillStyle(0x8a8078, 0.4);
      g.fillRect(0, 0, 7, 7);
      g.fillRect(50, 0, 7, 7);
      g.fillRect(0, 50, 7, 7);
      g.fillRect(50, 50, 7, 7);
      // Central keep
      g.fillStyle(0x8a8078, 1);
      g.fillRect(20, 16, 24, 28);
      // Keep left highlight
      g.fillStyle(0x9a9088, 0.3);
      g.fillRect(20, 16, 10, 26);
      // Keep right shadow
      g.fillStyle(0x6a6058, 0.3);
      g.fillRect(34, 16, 10, 26);
      // Keep roof outline
      g.fillStyle(0x3a1a08, 1);
      g.fillRect(21, 11, 22, 7);
      g.fillRect(25, 7, 14, 5);
      // Keep roof
      g.fillStyle(0x8b4513, 1);
      g.fillRect(22, 12, 20, 6);
      g.fillRect(26, 8, 12, 5);
      // Roof highlight
      g.fillStyle(0xab6523, 0.4);
      g.fillRect(22, 12, 10, 5);
      g.fillRect(26, 8, 5, 4);
      // Gate with portcullis grid
      g.fillStyle(0x5c3a1e, 1);
      g.fillRect(26, 54, 12, 10);
      // Portcullis grid lines
      g.fillStyle(0x3a3a3a, 0.5);
      g.fillRect(28, 54, 1, 10);
      g.fillRect(32, 54, 1, 10);
      g.fillRect(36, 54, 1, 10);
      g.fillRect(26, 57, 12, 1);
      g.fillRect(26, 60, 12, 1);
      // Gate arch
      g.fillStyle(0x7a7068, 1);
      g.fillRect(24, 52, 16, 3);
      g.fillStyle(0x8a8078, 0.4);
      g.fillRect(24, 52, 8, 1);
      // Banner with ripple effect
      g.fillStyle(0x4a2a10, 1);
      g.fillRect(29, 2, 2, 10);
      g.fillStyle(0xcc3333, 1);
      g.fillRect(30, 4, 8, 5);
      g.fillRect(30, 9, 6, 3);
      // Banner highlight ripple
      g.fillStyle(0xff5555, 0.3);
      g.fillRect(31, 5, 3, 3);
      g.fillRect(33, 9, 2, 2);
      // Banner shadow
      g.fillStyle(0x881111, 0.3);
      g.fillRect(35, 5, 2, 3);
      // Tower crenellation detail
      g.fillStyle(0x8a8078, 0.6);
      g.fillRect(1, 1, 5, 3);
      g.fillRect(8, 1, 5, 3);
      g.fillRect(51, 1, 5, 3);
      g.fillRect(58, 1, 5, 3);
      // Windows on keep
      g.fillStyle(0x1c1810, 1);
      g.fillRect(28, 22, 4, 6);
      g.fillRect(36, 22, 4, 6);
      // Window frame highlight
      g.fillStyle(0x6a6058, 0.3);
      g.fillRect(28, 22, 1, 6);
      g.fillRect(36, 22, 1, 6);
      g.generateTexture('building_castle', s, s);
      g.destroy();
    }
  }
}
