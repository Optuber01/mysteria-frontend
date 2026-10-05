<template>
  <figure
    ref="host"
    class="minecraft-player"
    :class="{ 'is-ready': ready }"
    :style="{ '--glow': glow.toFixed(3), '--shade': shade.toFixed(3) }"
    role="img"
    :aria-label="label || undefined"
  >
    <canvas ref="canvas" class="minecraft-player__canvas" aria-hidden="true" />
    <div v-if="failed" class="minecraft-player__fallback" aria-hidden="true">
      <span class="minecraft-player__fallback-head" />
      <span class="minecraft-player__fallback-body" />
    </div>
  </figure>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import type * as THREE from 'three';
import type { SkinViewer } from 'skinview3d';

// Optuber's own skin (classic arms), from the Mojang session server.
import playerSkinUrl from '@/assets/images/home/progression/player-skin.png';
import { drawVial, hexToRgb, vialKey } from './art';
import { isNearby, whenSettled } from './prewarm';

/** The held bottle on screen: centre and height, px relative to this figure. */
export type BottlePosition = { x: number; y: number; size: number };

/*
 * The figure is posed straight from the story's beats (all 0..1, scrubbed by
 * scroll, so every pose plays backwards as well as forwards):
 *   step -> reach -> regard -> lift -> sip (+ swallow) -> lower -> hit -> awaken
 */
const props = withDefaults(
  defineProps<{
    /** Allow skinview3d (and its WebGL context) to load once in view. */
    armed?: boolean;
    /** The story's progress: only the breathing and the tremor's phase. */
    progress?: number;
    /** Stepping out of the fog (one stride). */
    step?: number;
    /** The right hand held out for the potion. */
    reach?: number;
    /** The potion brought in to look at. */
    regard?: number;
    /** Raised to the mouth. */
    lift?: number;
    /** 0..1 over the three swallows: the bottle tips up, the head goes back. */
    sip?: number;
    /** 0..1 at each swallow. */
    swallow?: number;
    /** The empty bottle lowered. */
    lower?: number;
    /** The potion takes hold: head bowed, left hand to the temple, a tremor. */
    hit?: number;
    /** Awakened: lifted off the circle, arms open, face up. */
    awaken?: number;
    /** 0..1: the awakening's rim light and the lift out of shadow. */
    glow?: number;
    /** 0..1: how far the figure is in silhouette (low front light). */
    shade?: number;
    /** 0..1: how far the potion's colour has run through him, out from his heart. */
    veins?: number;
    /** 0..~1.6: how brightly it burns in him. */
    veinGlow?: number;
    /** 0..1: his eyes, lit with it. */
    eyes?: number;
    /** The bottle is in his hand (before that it is a DOM sprite floating to it). */
    holding?: boolean;
    /** 0..1 potion left in the bottle. */
    level?: number;
    /** The potion's colour (#rrggbb). */
    accent?: string;
    /** A dark frock coat and top hat over the skin, built from its own boxes. */
    costume?: boolean;
    label?: string;
  }>(),
  {
    armed: true,
    progress: 0,
    step: 1,
    reach: 0,
    regard: 0,
    lift: 0,
    sip: 0,
    swallow: 0,
    lower: 0,
    hit: 0,
    awaken: 0,
    glow: 0,
    shade: 0,
    veins: 0,
    veinGlow: 0,
    eyes: 0,
    holding: false,
    level: 1,
    accent: '#a78bfa',
    costume: false,
    label: '',
  },
);

const emit = defineEmits<{ (e: 'bottle', pos: BottlePosition | null): void }>();

const host = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);
const failed = ref(false);
const inViewport = ref(false);

let viewer: SkinViewer | null = null;
let three: typeof import('three') | null = null;
let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let disposed = false;
let viewerCreationStarted = false;
let rimLights: THREE.PointLight[] = [];
/** The potion's own glow, carried in his hand: it lights his fist, arm and face. */
let potionLight: THREE.PointLight | null = null;

