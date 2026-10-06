/*
 * The scene's weather, drawn off the main thread. SceneWeather hands this worker its
 * canvas (transferControlToOffscreen) and tells it what to draw, how big, and when to run;
 * the worker keeps its own frame loop, so rain and embers never take frame time from the
 * page's scrolling or its other animations. A lightning strike is sent back so the page
 * can flash.
 */
import {createWeather, type WeatherConfig} from './weatherPainter';

type Message =
  | {type: 'init'; canvas: OffscreenCanvas; width: number; height: number}
  | {type: 'size'; width: number; height: number}
  | {type: 'config'; config: WeatherConfig}
  | {type: 'run'; on: boolean}
  | {type: 'still'};

/* the app's tsconfig has no WebWorker lib: just the parts of the worker scope used here */
type WorkerScope = {
  postMessage: (message: unknown) => void;
  onmessage: ((event: MessageEvent<Message>) => void) | null;
  requestAnimationFrame?: (cb: (t: number) => void) => number;
  cancelAnimationFrame?: (id: number) => void;
};
const scope = self as unknown as WorkerScope;
const weather = createWeather(() => scope.postMessage({type: 'strike'}));
let canvas: OffscreenCanvas | null = null;
let running = false;
let handle = 0;
let last = 0;

/* a worker's own frame clock where there is one; a 60 Hz timer elsewhere */
const nextFrame = (cb: (t: number) => void) => (scope.requestAnimationFrame ? scope.requestAnimationFrame(cb) : (setTimeout(() => cb(performance.now()), 16) as unknown as number));
const cancelFrame = (id: number) => (scope.cancelAnimationFrame ? scope.cancelAnimationFrame(id) : clearTimeout(id));

function tick(now: number) {
  handle = 0;
  if (!running) return;
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
  last = now;
  weather.frame(dt);
  handle = nextFrame(tick);
}

function setRunning(on: boolean) {
  running = on;
  if (handle) cancelFrame(handle);
  handle = 0;
  last = 0;
  if (on) handle = nextFrame(tick);
}

scope.onmessage = (event: MessageEvent<Message>) => {
  const message = event.data;
  if (message.type === 'init') {
    canvas = message.canvas;
    canvas.width = message.width;
    canvas.height = message.height;
    const ctx = canvas.getContext('2d');
    if (ctx) weather.setContext(ctx, message.width, message.height);
  } else if (message.type === 'size' && canvas) {
    canvas.width = message.width;
    canvas.height = message.height;
    const ctx = canvas.getContext('2d');
    if (ctx) weather.setContext(ctx, message.width, message.height);
  } else if (message.type === 'config') {
    weather.configure(message.config);
  } else if (message.type === 'run') {
    setRunning(message.on);
  } else if (message.type === 'still') {
    setRunning(false);
    weather.frame(0);
  }
};
