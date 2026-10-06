/*
 * The weather's drawing, shared by the worker (sceneWeather.worker.ts, off the main thread)
 * and the main-thread fallback in SceneWeather.vue. Square texels and streaks, like the
 * potion story's particles. No DOM, no Vue: a 2D context in, a frame out.
 */
import type {WeatherKind} from './pathwayScenes';

export type WeatherConfig = {kind: WeatherKind | null; color: string; density: number; lightning: boolean};

/*
 * The canvas holds one pixel per texel (4 CSS px), shown scaled up and pixelated: the field
 * is the same blocky picture for a sixteenth of the pixels to fill. Coordinates stay in CSS
 * px; the context's transform does the scaling. Size the canvas with weatherCanvasSize.
 */
export const WEATHER_SCALE = 4;
export const weatherCanvasSize = (w: number, h: number) => [Math.max(1, Math.ceil(w / WEATHER_SCALE)), Math.max(1, Math.ceil(h / WEATHER_SCALE))] as const;
/** Frames drawn per second at most (texel weather reads fine at 30, at half the work). */
export const WEATHER_FPS = 30;
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type P = {x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; seed: number};

export function createWeather(onStrike: () => void) {
  let ctx: Ctx | null = null;
  const props: WeatherConfig = {kind: null, color: '#ffffff', density: 1, lightning: false};
  let w = 0;
  let h = 0;
  let parts: P[] = [];
  let clock = 0;
  let nextStrike = 3;
  let bolt: number[][] | null = null;
  let boltLife = 0;

  const TEXEL = 4;
  const snap = (v: number) => Math.round(v / TEXEL) * TEXEL;
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  /** Particle count for a full-hero field, scaled by area and density. */
  const count = (base: number) => Math.round(base * props.density * Math.min(1.6, (w * h) / (1440 * 900)));

  function rgb(hex: string): [number, number, number] {
    const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  let tone: [number, number, number] = [255, 255, 255];
  const rgba = (a: number, c = tone) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;

  /* ---- seeding: where each kind starts ---- */
  function seed() {
    parts = [];
    const k = props.kind;
    if (!k) return;
    const n = {rain: 190, embers: 90, ash: 110, petals: 46, fireflies: 38, stars: 120, motes: 70, wisps: 26, glitch: 14, snow: 140, sparks: 60, leaves: 34, bubbles: 50, feathers: 24, bats: 9, pages: 26, moths: 18, dust: 80}[k] ?? 60;
    for (let i = 0; i < count(n); i++) parts.push(spawn(true));
  }

  function spawn(anywhere = false): P {
    const k = props.kind;
    const p: P = {x: rand(0, w), y: anywhere ? rand(0, h) : 0, vx: 0, vy: 0, age: anywhere ? rand(0, 4) : 0, life: 1, size: TEXEL, seed: Math.random() * 100};
    switch (k) {
      case 'rain':
        p.vx = -140; p.vy = rand(900, 1200); p.size = rand(14, 30); if (!anywhere) p.y = rand(-40, 0); p.x = rand(0, w + 200);
        break;
      case 'snow': case 'ash':
        p.vx = rand(-14, 10); p.vy = rand(18, 46); p.size = Math.random() < 0.3 ? TEXEL * 2 : TEXEL; if (!anywhere) p.y = -8;
        break;
      case 'embers': case 'sparks':
        p.vx = rand(-16, 16); p.vy = -rand(30, 90); p.life = rand(3, 7); if (!anywhere) p.y = h + 6; p.size = Math.random() < 0.25 ? TEXEL * 2 : TEXEL;
        break;
      case 'petals': case 'leaves': case 'feathers':
        p.vx = rand(10, 40); p.vy = rand(22, 50); p.size = TEXEL * (Math.random() < 0.5 ? 2 : 1.5); if (!anywhere) { p.y = -10; p.x = rand(-w * 0.2, w); }
        break;
      case 'fireflies': case 'wisps': case 'bubbles':
        p.vx = rand(-10, 10); p.vy = k === 'bubbles' ? -rand(10, 26) : rand(-8, 8); p.y = rand(h * 0.35, h); p.size = k === 'wisps' ? TEXEL * 2 : TEXEL;
        break;
      case 'stars':
        p.y = rand(0, h * 0.62) ** 1 ; p.size = Math.random() < 0.15 ? TEXEL : 2;
        break;
      case 'motes':
        p.vx = rand(-6, 6); p.vy = rand(-10, -2); p.size = Math.random() < 0.3 ? TEXEL : 2;
        break;
      case 'glitch':
        p.size = snap(rand(12, 60)); p.life = rand(0.08, 0.3); p.age = anywhere ? rand(0, 3) : -rand(0.2, 2.4);
        break;
      case 'bats':
        // high in the sky, crossing on wide loops
        p.y = rand(h * 0.04, h * 0.42); p.vx = (Math.random() < 0.5 ? -1 : 1) * rand(40, 90); p.vy = rand(-6, 6); p.size = TEXEL * 2;
        if (!anywhere) p.x = p.vx > 0 ? -30 : w + 30;
        break;
      case 'pages':
        p.vx = rand(-12, 18); p.vy = rand(14, 34); p.size = TEXEL * 2; if (!anywhere) p.y = -12;
        break;
      case 'moths':
        p.y = rand(h * 0.55, h * 0.95); p.vx = rand(-14, 14); p.vy = rand(-8, 8); p.size = TEXEL;
        break;
      case 'dust':
        // sinking slowly, like sand in an hourglass
        p.vx = rand(-4, 4); p.vy = rand(6, 16); p.size = Math.random() < 0.3 ? TEXEL : 2; if (!anywhere) p.y = -6;
        break;
    }
    return p;
  }

  /* ---- one frame ---- */
  function paint(dt: number) {
    const c = ctx;
    const k = props.kind;
    if (!c || !k) return;
    c.clearRect(0, 0, w, h);
    clock += dt;
    if (k === 'rain') {
      c.lineWidth = 4;
      for (const p of parts) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y > h) Object.assign(p, spawn());
        c.strokeStyle = rgba(0.22 + (p.seed % 1) * 0.18);
        c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.size * 0.13, p.y - p.size); c.stroke();
      }
    } else if (k === 'glitch') {
      for (const p of parts) {
        p.age += dt;
        if (p.age > p.life) Object.assign(p, spawn());
        if (p.age < 0) continue;
        c.fillStyle = rgba(0.18 + (p.seed % 1) * 0.25);
        c.fillRect(snap(p.x), snap(p.y), p.size, TEXEL * (1 + Math.floor((p.seed % 1) * 3)));
        c.fillStyle = rgba(0.12, [255, 70, 90]);
        c.fillRect(snap(p.x) + TEXEL, snap(p.y), p.size, TEXEL);
      }
    } else {
      for (const p of parts) {
        p.age += dt;
        const sway = Math.sin(clock * 0.9 + p.seed) ;
        switch (k) {
          case 'snow': case 'ash':
            p.x += (p.vx + sway * 10) * dt; p.y += p.vy * dt; break;
          case 'embers': case 'sparks':
            p.x += (p.vx + sway * 14) * dt; p.y += p.vy * dt; break;
          case 'petals': case 'leaves': case 'feathers':
            p.x += (p.vx + sway * 24) * dt; p.y += (p.vy + Math.cos(clock * 1.3 + p.seed) * 8) * dt; break;
          case 'fireflies': case 'wisps':
            p.x += (p.vx + Math.sin(clock * 0.5 + p.seed) * 12) * dt; p.y += (p.vy + Math.cos(clock * 0.4 + p.seed) * 10) * dt; break;
          case 'bubbles': case 'motes':
            p.x += (p.vx + sway * 6) * dt; p.y += p.vy * dt; break;
          case 'bats':
            p.x += p.vx * dt; p.y += (p.vy + Math.sin(clock * 2.2 + p.seed) * 22) * dt; break;
          case 'pages':
            p.x += (p.vx + sway * 18) * dt; p.y += (p.vy + Math.cos(clock * 1.7 + p.seed) * 10) * dt; break;
          case 'moths':
            p.x += (p.vx + Math.sin(clock * 3.1 + p.seed) * 26) * dt; p.y += (p.vy + Math.cos(clock * 2.7 + p.seed) * 18) * dt; break;
          case 'dust':
            p.x += (p.vx + sway * 3) * dt; p.y += p.vy * dt; break;
        }
        const out = p.y > h + 12 || p.y < -14 || p.x < -60 || p.x > w + 60 || (p.life > 1 && p.age > p.life);
        if (out && k !== 'stars') Object.assign(p, spawn(k === 'fireflies' || k === 'wisps' || k === 'moths'));
        let a = 1;
        switch (k) {
          case 'stars': a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock * (0.6 + (p.seed % 1)) + p.seed)); break;
          case 'fireflies': case 'wisps': a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(clock * 1.6 + p.seed)); break;
          case 'embers': case 'sparks': a = Math.max(0, 1 - p.age / p.life) * (0.6 + 0.4 * Math.sin(clock * 8 + p.seed)); break;
          case 'motes': a = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(clock * 2 + p.seed)); break;
          case 'dust': a = 0.35 + 0.3 * Math.sin(clock + p.seed); break;
          case 'moths': a = 0.55 + 0.35 * Math.sin(clock * 6 + p.seed); break;
          case 'ash': a = 0.45; break;
          case 'snow': a = 0.7; break;
          case 'bubbles': a = 0.35; break;
          default: a = 0.8;
        }
        if (k === 'bats') {
          // a bat: body texel and two wings that beat (up: a V, down: a flat bar)
          const beat = Math.sin(clock * 14 + p.seed) > 0;
          const x = snap(p.x);
          const y = snap(p.y);
          c.fillStyle = rgba(0.9);
          c.fillRect(x, y, TEXEL, TEXEL);
          if (beat) {
            c.fillRect(x - TEXEL, y - TEXEL, TEXEL, TEXEL); c.fillRect(x - TEXEL * 2, y - TEXEL * 2, TEXEL, TEXEL);
            c.fillRect(x + TEXEL, y - TEXEL, TEXEL, TEXEL); c.fillRect(x + TEXEL * 2, y - TEXEL * 2, TEXEL, TEXEL);
          } else {
            c.fillRect(x - TEXEL * 2, y, TEXEL * 2, TEXEL); c.fillRect(x + TEXEL, y, TEXEL * 2, TEXEL);
            c.fillRect(x - TEXEL * 3, y + TEXEL, TEXEL, TEXEL); c.fillRect(x + TEXEL * 3, y + TEXEL, TEXEL, TEXEL);
          }
          continue;
        }
        if (k === 'pages') {
          // a torn page scrap turning over: its width narrows and opens as it tumbles
          const turn = Math.abs(Math.cos(clock * 1.4 + p.seed));
          c.fillStyle = rgba(0.75);
          c.fillRect(snap(p.x), snap(p.y), Math.max(2, snap(TEXEL * 3 * turn)), TEXEL * 2);
          c.fillStyle = rgba(0.35, [120, 110, 100]);
          c.fillRect(snap(p.x), snap(p.y) + 2, Math.max(1, snap(TEXEL * 2 * turn)), 1);
          continue;
        }
        if (k === 'wisps') {
          c.fillStyle = rgba(a * 0.18);
          c.fillRect(snap(p.x) - TEXEL * 2, snap(p.y) - TEXEL * 2, TEXEL * 6, TEXEL * 6);
        }
        c.fillStyle = rgba(a);
        const s = k === 'petals' || k === 'leaves' || k === 'feathers' ? p.size * (0.6 + 0.4 * Math.abs(Math.sin(clock * 2 + p.seed))) : p.size;
        c.fillRect(snap(p.x), snap(p.y), Math.max(2, snap(s)), Math.max(2, k === 'feathers' ? TEXEL : snap(s)));
      }
    }
    // lightning: a jagged bolt from the top, drawn for a moment, with the scene's flash
    if (props.lightning) {
      nextStrike -= dt;
      if (nextStrike <= 0) {
        nextStrike = rand(5, 10);
        bolt = [];
        let x = rand(w * 0.45, w * 0.92);
        for (let y = 0; y < h * rand(0.35, 0.6); y += rand(16, 34)) {
          bolt.push([x, y]);
          x += rand(-26, 26);
        }
        boltLife = 1;
        onStrike();
      }
      if (bolt && boltLife > 0) {
        c.strokeStyle = `rgba(235, 242, 255, ${boltLife.toFixed(3)})`;
        c.lineWidth = 6;
        c.shadowColor = 'rgba(150, 195, 255, .9)';
        c.shadowBlur = 4;
        c.beginPath();
        bolt.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.stroke();
        c.shadowBlur = 0;
        boltLife -= dt * 5;
      }
    }
  }

  return {
    setContext(next: Ctx, width: number, height: number) {
      ctx = next;
      ctx.setTransform(1 / WEATHER_SCALE, 0, 0, 1 / WEATHER_SCALE, 0, 0);
      w = width;
      h = height;
      seed();
    },
    configure(next: WeatherConfig) {
      const reseed = next.kind !== props.kind || next.density !== props.density;
      Object.assign(props, next);
      tone = rgb(props.color);
      if (reseed) seed();
    },
    frame(dt: number) {
      if (!props.kind) {
        ctx?.clearRect(0, 0, w, h);
        return;
      }
      paint(dt);
    },
  };
}