/* ---- the bottle: a 16 px sprite on a plane, held in the right fist ---- */
let holder: THREE.Group | null = null;
let bottle: THREE.Mesh | null = null;
let bottleCanvas: HTMLCanvasElement | null = null;
let bottleTexture: THREE.CanvasTexture | null = null;
let lastBottle = '';
/** Plane size in skin units (the head is 8): a bottle a hand can close round. */
const BOTTLE_SIZE = 7;
const TEXEL = BOTTLE_SIZE / 16;
/** The fist, in the right arm's own frame (the arm hangs from its pivot to y = -10). */
const FIST: [number, number, number] = [-1, -9, 0];
/** Where the fist closes on the vial (texel row 10.5), from the plane's centre. */
const GRIP_Y = -2.5 * TEXEL;
/** The vial's lip (texel row 3), from the plane's centre: what goes to his mouth. */
const LIP_Y = 5 * TEXEL;
/** The bottle sits a little in front of the fist, toward the camera. */
const BOTTLE_Z = 1.2;
/** The mouth in the head's frame (the head is the box y 0..8, z -4..4). */
const MOUTH: [number, number, number] = [0, 1.6, 4.2];

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/* ---------------- poses ---------------- */
type Pose = {
  rArmX: number; rArmZ: number;
  lArmX: number; lArmZ: number;
  headX: number; headY: number;
  /** the whole figure turned about its axis (positive: his face toward the reader's right) */
  turn: number;
  legR: number; legL: number;
  /** lift off the floor, in skin units */
  rise: number;
  /** sideways lean (the tremor) */
  roll: number;
  /** the bottle's tip on screen, rad clockwise from upright */
  tip: number;
};

/*
 * He drinks with his right hand, the one nearer the reader: the figure turns a
 * little to the reader's right as the potion comes, so that arm swings toward
 * the camera and reads its whole length, never hidden behind him.
 * (rArmX < 0 raises the arm forward; rArmZ > 0 brings the right hand in across him.)
 */
const REST: Pose = { rArmX: -0.08, rArmZ: 0.05, lArmX: -0.12, lArmZ: -0.05, headX: 0.06, headY: -0.04, turn: 0.04, legR: 0, legL: 0, rise: 0, roll: 0, tip: 0.06 };
// hand out to his side, palm up, eyes on the potion settling into it
const REACH: Pose = { ...REST, rArmX: -1.12, rArmZ: -0.34, lArmX: -0.16, headX: 0.3, headY: -0.26, turn: 0.1, tip: 0 };
// brought up to his eye, out in front of him, and looked at
const REGARD: Pose = { ...REST, rArmX: -1.42, rArmZ: 0.02, lArmX: -0.16, headX: 0.18, headY: -0.2, turn: 0.12, tip: -0.06 };
// the empty bottle lowered to his side, the head still level
const LOWER: Pose = { ...REST, rArmX: -0.3, rArmZ: 0.04, headX: 0.12, headY: 0, turn: 0.12, tip: 0.14 };
// the potion takes hold: head bowed into his left hand, shoulders down
const HIT: Pose = { ...REST, rArmX: -0.12, rArmZ: 0.06, lArmX: -2.3, lArmZ: -0.42, headX: 0.44, headY: 0.12, turn: -0.04, rise: -0.5, tip: 0.2 };
// awakened: off the floor, arms open, face up to the moon
const AWAKE: Pose = { ...REST, rArmX: -0.34, rArmZ: -0.5, lArmX: -0.34, lArmZ: 0.5, headX: -0.3, headY: 0, turn: 0.02, legR: -0.06, legL: 0.08, rise: 1.4, tip: 0.3 };

function mix(a: Pose, b: Pose, t: number): Pose {
  if (t <= 0) return a;
  const out = { ...a };
  for (const key of Object.keys(a) as (keyof Pose)[]) out[key] = lerp(a[key], b[key], t);
  return out;
}

/*
 * Drinking: the head goes back a little further and the bottle tips up a
 * little more at each swallow (sip runs 0..1 over the three). The arm is left
 * to the solver below, which puts the bottle's lip on his mouth as the camera
 * sees it; until the model is up, a rough guess stands in.
 */
function drinkPose(sip: number, swallow: number): Pose {
  return {
    ...REST,
    rArmX: -2.05,
    rArmZ: 0.5,
    // the free hand hangs a little out, for balance, as the head goes back
    lArmX: -0.12 - sip * 0.1,
    lArmZ: 0.04 + sip * 0.08,
    // he faces us: a slight turn so the bottle is in profile, the head only tipped back
    headX: lerp(-0.04, -0.26, sip) - swallow * 0.04,
    headY: -0.04,
    turn: 0.14,
    tip: lerp(1.0, 1.75, sip) + swallow * 0.06,
  };
}

