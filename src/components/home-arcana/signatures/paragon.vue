<template>
  <!--
    Paragon: the light of civilisation. Across Backlund the windows and the gas lamps come
    on in a wave from west to east (the Illuminator), and steam vents from the rooftops in
    a steady working rhythm. No stars, no eyes, no magic: lamplight and steam.
  -->
  <div class="paragon" aria-hidden="true">
    <template v-if="layer === 'front'">
      <div class="paragon__city">
        <!-- the city's own warm haze, rising as it lights -->
        <i class="paragon__haze"></i>
        <svg class="paragon__lights" viewBox="0 0 1920 1080" preserveAspectRatio="none">
          <defs>
            <radialGradient id="paragon-halo">
              <stop offset="0" stop-color="#ffb35a" stop-opacity=".55"/>
              <stop offset=".45" stop-color="#ff9a40" stop-opacity=".16"/>
              <stop offset="1" stop-color="#ff9a40" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="paragon-lamp">
              <stop offset="0" stop-color="#fff4d6" stop-opacity=".95"/>
              <stop offset=".18" stop-color="#ffd58a" stop-opacity=".6"/>
              <stop offset=".5" stop-color="#ffa655" stop-opacity=".16"/>
              <stop offset="1" stop-color="#ffa655" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <!-- windows, a slice of the city at a time -->
          <g v-for="(slice, k) in SLICES" :key="k" class="paragon__slice" :style="{'--k': k}">
            <g v-for="([x, y], i) in slice" :key="i">
              <rect :x="x - 9" :y="y - 9" width="18" height="18" fill="url(#paragon-halo)"/>
              <rect :x="x - 3" :y="y - 4" width="6" height="8" class="paragon__window"/>
            </g>
          </g>
          <!-- the gas lamps along the streets, a beat behind the windows around them -->
          <g v-for="([x, y], i) in LAMPS" :key="`l${i}`" class="paragon__lamp" :style="{'--k': x / 1920 * SLICE_COUNT + .6}">
            <circle :cx="x" :cy="y" r="34" fill="url(#paragon-lamp)"/>
            <rect :x="x - 3" :y="y - 3" width="6" height="6" fill="#fff6dc"/>
          </g>
        </svg>

        <!-- steam venting from the rooftops, chimney by chimney -->
        <div v-for="(c, n) in CHIMNEYS" :key="`c${n}`" class="paragon__vent" :style="{left: `${c.x / 19.2}%`, top: `${c.y / 10.8}%`, '--n': n, '--h': c.h}">
          <div class="paragon__plume">
            <i class="paragon__flow"></i>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineOptions({name: 'SignatureParagon'});
defineProps<{layer: 'back' | 'front'}>();

/*
 * Lit windows on the skyline (backlund-skyline.webp, image px): sampled from the image's
 * own silhouette, on the dark faces of the buildings, never on the sky.
 */
