<template>
  <!--
    White Tower: behind the castle an illusory tower grows, storey by storey, every
    level made of thick books. As it rises, small brass eyes open on its books one by
    one; the higher one looks, the darker it becomes, until its top is lost in the night.
  -->
  <div class="tower" aria-hidden="true">
    <div v-if="layer === 'back'" class="tower__stand">
      <svg class="tower__svg" :viewBox="`0 0 100 ${H}`" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="tower-dusk" x1="0" y1="0" x2="0" :y2="H" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#10131c" stop-opacity=".95"/>
            <stop offset=".45" stop-color="#10131c" stop-opacity=".5"/>
            <stop offset=".8" stop-color="#10131c" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <g v-for="(s, k) in STOREYS" :key="k" class="tower__storey" :style="{'--k': k}">
          <g v-for="(b, i) in s.books" :key="i">
            <rect :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx=".8" :fill="b.fill" class="tower__book"/>
            <path :d="`M${b.x + 3} ${b.y + .6} V${b.y + b.h - .6} M${b.x + 4.6} ${b.y + .6} V${b.y + b.h - .6} M${b.x + b.w - 3} ${b.y + .6} V${b.y + b.h - .6} M${b.x + b.w - 4.6} ${b.y + .6} V${b.y + b.h - .6}`" class="tower__band"/>
            <rect v-if="b.label" :x="b.x + b.label" :y="b.y + b.h * .3" :width="b.w * .16" :height="b.h * .4" class="tower__label"/>
          </g>
          <!-- the shadow under the storey above -->
          <path :d="`M${s.left} ${s.top} H${s.right}`" class="tower__ledge"/>
        </g>
        <!-- the higher, the darker -->
        <rect x="-10" y="0" width="120" :height="H" fill="url(#tower-dusk)" class="tower__dusk"/>
        <!-- brass eyes, opening one by one as the tower climbs -->
        <g v-for="(e, i) in EYES" :key="`e${i}`" class="tower__eye" :style="{'--k': e.k, '--o': e.o}" :transform="`translate(${e.x} ${e.y}) scale(1.45)`">
          <circle r="4.5" class="tower__shine"/>
          <g class="tower__lid">
            <path d="M-3.4 0 Q0 -2.5 3.4 0 Q0 2.5 -3.4 0 Z" class="tower__white"/>
            <circle r="1.25" class="tower__iris"/>
            <circle r=".5" class="tower__pupil"/>
          </g>
          <path d="M-3.4 0 Q0 -2.5 3.4 0 Q0 2.5 -3.4 0 Z" class="tower__rim"/>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({name: 'SignatureTower'});
defineProps<{layer: 'back' | 'front'}>();

/* the same tower on every load */
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Book = {x: number; y: number; w: number; h: number; fill: string; label: number};
type Storey = {books: Book[]; left: number; right: number; top: number};

/** Height of the drawing in tower-widths x 100. */
const H = 640;
const PALE = ['#eef0f6', '#e3e7f0', '#d8dde8', '#f2f0e8', '#e8eaf2', '#cfd5e2'];

/*
 * Storeys of books lying flat, spines toward us: each storey a little narrower than the
 * one below, its books of uneven length and thickness, some jutting out.
 */
const STOREYS: Storey[] = [];
const EYES: {x: number; y: number; k: number; o: number}[] = [];
(() => {
  const r = rand(1259);
  let y = H;
  for (let k = 0; y > 40; k++) {
    // a tower, not a heap: it narrows as it climbs, and every fourth storey is a broad course of folios
    const width = (96 - k * 2.6) * (k % 4 === 3 ? 1.07 : 1);
    const books: Book[] = [];
    const count = 3 + Math.floor(r() * 3);
    for (let i = 0; i < count; i++) {
      const h = 6.5 + r() * 5;
      const w = width * (0.82 + r() * 0.2);
      const x = 50 - w / 2 + (r() - 0.5) * 7;
      y -= h + 0.4;
      books.push({x: +x.toFixed(1), y: +y.toFixed(1), w: +w.toFixed(1), h: +h.toFixed(1), fill: PALE[Math.floor(r() * PALE.length)]!, label: r() < 0.5 ? +(w * (0.3 + r() * 0.3)).toFixed(1) : 0});
      // one book in two or three carries an eye; never two on a book
      if (r() < 0.3 && y > 120) EYES.push({x: +(x + w * (0.25 + r() * 0.5)).toFixed(1), y: +(y + h / 2).toFixed(1), k, o: r()});
    }
    STOREYS.push({books, left: 50 - width / 2, right: 50 + width / 2, top: y - 0.2});
    y -= 1.2;
  }
})();
</script>