function poseNow(): Pose {
  const g = props.progress;
  const breath = Math.sin(g * 120) * 0.022;
  const step = clamp01(props.step);
  const stride = Math.sin(step * Math.PI) * (1 - step * 0.2);
  let pose: Pose = {
    ...REST,
    legR: stride * 0.34,
    legL: -stride * 0.34,
    rArmX: REST.rArmX - stride * 0.22,
    lArmX: REST.lArmX + stride * 0.22,
    headX: REST.headX + breath,
  };
  pose = mix(pose, REACH, clamp01(props.reach));
  pose = mix(pose, REGARD, clamp01(props.regard));
  const lift = clamp01(props.lift);
  const lower = clamp01(props.lower);
  if (lift > 0 && lower < 1) pose = mix(pose, solveDrinkArm(drinkPose(clamp01(props.sip), clamp01(props.swallow))), lift);
  pose = mix(pose, LOWER, lower);
  const hit = clamp01(props.hit);
  pose = mix(pose, HIT, hit);
  const awaken = clamp01(props.awaken);
  pose = mix(pose, AWAKE, awaken);
  // a tremor while it takes hold; a slow float once he has risen
  pose.roll += Math.sin(g * 1500) * 0.014 * hit * (1 - awaken);
  pose.rise += Math.sin(g * 70) * 0.35 * awaken;
  pose.rArmX += breath * 0.5 * (1 - lift);
  return pose;
}

/*
 * The potion in him: an emissive term added to the skin's own materials. Texel by
 * texel (the skin's 64 x 64 grid, so it reads as Minecraft pixels, never a smooth
 * gradient) its colour runs out from his heart: a bright ragged front, and behind
 * it a scatter of lit texels like veins. His eyes (the face's pupil texels) light
 * up on their own. All of it is uniforms: no texture is repainted, no shader
 * recompiled while it plays.
 */
type VeinUniforms = {
  uVeinSpread: { value: number };
  uVeinGlow: { value: number };
  uVeinEyes: { value: number };
  uVeinColor: { value: THREE.Color };
  uVeinHeart: { value: THREE.Vector3 };
};
let veinUniforms: VeinUniforms | null = null;
/** His heart, in the body's frame (the body box spans y -12..0): left of the breastbone. */
const HEART: [number, number, number] = [1.2, -3.2, 1];
const VEIN_VERTEX_HEAD = 'varying vec3 vVeinPos;\nvarying vec2 vVeinUv;\n';
const VEIN_VERTEX = `
  vVeinPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vVeinUv = uv;`;
const VEIN_FRAGMENT_HEAD = `varying vec3 vVeinPos;
varying vec2 vVeinUv;
uniform float uVeinSpread;
uniform float uVeinGlow;
uniform float uVeinEyes;
uniform vec3 uVeinColor;
uniform vec3 uVeinHeart;
float veinHash(vec2 p) {
  p = mod(p, 289.0);
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float veinNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(veinHash(i), veinHash(i + vec2(1.0, 0.0)), f.x), mix(veinHash(i + vec2(0.0, 1.0)), veinHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
`;
/*
 * Veins: one contour of a smooth noise over the skin's texel grid, one texel wide
 * wherever it runs (the distance to the contour, in texels, from the noise's own
 * slope), so they read as thin winding pixel lines rather than a speckle.
 */
