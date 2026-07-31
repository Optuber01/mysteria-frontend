<template>
  <div
    class="altar"
    :class="{ 'is-blueprint': blueprint }"
    role="group"
    aria-label="Interactive Normal-tier Ritual Altar model"
    tabindex="0"
    @keydown="onKeydown"
  >
    <div
      class="altar__viewport"
      :class="{ 'is-dragging': dragging }"
      @pointerdown="startDrag"
      @pointermove="drag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
    >
      <div class="altar__beam" aria-hidden="true" />
      <div
        class="altar__grid"
        :style="{ transform: `translate(-50%, -50%) rotateX(${pitch}deg) rotateZ(${yaw}deg) scale(${zoom})` }"
      >
        <div
          v-for="(block, index) in blocks"
          :key="index"
          class="altar-block"
          :class="[`is-${block.kind}`, { 'is-built': isBuilt(index) }]"
          :style="{ '--order': String(index), '--x': String(block.x), '--z': String(block.z), '--y': String(block.y) }"
          aria-hidden="true"
        >
          <i class="face face--top" />
          <i class="face face--left" />
          <i class="face face--right" />
        </div>
      </div>
      <button
        v-for="item in projectedBlocks"
        :key="`hotspot-${item.index}`"
        class="altar-hotspot"
        :class="{ 'is-built': isBuilt(item.index) }"
        :style="item.style"
        type="button"
        :aria-label="`${item.block.label}, block ${item.index + 1} of ${blocks.length}`"
        :aria-describedby="`progression-detail-altar-${item.block.detailId}`"
        :aria-pressed="isBuilt(item.index)"
        @pointerdown.stop
        @pointerenter="emitInspect(item.block.detailId, $event)"
        @pointerleave="emit('clear')"
        @focus="emitInspect(item.block.detailId, $event)"
        @blur="emit('clear')"
        @click="toggleBlock(item.index, item.block.detailId, $event)"
      ><span>{{ item.index + 1 }}</span></button>
    </div>

    <div class="altar__controls" aria-label="Altar view controls">
      <button type="button" :aria-pressed="blueprint" @click="blueprint = !blueprint">
        {{ blueprint ? 'Blueprint' : 'Built' }}
      </button>
      <button type="button" aria-label="Rotate altar left" @click="yaw -= 15">↶</button>
      <button type="button" aria-label="Rotate altar right" @click="yaw += 15">↷</button>
      <button type="button" aria-label="Zoom out" @click="setZoom(zoom - .1)">−</button>
      <button type="button" aria-label="Zoom in" @click="setZoom(zoom + .1)">+</button>
      <button type="button" @click="resetView">Reset view</button>
    </div>
    <p class="altar__hint">Drag to rotate · click a guide block to place it · arrow keys and +/− also work</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

const props = withDefaults(defineProps<{ progress?: number }>(), { progress: 0 });
const emit = defineEmits<{
  inspect: [payload: { id: string; anchor: HTMLElement }];
  toggleInspect: [payload: { id: string; anchor: HTMLElement }];
  clear: [];
}>();

type AltarBlock = { x:number; y:number; z:number; kind:'stone'|'corner'|'candle'|'core'; label:string; detailId:string };
const blocks: AltarBlock[] = [];
for (let z=-1; z<=1; z+=1) for (let x=-1; x<=1; x+=1) blocks.push({ x,y:0,z,kind:'stone',label:'Stone-brick base block',detailId:'altar-materials' });
for (const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]) blocks.push({ x,y:1,z,kind:'corner',label:'Chiseled stone-brick corner',detailId:'altar-materials' });
for (const [x,z] of [[0,-1],[-1,0],[1,0],[0,1]]) blocks.push({ x,y:1,z,kind:'candle',label:'Lit triple-candle cluster',detailId:'altar-blueprint' });
blocks.push({ x:0,y:1,z:0,kind:'core',label:'Functional enchanting-table core',detailId:'altar-core' });