const WINDOWS = [
  '30,867 30,891 50,830 50,847 50,862 73,806 73,829 73,844 73,862 73,884 89,812 89,834 89,850 108,812',
  '125,804 125,820 144,820 164,807 164,844 164,863 179,759 179,774 179,796 179,819 179,842 179,859 179,880',
  '195,757 195,772 252,757 252,775 270,748 270,772 270,796 270,817 270,834 292,710 292,733 292,778 292,793',
  '292,808 308,697 308,742 308,765 308,781 308,803 308,827 324,753 340,790 362,778 384,767 384,782 384,802',
  '384,817 384,833 384,852 398,762 411,692 411,716 411,737 411,761 411,777 430,689 430,713 430,751 443,682',
  '443,697 443,713 443,737 443,759 443,774 466,692 466,712 466,734 484,690 484,750 484,770 484,787 484,802',
  '499,681 499,720 499,742 542,683 542,702 542,726 542,743 555,684 555,717 555,740 569,678 569,700 593,662',
  '593,682 593,705 612,681 612,702 612,724 612,739 612,763 632,666 632,682 632,722 632,742 632,757 645,639',
  '645,658 645,673 645,689 660,638 680,599 680,641 680,664 680,687 702,568 702,592 723,647 737,643 756,662',
  '756,684 756,704 756,726 756,742 769,684 769,699 769,716 769,735 785,693 785,717 785,740 785,758 785,779',
  '806,693 806,716 806,739 828,681 828,721 886,544 886,568 900,541 900,561 900,601 900,640 935,501 949,468',
  '970,443 970,458 970,490 994,431 994,495 1015,449 1030,473 1030,490 1060,472 1060,493 1060,516 1080,477',
  '1080,513 1104,471 1104,494 1104,512 1104,527 1121,479 1121,502 1121,525 1121,541 1142,460 1142,477',
  '1142,517 1142,532 1142,554 1161,449 1161,468 1161,487 1161,506 1174,440 1174,457 1174,478 1212,438',
  '1212,460 1212,478 1236,440 1236,458 1236,474 1236,495 1257,428 1277,257 1277,278 1293,250 1311,241',
  '1311,265 1311,283 1311,301 1332,260 1332,275 1345,248 1345,271 1368,309 1368,327 1382,361 1382,380',
  '1382,397 1382,421 1406,381 1406,401 1427,386 1427,408 1427,423 1457,235 1457,259 1457,278 1457,297',
  '1457,315 1473,206 1473,227 1492,219 1505,187 1505,204 1505,219 1505,240 1505,263 1505,286 1522,211',
  '1536,192 1536,210 1536,233 1536,255 1536,295 1536,317 1560,189 1574,279 1593,435 1609,536 1626,573',
  '1639,529 1639,549 1661,535 1661,553 1661,572 1661,591 1661,614 1681,560 1681,576 1681,594 1702,588',
  '1724,585 1724,605 1724,628 1741,580 1741,619 1741,652 1741,676 1761,570 1761,594 1761,617 1761,635',
  '1777,539 1777,575 1777,596 1795,514 1795,535 1795,551 1795,588 1795,612 1817,559 1834,497 1834,513',
  '1834,532 1854,508 1854,525 1854,542 1854,559 1854,580 1876,556 1876,571 1895,554',
].join(' ');
const SLICE_COUNT = 14;
/** Hashed jitter, so the wave front is ragged rather than a ruler line. */
const jitter = (x: number, y: number) => ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1 + 1) % 1;
const POINTS = WINDOWS.split(' ').map(p => p.split(',').map(Number) as [number, number]);
const SLICES: [number, number][][] = Array.from({length: SLICE_COUNT}, () => []);
for (const [x, y] of POINTS) {
  const k = Math.min(SLICE_COUNT - 1, Math.max(0, Math.floor((x / 1920 + (jitter(x, y) - 0.5) * 0.09) * SLICE_COUNT)));
  SLICES[k]!.push([x, y]);
}

/** Gas lamps along the lower streets. */
const LAMPS: [number, number][] = [[302, 784], [555, 803], [703, 782], [849, 786], [1054, 776], [1311, 810], [1459, 826], [1592, 826], [1734, 767]];

/** Chimney points on the roofline (image px), and how tall their plume stands (x the base height). */
const CHIMNEYS = [
  {x: 874, y: 527, h: .9},
  {x: 1003, y: 393, h: 1},
  {x: 1407, y: 358, h: 1},
  {x: 1680, y: 514, h: 1.15},
  {x: 1850, y: 484, h: 1},
];
</script>