const VEIN_FRAGMENT = `
  {
    vec2 texel = floor(vec2(vVeinUv.x, 1.0 - vVeinUv.y) * 64.0);
    vec2 q = (texel + 0.5) / 5.0;
    float v = veinNoise(q);
    float slope = max(1e-4, length(vec2(veinNoise(q + vec2(0.2, 0.0)) - v, veinNoise(q + vec2(0.0, 0.2)) - v)));
    float vein = step(abs(v - 0.5) / slope, 0.5);
    float n = veinHash(texel + 7.0);
    // the figure is ~32 units tall; the heart is ~10 from his crown and ~22 from his feet
    float reach = uVeinSpread * 30.0 - distance(vVeinPos, uVeinHeart) - n * 3.0;
    float inside = clamp(reach / 2.0, 0.0, 1.0);
    float front = inside * (1.0 - clamp((reach - 1.5) / 3.0, 0.0, 1.0));
    float lit = inside * (0.05 + 0.95 * vein) + front * (0.2 + 0.8 * vein);
    float eye = (texel.y > 10.5 && texel.y < 12.5 && (abs(texel.x - 9.0) < 0.5 || abs(texel.x - 14.0) < 0.5)) ? 1.0 : 0.0;
    totalEmissiveRadiance += uVeinColor * lit * uVeinGlow + mix(uVeinColor, vec3(1.0), 0.45) * eye * uVeinEyes * 1.6;
  }`;
function addVeins(instance: SkinViewer): void {
  if (!three) return;
  const [r, g, b] = hexToRgb(props.accent);
  const uniforms: VeinUniforms = {
    uVeinSpread: { value: 0 },
    uVeinGlow: { value: 0 },
    uVeinEyes: { value: 0 },
    uVeinColor: { value: new three.Color(r / 255, g / 255, b / 255) },
    uVeinHeart: { value: new three.Vector3() },
  };
  veinUniforms = uniforms;
  const skin = instance.playerObject.skin;
  const materials = new Set<THREE.Material>();
  skin.traverse((object) => {
    const material = (object as THREE.Mesh).material;
    if (material && !Array.isArray(material)) materials.add(material);
  });
  materials.forEach((material) => {
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = VEIN_VERTEX_HEAD + shader.vertexShader.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>${VEIN_VERTEX}`);
      shader.fragmentShader = VEIN_FRAGMENT_HEAD + shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>${VEIN_FRAGMENT}`);
    };
    material.customProgramCacheKey = () => 'mysterria-veins';
    material.needsUpdate = true;
  });
}
let vHeart: THREE.Vector3 | null = null;
/** The uniforms for this frame (after the pose is set: the heart moves with him). */
function applyVeins(): void {
  if (!viewer || !three || !veinUniforms) return;
  veinUniforms.uVeinSpread.value = clamp01(props.veins);
  veinUniforms.uVeinGlow.value = Math.max(0, props.veinGlow);
  veinUniforms.uVeinEyes.value = clamp01(props.eyes);
  vHeart ??= new three.Vector3();
  viewer.playerObject.skin.body.localToWorld(vHeart.set(...HEART));
  veinUniforms.uVeinHeart.value.copy(vHeart);
}
function setVeinColor(): void {
  if (!veinUniforms) return;
  const [r, g, b] = hexToRgb(props.accent);
  veinUniforms.uVeinColor.value.setRGB(r / 255, g / 255, b / 255);
}

let qParent: THREE.Quaternion | null = null;
let qTip: THREE.Quaternion | null = null;
let zAxis: THREE.Vector3 | null = null;
/** Everything but the bottle. */
function setBody(pose: Pose) {
  if (!viewer) return;
  const player = viewer.playerObject;
  const skin = player.skin;
  skin.rightArm.rotation.set(pose.rArmX, 0, pose.rArmZ);
  skin.leftArm.rotation.set(pose.lArmX, 0, pose.lArmZ);
  skin.head.rotation.set(pose.headX, pose.headY, 0);
  skin.rightLeg.rotation.set(pose.legR, 0, 0);
  skin.leftLeg.rotation.set(pose.legL, 0, 0);
  player.rotation.set(0, pose.turn, pose.roll);
  player.position.y = pose.rise;
}
/* The bottle faces the camera whatever the arm does (a sprite never turns edge-on), tipped in the picture plane. */
function orientBottle(tip: number, armOnly = false) {
  if (!viewer || !three || !holder || !bottle) return;
  // the solver moves only the arm: the rest of the figure's matrices are already current
  if (armOnly) viewer.playerObject.skin.rightArm.updateMatrixWorld(true);
  else viewer.playerWrapper.updateMatrixWorld(true);
  qParent ??= new three.Quaternion();
  qTip ??= new three.Quaternion();
  zAxis ??= new three.Vector3(0, 0, 1);
  viewer.playerObject.skin.rightArm.getWorldQuaternion(qParent).invert();
  qTip.setFromAxisAngle(zAxis, -tip);
  holder.quaternion.copy(qParent.multiply(viewer.camera.quaternion).multiply(qTip));
  bottle.position.set(0, -GRIP_Y, BOTTLE_Z);
  holder.updateMatrixWorld(true);
}
function applyPose(pose: Pose) {
  if (!viewer || !three) return;
  setBody(pose);
  if (veinUniforms) {
    viewer.playerWrapper.updateMatrixWorld(true);
    applyVeins();
  }
  if (!holder || !bottle) return;
  holder.visible = props.holding;
  orientBottle(pose.tip);
  paintBottle(pose.tip);
}