const yaw=ref(45); const pitch=ref(54); const zoom=ref(1); const dragging=ref(false); const blueprint=ref(true);
const placed=ref<number[]>([]); let startX=0; let startY=0; let startYaw=0; let startPitch=0;
const compact=ref(false); let media:MediaQueryList|null=null;
const markerOffsets:Record<number,[number,number]>={0:[-24,0],1:[24,0],3:[-24,0],4:[55,0],9:[0,28]};
const scrollBuiltCount=computed(()=>Math.floor(props.progress*blocks.length));
const projectedBlocks=computed(()=>{
  const unit=compact.value?80:96; const rz=yaw.value*Math.PI/180; const rx=pitch.value*Math.PI/180;
  return blocks.map((block,index)=>{
    const x1=block.x*Math.cos(rz)-block.z*Math.sin(rz); const y1=block.x*Math.sin(rz)+block.z*Math.cos(rz); const z1=block.y+.5;
    const y2=y1*Math.cos(rx)-z1*Math.sin(rx); const z2=y1*Math.sin(rx)+z1*Math.cos(rx);
    const [offsetX,offsetY]=markerOffsets[index]??[0,0];
    return {block,index,style:{left:`calc(50% + ${x1*unit*zoom.value+offsetX}px)`,top:`calc(48% + ${y2*unit*zoom.value+offsetY}px)`,zIndex:String(Math.round(100+z2*10))}};
  });
});
function isBuilt(index:number){ return !blueprint.value || placed.value.includes(index) || index<scrollBuiltCount.value; }
function anchor(event:Event){ return event.currentTarget instanceof HTMLElement ? event.currentTarget : null; }
function emitInspect(id:string,event:Event){ const element=anchor(event); if(element) emit('inspect',{id,anchor:element}); }
function toggleBlock(index:number,id:string,event:Event){ placed.value=placed.value.includes(index)?placed.value.filter(value=>value!==index):[...placed.value,index]; const element=anchor(event); if(element) emit('toggleInspect',{id,anchor:element}); }
function setZoom(value:number){ zoom.value=Math.min(1.3,Math.max(.65,value)); }
function resetView(){ yaw.value=45; pitch.value=54; zoom.value=1; }
function startDrag(event:PointerEvent){ if(event.button!==0)return; dragging.value=true; startX=event.clientX; startY=event.clientY; startYaw=yaw.value; startPitch=pitch.value; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); }
function drag(event:PointerEvent){ if(!dragging.value)return; yaw.value=startYaw+(event.clientX-startX)*.32; if(event.pointerType!=='touch') pitch.value=Math.min(68,Math.max(35,startPitch-(event.clientY-startY)*.22)); }
function endDrag(event:PointerEvent){ dragging.value=false; const target=event.currentTarget as HTMLElement; if(target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId); }
function onKeydown(event:KeyboardEvent){
  if(event.key==='ArrowLeft'){yaw.value-=10;event.preventDefault()} else if(event.key==='ArrowRight'){yaw.value+=10;event.preventDefault()}
  else if(event.key==='ArrowUp'){pitch.value=Math.min(68,pitch.value+5);event.preventDefault()} else if(event.key==='ArrowDown'){pitch.value=Math.max(35,pitch.value-5);event.preventDefault()}
  else if(event.key==='+'||event.key==='='){setZoom(zoom.value+.1);event.preventDefault()} else if(event.key==='-'){setZoom(zoom.value-.1);event.preventDefault()}
  else if(event.key.toLowerCase()==='r'){resetView();event.preventDefault()}
}
function syncCompact(){compact.value=Boolean(media?.matches)}
onMounted(()=>{media=matchMedia('(max-width:680px)');syncCompact();media.addEventListener('change',syncCompact)});
onUnmounted(()=>media?.removeEventListener('change',syncCompact));
</script>