<style scoped>
.tower {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* behind the castle, right of the deck; its foot stands behind the rooftops */
.tower__stand {
  --tw: calc(var(--moon-r, 200px) * .82);
  position: absolute;
  left: calc(min(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.98, 100% - var(--moon-r, 200px) * .52) - var(--tw) / 2);
  width: var(--tw);
  bottom: calc(100% - var(--city-bottom, 100%) + var(--city-h, 600px) * .3);
  height: calc(var(--tw) * 5.6);
  /* the top is lost in the night */
  -webkit-mask-image: linear-gradient(0deg, #000 40%, transparent 96%);
  mask-image: linear-gradient(0deg, #000 40%, transparent 96%);
  opacity: .74;
}

@media (max-width: 900px) {
  .tower__stand {
    --tw: calc(var(--moon-r, 200px) * .7);
    left: calc(var(--moon-x, 50%) + var(--moon-r, 200px) * 1.4 - var(--tw) / 2);
  }
}

/* phones: the fan and the title fill the band where it would stand */
@media (max-width: 599px) {
  .tower__stand {
    display: none;
  }
}

.tower__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.tower__book {
  stroke: #7d869c;
  stroke-opacity: .45;
  stroke-width: .4;
}

.tower__band {
  stroke: #8d96ac;
  stroke-opacity: .5;
  stroke-width: .7;
}

.tower__label {
  fill: #9aa3b8;
  fill-opacity: .45;
}

.tower__shine {
  fill: #e0b85a;
  fill-opacity: .16;
}

.tower__ledge {
  stroke: #0a0c12;
  stroke-opacity: .5;
  stroke-width: 1;
}

/* storey by storey, each rising up out of the one below */
.tower__storey {
  animation: tower-storey .5s cubic-bezier(.2, .7, .3, 1) calc(.9s + var(--k) * .12s) backwards;
}

@keyframes tower-storey {
  from { opacity: 0; transform: translateY(6px); }
}

/* ---- the brass eyes ---- */
.tower__white {
  fill: #f6ecd2;
}

.tower__iris {
  fill: #b8862e;
}

.tower__pupil {
  fill: #1a1208;
}

.tower__rim {
  fill: none;
  stroke: #c9a24a;
  stroke-width: .55;
}

.tower__lid {
  transform-box: fill-box;
  transform-origin: center;
  animation:
    tower-open .35s ease-out calc(1.3s + var(--k) * .12s + var(--o) * .25s) backwards,
    tower-blink 11s ease-in-out calc(6s + var(--o) * 9s) infinite;
}

.tower__eye {
  animation: tower-rim .3s ease-out calc(1.2s + var(--k) * .12s + var(--o) * .25s) backwards;
}

@keyframes tower-open {
  from { transform: scaleY(.06); }
}

@keyframes tower-rim {
  from { opacity: 0; }
}

@keyframes tower-blink {
  0%, 96%, 100% { transform: none; }
  98% { transform: scaleY(.08); }
}

/* light theme: the tower in ink on the paper, its books outlined, the eyes still brass */
:root[data-theme="parchment"] .tower__stand {
  opacity: .5;
}

:root[data-theme="parchment"] .tower__book {
  stroke: #4c5468;
  stroke-opacity: .8;
  stroke-width: .5;
}

:root[data-theme="parchment"] .tower__dusk {
  display: none;
}

:root[data-theme="parchment"] .tower__label {
  fill: #9aa3b8;
  fill-opacity: .45;
}

.tower__shine {
  fill: #e0b85a;
  fill-opacity: .16;
}

.tower__ledge {
  stroke: #4c5468;
  stroke-opacity: .35;
}

@media (prefers-reduced-motion: reduce) {
  .tower__storey,
  .tower__lid,
  .tower__eye {
    animation: none;
  }
}
</style>