/*
 * The drinking arm, solved on screen: the arm is rigid (as in the game) and
 * swings from the shoulder, so two angles place the fist; they are found
 * (Gauss-Newton, warm-started from the last frame) so that the bottle's lip
 * lands on his mouth in the picture, whatever the head, the turn and the
 * perspective do. Solving in the picture rather than in the model is what keeps
 * the bottle at his lips and not at his brow.
 */
let solved: [number, number] | null = null;
/** What the last solution was for: unchanged inputs (most scroll frames) reuse it. */
let solvedFor = '';
let vLip: THREE.Vector3 | null = null;
let vMouth: THREE.Vector3 | null = null;
function lipError(tip: number, ax: number, az: number): [number, number] {
  if (!viewer || !three || !bottle || !host.value) return [0, 0];
  viewer.playerObject.skin.rightArm.rotation.set(ax, 0, az);
  orientBottle(tip, true);
  vLip ??= new three.Vector3();
  vMouth ??= new three.Vector3();
  bottle.localToWorld(vLip.set(0, LIP_Y, 0)).project(viewer.camera);
  viewer.playerObject.skin.head.localToWorld(vMouth.set(...MOUTH)).project(viewer.camera);
  const w = host.value.clientWidth / 2;
  const h = host.value.clientHeight / 2;
  return [(vLip.x - vMouth.x) * w, (vLip.y - vMouth.y) * h];
}
function solveDrinkArm(pose: Pose): Pose {
  if (!viewer || !three || !holder || !bottle || !ready.value || !host.value) return pose;
  const key = `${pose.headX.toFixed(4)}|${pose.tip.toFixed(4)}|${host.value.clientWidth}x${host.value.clientHeight}`;
  if (solved && key === solvedFor) return { ...pose, rArmX: solved[0], rArmZ: solved[1] };
  setBody(pose);
  viewer.playerWrapper.updateMatrixWorld(true);
  viewer.camera.updateMatrixWorld();
  let [ax, az] = solved ?? [pose.rArmX, pose.rArmZ];
  let r = lipError(pose.tip, ax, az);
  for (let i = 0; i < 5 && Math.hypot(r[0], r[1]) > 0.3; i++) {
    const e = 0.004;
    const rx = lipError(pose.tip, ax + e, az);
    const rz = lipError(pose.tip, ax, az + e);
    const j11 = (rx[0] - r[0]) / e, j21 = (rx[1] - r[1]) / e;
    const j12 = (rz[0] - r[0]) / e, j22 = (rz[1] - r[1]) / e;
    const det = j11 * j22 - j12 * j21;
    if (Math.abs(det) < 1e-6) break;
    let dx = -(j22 * r[0] - j12 * r[1]) / det;
    let dz = -(j11 * r[1] - j21 * r[0]) / det;
    const step = Math.hypot(dx, dz);
    if (step > 0.35) {
      dx *= 0.35 / step;
      dz *= 0.35 / step;
    }
    ax += dx;
    az += dz;
    r = lipError(pose.tip, ax, az);
  }
  // lost (it never should be): start again from the guess next time
  solved = Math.hypot(r[0], r[1]) < 4 ? [ax, az] : null;
  solvedFor = solved ? key : '';
  return { ...pose, rArmX: ax, rArmZ: az };
}

let bottleKey = '';
function paintBottle(tip = lastTip) {
  lastTip = tip;
  if (!bottleCanvas || !bottleTexture) return;
  // uncorked as he raises it
  const open = props.lift > 0.35;
  const key = `${props.accent}|${vialKey(props.level, tip, open)}`;
  if (key === bottleKey) return;
  bottleKey = key;
  // CPU-backed: only ever uploaded as a texture, so the upload needs no GPU readback
  const context = bottleCanvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  context.imageSmoothingEnabled = false;
  drawVial(context, hexToRgb(props.accent), props.level, tip, open);
  bottleTexture.needsUpdate = true;
}
let lastTip = 0;

