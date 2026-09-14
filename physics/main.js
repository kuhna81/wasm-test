const jsCanvas = document.getElementById('jsCanvas');
const wasmCanvas = document.getElementById('wasmCanvas');

const jsMetrics = document.getElementById('jsMetrics');
const wasmMetrics = document.getElementById('wasmMetrics');

const form = document.getElementById('controlForm');
const resetBtn = document.getElementById('resetBtn');

const particleCount = document.getElementById('particleCount');
const particleCountOut = document.getElementById('particleCountOut');

const speedScale = document.getElementById('speedScale');
const speedScaleOut = document.getElementById('speedScaleOut');

particleCount.addEventListener('input', () => {
	particleCountOut.textContent = Number(particleCount.value).toLocaleString();
	broadcastSettings();
});

speedScale.addEventListener('input', () => {
	speedScaleOut.textContent = `${ Number(speedScale.value).toFixed(1) }x`;
	broadcastSettings();
});

resetBtn.addEventListener('click', () => {
	startWorkers(true);
});

let jsWorker = null;
let wasmWorker = null;

function startWorkers(restart = false) {
	if (restart) {
		jsWorker?.terminate();
		wasmWorker?.terminate();
	}

	const jsOff = jsCanvas.transferControlToOffscreen();
	const wasmOff = wasmCanvas.transferControlToOffscreen();

	jsWorker = new Worker('workers/jsWorker.js', { type: 'module' });
	wasmWorker = new Worker('workers/wasmWorker.js', { type: 'module' });

	jsWorker.postMessage({
		type: 'init',
		canvas: jsOff,
		width: jsCanvas.width,
		height: jsCanvas.height
	}, [jsOff]);

	wasmWorker.postMessage({
		type: 'init',
		canvas: wasmOff,
		width: wasmCanvas.width,
		height: wasmCanvas.height
	}, [wasmOff]);

	jsWorker.onmessage = (e) => handleMetrics(e.data, jsMetrics, 'JS');
	wasmWorker.onmessage = (e) => handleMetrics(e.data, wasmMetrics, 'WASM');

	broadcastSettings();
}

function broadcastSettings() {
	const settings = {
		type: 'settings',
		particles: Number(particleCount.value),
		speed: Number(speedScale.value)
	};

	jsWorker?.postMessage(settings);
	wasmWorker?.postMessage(settings);
}

function handleMetrics(data, panel, tag) {
	// complete [!!!]
}

startWorkers(false);
