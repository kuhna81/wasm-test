// Main thread: creates OffscreenCanvas for each <canvas>, starts workers,
// and keeps the metrics panel updated from worker messages.

const jsCanvasEl = document.getElementById('jsCanvas');
const wasmCanvasEl = document.getElementById('wasmCanvas');

const jsMetricsEl = document.getElementById('jsMetrics');
const wasmMetricsEl = document.getElementById('wasmMetrics');

const form = document.getElementById('controlForm');
const particleCount = document.getElementById('particleCount');
const particleCountOut = document.getElementById('particleCountOut');
const speedScale = document.getElementById('speedScale');
const speedScaleOut = document.getElementById('speedScaleOut');
const radiusEl = document.getElementById('radius');
const radiusOut = document.getElementById('radiusOut');
const bgEl = document.getElementById('bg');
const restartBtn = document.getElementById('restartBtn');

particleCount.addEventListener('input', () => {
  particleCountOut.textContent = Number(particleCount.value).toLocaleString();
  broadcastSettings();
});
speedScale.addEventListener('input', () => {
  speedScaleOut.textContent = `${Number(speedScale.value).toFixed(1)}×`;
  broadcastSettings();
});
radiusEl.addEventListener('input', () => {
  radiusOut.textContent = `${radiusEl.value} px`;
  broadcastSettings();
});
bgEl.addEventListener('input', () => {
  updateCanvasBackground(bgEl.value);
  broadcastSettings();
});

restartBtn.addEventListener('click', () => {
  startWorkers(true);
});

function updateCanvasBackground(color) {
  jsCanvasEl.style.background = color;
  wasmCanvasEl.style.background = color;
}

// Workers
let jsWorker = null;
let wasmWorker = null;

function startWorkers(restart = false) {
  if (restart) {
    jsWorker?.terminate();
    wasmWorker?.terminate();
  }
  // Create OffscreenCanvas and transfer control
  const jsOff = jsCanvasEl.transferControlToOffscreen();
  const wasmOff = wasmCanvasEl.transferControlToOffscreen();

  jsWorker = new Worker('workers/physics/jsWorker.js', { type: 'module' });
  wasmWorker = new Worker('workers/physics/wasmWorker.js', { type: 'module' });

  // Initial boot messages with canvas
  jsWorker.postMessage({
    type: 'init',
    canvas: jsOff,
    width: jsCanvasEl.width,
    height: jsCanvasEl.height
  }, [jsOff]);

  wasmWorker.postMessage({
    type: 'init',
    canvas: wasmOff,
    width: wasmCanvasEl.width,
    height: wasmCanvasEl.height
  }, [wasmOff]);

  // Hook metrics
  jsWorker.onmessage = (ev) => handleMetrics(ev.data, jsMetricsEl, 'JS');
  wasmWorker.onmessage = (ev) => handleMetrics(ev.data, wasmMetricsEl, 'WASM');

  // Send current settings
  broadcastSettings();
}

function broadcastSettings() {
  const settings = {
    type: 'settings',
    particles: Number(particleCount.value),
    speed: Number(speedScale.value),
    radius: Number(radiusEl.value),
    bg: bgEl.value
  };
  jsWorker?.postMessage(settings);
  wasmWorker?.postMessage(settings);
}

function handleMetrics(data, panelEl, tag) {
  if (data?.type === 'metrics') {
    // Update DOM
    panelEl.querySelector('.fps-current').textContent = data.fps.current.toFixed(1);
    panelEl.querySelector('.fps-avg').textContent = data.fps.avg.toFixed(1);
    panelEl.querySelector('.fps-min').textContent = data.fps.min.toFixed(1);
    panelEl.querySelector('.fps-max').textContent = data.fps.max.toFixed(1);
    panelEl.querySelector('.step-avg').textContent = data.step.avg.toFixed(2);
    panelEl.querySelector('.particles').textContent = data.config.particles.toLocaleString();
    panelEl.querySelector('.speed').textContent = data.config.speed.toFixed(1);

    const heapEl = panelEl.querySelector('.heap');
    if (tag === 'JS') {
      heapEl.textContent = data.memory.heap ?? 'n/a';
      panelEl.querySelector('.gc').textContent = data.memory.gcPauses ?? '0';
    } else {
      heapEl.textContent = data.memory.wasm ?? 'n/a';
    }
  } else if (data?.type === 'log') {
    console.log(`[${tag}]`, data.message);
  }
}

// Boot
updateCanvasBackground(bgEl.value);
startWorkers(false);