function makeBottle(instance: SkinViewer) {
  if (!three) return;
  bottleCanvas = document.createElement('canvas');
  bottleCanvas.width = 16;
  bottleCanvas.height = 16;
  bottleTexture = new three.CanvasTexture(bottleCanvas);
  bottleTexture.colorSpace = three.SRGBColorSpace;
  bottleTexture.magFilter = three.NearestFilter;
  bottleTexture.minFilter = three.NearestFilter;
  bottleTexture.generateMipmaps = false;
  bottleKey = '';
  paintBottle();
  // Unlit: the potion glows in the dark around him; the empty glass stays glass.
  // Drawn over the figure: the hand that holds it is always on his near side, and
  // a bottle clipped by his head or sleeve mid-swing would blink out.
  const material = new three.MeshBasicMaterial({ map: bottleTexture, transparent: true, alphaTest: 0.04, side: three.DoubleSide, depthWrite: false, depthTest: false });
  bottle = new three.Mesh(new three.PlaneGeometry(BOTTLE_SIZE, BOTTLE_SIZE), material);
  bottle.renderOrder = 2;
  holder = new three.Group();
  holder.add(bottle);
  holder.position.set(...FIST);
  instance.playerObject.skin.rightArm.add(holder);
  holder.visible = props.holding;
  // on the arm, not in the (sometimes hidden) holder: a hidden light would change
  // the scene's light count and recompile every shader mid-scroll
  potionLight = new three.PointLight(0xffffff, 0, 26, 0);
  potionLight.position.set(FIST[0], FIST[1] + 1.5, 4);
  instance.playerObject.skin.rightArm.add(potionLight);
  applyLighting();
}

/*
 * A frock coat and top hat for the silhouette, made by cloning the skin's own
 * unit-box arm mesh with a plain dark material. The face, hands and legs
 * still read as the player's.
 */
function dress(instance: SkinViewer): void {
  const skin = instance.playerObject.skin;
  const unit = skin.rightArm.innerLayer as THREE.Mesh;
  const base = unit.material as THREE.MeshStandardMaterial;
  const cloth = (color: number) => {
    const material = base.clone();
    material.map = null;
    material.color.setHex(color);
    material.roughness = 0.95;
    material.metalness = 0;
    material.needsUpdate = true;
    return material;
  };
  const coat = cloth(0x17171d);
  const hat = cloth(0x0e0e11);
  const band = cloth(0x2a2833);
  const box = (parent: THREE.Object3D, material: THREE.MeshStandardMaterial, size: [number, number, number], at: [number, number, number]) => {
    const mesh = unit.clone();
    mesh.material = material;
    mesh.scale.set(...size);
    mesh.position.set(...at);
    parent.add(mesh);
    return mesh;
  };
  box(skin.head, hat, [10.6, 0.7, 10.6], [0, 8.55, 0]);
  box(skin.head, hat, [7.4, 6.6, 7.4], [0, 12.1, 0]);
  // the hat band takes the Pathway's colour (see setBand)
  bandMaterial = box(skin.head, band, [7.6, 1.1, 7.6], [0, 9.5, 0]).material as THREE.MeshStandardMaterial;
  box(skin.body, coat, [3.3, 12.7, 4.9], [-2.6, 0, 0]);
  box(skin.body, coat, [3.3, 12.7, 4.9], [2.6, 0, 0]);
  box(skin.body, coat, [8.9, 12.7, 1.2], [0, 0, -1.9]);
  box(skin.body, coat, [4.3, 7, 5], [-2.25, -9.4, 0]);
  box(skin.body, coat, [4.3, 7, 5], [2.25, -9.4, 0]);
  [skin.rightArm, skin.leftArm].forEach((arm) => {
    const pivot = arm.innerLayer.parent;
    if (pivot) box(pivot, coat, [4.7, 9.6, 4.7], [0, 1.3, 0]);
  });
  setBand();
}
let bandMaterial: THREE.MeshStandardMaterial | null = null;
function setBand() {
  if (!bandMaterial) return;
  const [r, g, b] = hexToRgb(props.accent);
  bandMaterial.color.setRGB((r / 255) * 0.55, (g / 255) * 0.55, (b / 255) * 0.55);
}