<style scoped>
.paragon {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* a box laid exactly over the skyline image */
.paragon__city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

.paragon__lights {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.paragon__window {
  fill: #ffd38c;
}

/* each slice switches on in turn, west to east, with a gas-light stutter */
.paragon__slice {
  animation: paragon-on .7s steps(1, end) calc(.8s + var(--k) * .11s) backwards;
}

.paragon__slice:nth-child(odd) {
  animation-duration: .55s;
}

@keyframes paragon-on {
  0% { opacity: 0; }
  30% { opacity: .55; }
  45% { opacity: .15; }
  60% { opacity: 1; }
  100% { opacity: 1; }
}

.paragon__lamp {
  animation: paragon-lamp .9s ease-out calc(.8s + var(--k) * .11s) backwards;
}

@keyframes paragon-lamp {
  0% { opacity: 0; }
  25% { opacity: .5; }
  35% { opacity: .2; }
  100% { opacity: 1; }
}

/* the warm haze a lit city throws up under the smog, rising with the lights */
.paragon__haze {
  position: absolute;
  inset: 30% -5% 0;
  background: radial-gradient(60% 70% at 55% 80%, rgba(255, 150, 70, .2), rgba(255, 140, 60, .06) 60%, transparent 85%);
  animation: paragon-haze 2.6s ease-out 1s backwards;
}

@keyframes paragon-haze {
  from { opacity: 0; transform: translate3d(0, 6%, 0); }
}

/* ---- steam: the fog texture rising through a plume's shape, venting on a beat ---- */
.paragon__vent {
  position: absolute;
  width: calc(130 / 1920 * 100%);
  height: calc(var(--h) * 330 / 1080 * 100%);
  translate: -50% -100%;
  /* blended here, on the outermost animated box: anything inside it is its own group */
  mix-blend-mode: screen;
  animation: paragon-steam-in 1.6s ease-out calc(1.3s + var(--n) * .35s) backwards;
}

.paragon__plume {
  position: absolute;
  inset: 0;
  overflow: hidden;
  /* the column's body; the fog texture rolling up through it gives it its billows */
  background: linear-gradient(0deg, rgba(242, 236, 226, .6), rgba(238, 230, 218, .26) 45%, transparent 88%);
  /* narrow at the chimney, billowing out above it, leaning with the night air; it fades as it climbs */
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='white' stop-opacity='0'/%3E%3Cstop offset='.4' stop-color='white' stop-opacity='.75'/%3E%3Cstop offset='1' stop-color='white'/%3E%3C/linearGradient%3E%3Cfilter id='b'%3E%3CfeGaussianBlur stdDeviation='6'/%3E%3C/filter%3E%3C/defs%3E%3Cpath filter='url(%23b)' fill='url(%23g)' d='M45 296 C43 250 30 205 22 160 C12 105 22 40 58 24 C90 12 100 64 90 118 C82 168 62 230 55 296 Z'/%3E%3C/svg%3E") center / 100% 100% no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='white' stop-opacity='0'/%3E%3Cstop offset='.4' stop-color='white' stop-opacity='.75'/%3E%3Cstop offset='1' stop-color='white'/%3E%3C/linearGradient%3E%3Cfilter id='b'%3E%3CfeGaussianBlur stdDeviation='6'/%3E%3C/filter%3E%3C/defs%3E%3Cpath filter='url(%23b)' fill='url(%23g)' d='M45 296 C43 250 30 205 22 160 C12 105 22 40 58 24 C90 12 100 64 90 118 C82 168 62 230 55 296 Z'/%3E%3C/svg%3E") center / 100% 100% no-repeat;
  transform-origin: 50% 100%;
  animation: paragon-vent 2.8s cubic-bezier(.2, .7, .4, 1) calc(1.3s + var(--n) * .35s) infinite;
}

/* two tiles of fog, one above the other, sliding up one tile per loop */
.paragon__flow {
  position: absolute;
  inset: 0 0 -100%;
  background: url('../assets/moon/fog-bank.webp') repeat 74% 0 / 240% 50%;
  filter: brightness(1.8) sepia(.12);
  /* the texture's black adds nothing to the column's body; its clouds lighten it */
  mix-blend-mode: screen;
  animation: paragon-flow 4.2s linear infinite;
}

@keyframes paragon-flow {
  to { transform: translate3d(0, -50%, 0); }
}

/* each vent breathes out hard, then eases */
@keyframes paragon-vent {
  0% { opacity: .55; transform: scale(.96, .94); }
  12% { opacity: 1; transform: scale(1.05, 1.03); }
  45% { opacity: .78; transform: none; }
  100% { opacity: .55; transform: scale(.96, .94); }
}

@keyframes paragon-steam-in {
  from { opacity: 0; transform: scale(.6, .3); }
}

/* light theme: lamplight on a misty morning; the steam reads as soft grey on the paper */
:root[data-theme="parchment"] .paragon__lights {
  opacity: .7;
}

:root[data-theme="parchment"] .paragon__window {
  fill: #e89b3e;
}

:root[data-theme="parchment"] .paragon__vent {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .paragon__plume {
  background: linear-gradient(0deg, rgba(150, 140, 128, .45), rgba(150, 140, 128, .2) 45%, transparent 85%);
}

:root[data-theme="parchment"] .paragon__flow {
  /* grey steam on the paper: the texture inverted, so its clouds darken rather than lighten */
  filter: invert(1) brightness(.92) sepia(.2);
  mix-blend-mode: multiply;
  opacity: .5;
}

:root[data-theme="parchment"] .paragon__haze {
  opacity: .5;
}

@media (prefers-reduced-motion: reduce) {
  .paragon__slice,
  .paragon__lamp,
  .paragon__haze {
    animation: none;
  }

  /* the steam stands still */
  .paragon__vent,
  .paragon__plume,
  .paragon__flow {
    animation: none;
  }

  .paragon__plume {
    opacity: .75;
  }
}
</style>