<style scoped>
.altar{--unit:96px;position:relative;width:min(640px,100%);height:420px;display:grid;grid-template-rows:1fr auto auto;gap:8px;filter:drop-shadow(0 28px 22px rgba(0,0,0,.45));outline:none}
.altar:focus-visible{outline:3px solid #f0d38c;outline-offset:5px;border-radius:16px}
.altar__viewport{position:relative;min-height:310px;overflow:visible;touch-action:pan-y;cursor:grab;perspective:1000px;border-radius:20px;background:radial-gradient(circle at 50% 54%,rgba(71,139,119,.16),transparent 55%)}
.altar__viewport.is-dragging{cursor:grabbing}
.altar__grid{position:absolute;top:48%;left:50%;width:var(--unit);height:var(--unit);transform-style:preserve-3d;transition:transform .25s cubic-bezier(.22,1,.36,1)}
.is-dragging .altar__grid{transition:none}
.altar-block{--texture:url('@/assets/images/home/progression/blocks/glass.png');position:absolute;left:calc(var(--x)*var(--unit));top:calc(var(--z)*var(--unit));width:var(--unit);height:var(--unit);padding:0;border:0;background:transparent;opacity:.55;pointer-events:none;transform:translate3d(-50%,-50%,calc(var(--y)*var(--unit)));transform-style:preserve-3d;transition:opacity .25s ease,filter .25s ease}
.altar-block.is-built{--texture:url('@/assets/images/home/progression/blocks/stone_bricks.png');opacity:1}
.altar-block.is-corner.is-built{--texture:url('@/assets/images/home/progression/blocks/chiseled_stone_bricks.png')}
.altar-block.is-core.is-built{--texture:url('@/assets/images/home/progression/blocks/enchanting_table_top.png')}
.face{position:absolute;inset:0;display:block;background:var(--texture) center/100% 100%;image-rendering:pixelated;backface-visibility:hidden}
.face--top{transform:translateZ(calc(var(--unit)/2));filter:brightness(1.12)}
.face--left{transform:rotateY(-90deg) translateZ(calc(var(--unit)/2));filter:brightness(.64)}
.face--right{transform:rotateX(90deg) translateZ(calc(var(--unit)/2));filter:brightness(.8)}
.altar-block.is-core .face--left,.altar-block.is-core .face--right{background-image:url('@/assets/images/home/progression/blocks/enchanting_table_side.png')}
.altar-block.is-candle .face--top{background:url('@/assets/images/home/progression/blocks/candle.png') center/contain no-repeat;filter:drop-shadow(0 0 8px rgba(245,201,98,.8))}
.altar-block.is-candle .face--left,.altar-block.is-candle .face--right{display:none}
.altar-hotspot{position:absolute;width:44px;height:44px;padding:0;border:1px solid rgba(223,185,104,.18);border-radius:50%;color:transparent;background:rgba(223,185,104,.025);transform:translate(-50%,-50%);cursor:pointer;transition:border-color .18s,background-color .18s,box-shadow .18s}
.altar-hotspot span{font:600 .48rem/1 "IBM Plex Mono",monospace;opacity:0}
.altar-hotspot:hover,.altar-hotspot:focus-visible{color:#fcf9f2;border-color:#f0d38c;background:rgba(7,27,27,.78);box-shadow:0 0 0 4px rgba(223,185,104,.12)}
.altar-hotspot:hover span,.altar-hotspot:focus-visible span{opacity:1}
.altar-hotspot:focus-visible{outline:3px solid #f0d38c;outline-offset:2px}
.altar-hotspot.is-built{border-color:rgba(127,199,165,.28)}
.altar__beam{position:absolute;inset:4% 27% 3%;border-radius:50%;background:linear-gradient(180deg,transparent,rgba(120,174,202,.22) 40%,rgba(137,209,183,.18) 72%,transparent);filter:blur(20px);pointer-events:none}
.altar__controls{display:flex;justify-content:center;flex-wrap:wrap;gap:6px}
.altar__controls button{min-width:44px;min-height:44px;padding:0 13px;border:1px solid rgba(223,185,104,.3);border-radius:10px;color:#fcf9f2;background:rgba(7,27,27,.9);font:650 .62rem/1 "IBM Plex Mono",monospace;cursor:pointer}
.altar__controls button:first-child{min-width:100px;color:#dfb968}
.altar__controls button:hover{border-color:#dfb968}.altar__controls button:focus-visible{outline:3px solid #f0d38c;outline-offset:2px}
.altar__hint{margin:2px 0 0;text-align:center;color:rgba(252,249,242,.55);font:500 .53rem/1.4 "IBM Plex Mono",monospace}
@media(max-width:680px){.altar{--unit:80px;width:100%;height:390px}.altar__viewport{min-height:288px}.altar__hint{font-size:.48rem}}
@media(prefers-reduced-motion:reduce){.altar__grid,.altar-block{transition:none}}
</style>