function applyLighting() {
  if (!viewer) return;
  const glow = clamp01(props.glow);
  const shade = clamp01(props.shade);
  viewer.globalLight.intensity = (1.1 + glow * 1.2) * (1 - 0.72 * shade);
  viewer.cameraLight.intensity = (0.55 + glow * 0.25) * (1 - 0.6 * shade);
  const [r, g, b] = hexToRgb(props.accent);
  rimLights.forEach((light) => {
    light.color.setRGB(r / 255, g / 255, b / 255);
    light.intensity = 0.5 + glow * 2.6 + shade * 0.8;
  });
  if (potionLight) {
    potionLight.color.setRGB(r / 255, g / 255, b / 255);
    // brightest full; an empty bottle gives none
    potionLight.intensity = props.holding ? 2.4 * Math.min(1, clamp01(props.level) * 1.4) : 0;
  }
}

function sizeViewer() {
  if (!viewer || !host.value) return;
  const bounds = host.value.getBoundingClientRect();
  viewer.setSize(Math.max(1, Math.round(host.value.clientWidth || bounds.width)), Math.max(1, Math.round(host.value.clientHeight || bounds.height)));
  viewer.render();
  emitBottle();
}

let projector: THREE.Vector3 | null = null;
let edge: THREE.Vector3 | null = null;
/** Projects the bottle to px relative to this figure, so the DOM sprite can meet it. */
function emitBottle(): void {
  if (!viewer || !three || !bottle || !host.value || !ready.value) return;
  viewer.playerWrapper.updateMatrixWorld(true);
  projector ??= new three.Vector3();
  edge ??= new three.Vector3();
  const w = host.value.clientWidth;
  const h = host.value.clientHeight;
  projector.set(0, 0, 0);
  bottle.localToWorld(projector);
  projector.project(viewer.camera);
  edge.set(0, BOTTLE_SIZE / 2, 0);
  bottle.localToWorld(edge);
  edge.project(viewer.camera);
  const x = (projector.x * 0.5 + 0.5) * w;
  const y = (0.5 - projector.y * 0.5) * h;
  const size = Math.hypot((edge.x - projector.x) * 0.5 * w, (edge.y - projector.y) * 0.5 * h) * 2;
  const key = `${x.toFixed(1)},${y.toFixed(1)},${size.toFixed(1)}`;
  if (key === lastBottle) return;
  lastBottle = key;
  emit('bottle', { x, y, size });
}

/*
 * The pose is scrubbed by scroll rather than played on a clock: it is computed
 * from the beats, set on the model, then one frame is rendered.
 */
function syncPlayback() {
  if (!viewer || viewer.disposed) return;
  viewer.animation = null;
  viewer.autoRotate = false;
  viewer.renderPaused = true;
  applyPose(poseNow());
  requestRender();
  emitBottle();
}

/* Pose, light and bottle changes from one scroll step share a single WebGL frame. */
let renderQueued = false;
function requestRender() {
  if (renderQueued) return;
  renderQueued = true;
  queueMicrotask(() => {
    renderQueued = false;
    if (inViewport.value && viewer && !viewer.disposed) viewer.render();
  });
}

async function createViewer() {
  if (viewerCreationStarted || disposed || !canvas.value || !host.value) return;
  viewerCreationStarted = true;
  try {
    const [skinview, threeModule] = await Promise.all([import('skinview3d'), import('three')]);
    three = threeModule;
    if (disposed || !canvas.value || !host.value || viewer) return;

    const instance = new skinview.SkinViewer({
      canvas: canvas.value,
      width: 1,
      height: 1,
      enableControls: false,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      renderPaused: true,
      // layout.ts PLAYER_FRAME mirrors this framing
      zoom: 0.66,
      fov: 40,
    });
    viewer = instance;
    instance.background = null;
    // A dark stage: low ambient, two rim lights in the Pathway's colour
    // behind the shoulders that the awakening turns up.
    rimLights = [-1, 1].map((side) => {
      const light = instance.cameraLight.clone();
      light.position.set(side * 26, 18, -30);
      instance.scene.add(light);
      return light;
    });
    applyLighting();

    resizeObserver = new ResizeObserver(sizeViewer);
    resizeObserver.observe(host.value);

    await instance.loadSkin(playerSkinUrl, { model: 'default' });
    if (disposed || !viewer) return;
    if (props.costume) dress(instance);
    makeBottle(instance);
    addVeins(instance);

    ready.value = true;
    sizeViewer();
    syncPlayback();
  } catch (error) {
    failed.value = true;
    console.warn('The Minecraft player model could not be initialized.', error);
  }
}

function maybeCreateViewer() {
  if (props.armed && inViewport.value) void createViewer();
}

let cancelPrewarm: (() => void) | null = null;

onMounted(() => {
  if (!canvas.value || !host.value) return;
  intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      inViewport.value = entry?.isIntersecting ?? false;
      maybeCreateViewer();
      syncPlayback();
    },
    { rootMargin: '120px 0px', threshold: 0.01 },
  );
  intersectionObserver.observe(host.value);
  // The context, shaders and skin are ready before the first scroll into the story (see prewarm.ts).
  cancelPrewarm = whenSettled(() => {
    if (isNearby(host.value)) void createViewer();
  });
});

watch(() => props.armed, maybeCreateViewer);
watch(() => [props.glow, props.shade] as const, () => {
  applyLighting();
  requestRender();
});
watch(() => props.accent, () => {
  setBand();
  setVeinColor();
  applyLighting();
  paintBottle();
  syncPlayback();
});
watch(() => props.level, () => {
  paintBottle();
  applyLighting();
  requestRender();
});
watch(() => props.holding, applyLighting);
watch(
  () => [props.progress, props.step, props.reach, props.regard, props.lift, props.sip, props.swallow, props.lower, props.hit, props.awaken, props.holding, props.veins, props.veinGlow, props.eyes] as const,
  () => syncPlayback(),
);

onUnmounted(() => {
  disposed = true;
  cancelPrewarm?.();
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  bottleTexture?.dispose();
  (bottle?.material as THREE.Material | undefined)?.dispose();
  bottle?.geometry.dispose();
  potionLight?.dispose();
  potionLight = null;
  viewer?.dispose();
  viewer = null;
  rimLights = [];
  veinUniforms = null;
  three = null;
});
</script>

<style scoped>
.minecraft-player {
  --glow: 0;
  --shade: 0;
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  margin: 0;
  isolation: isolate;
  overflow: visible;
}

/* contact shadow on the floor (feet at 80% of the frame, see layout.ts) */
.minecraft-player::before {
  position: absolute;
  z-index: -1;
  left: 50%;
  top: 80%;
  width: min(62%, 260px);
  aspect-ratio: 2.6;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.75), transparent 72%);
  content: '';
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.78);
  transition: opacity 0.45s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.minecraft-player.is-ready::before {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.minecraft-player__canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  /* In shadow while drinking; the awakening lifts the figure and haloes it. */
  filter:
    brightness(calc(0.8 + var(--glow) * 0.25 - var(--shade) * 0.3))
    drop-shadow(0 0 calc(var(--glow) * 22px) color-mix(in oklab, var(--acc) calc(var(--glow) * 65%), transparent))
    drop-shadow(0 24px 22px rgba(0, 0, 0, 0.5));
  transition: opacity 0.14s ease;
}

.minecraft-player.is-ready .minecraft-player__canvas {
  opacity: 1;
}

.minecraft-player__fallback {
  position: absolute;
  inset: 12% 32% 8%;
  display: grid;
  grid-template-rows: 28% 1fr;
  justify-items: center;
  opacity: 0.7;
}

.minecraft-player__fallback-head {
  width: 64%;
  aspect-ratio: 1;
  align-self: end;
  background: #b98465;
  box-shadow: inset 0 22% #32261f;
}

.minecraft-player__fallback-body {
  width: 82%;
  height: 80%;
  background: linear-gradient(#3a9aa0 0 46%, #314b82 46%);
}

@media (prefers-reduced-motion: reduce) {
  .minecraft-player::before,
  .minecraft-player__canvas {
    transition: none;
  }
}
</style>
