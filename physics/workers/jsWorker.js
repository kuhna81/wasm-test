// JS Worker: runs physics + renders to OffscreenCanvas, posts metrics.
// Uses a simple loop with setTimeout to target ~60 FPS.

let ctx = null;
let W = 640, H = 400;
let particles = 10000;
let speed = 1.0;
let radius = 1;
let bg = '#111111';

// State arrays (Float32)
let posX = null, posY = null, velX = null, velY = null;

// Metrics
const fpsWindow = 60;
let fpsSamples = [];
let lastFrameTime = 0;
let stepSamples = [];
let gcPauses = 0;

// Init
self.onmessage = (ev) => {

	const msg = ev.data;
	if (msg.type === 'init') {
		const canvas = msg.canvas;
		W = msg.width; H = msg.height;
		ctx = canvas.getContext('2d');
		initParticles();
		loop();
	} else if (msg.type === 'settings') {
		const restartNeeded = (particles !== msg.particles);
		particles = msg.particles;
		speed = msg.speed;
		if (restartNeeded) initParticles();
	}
};

function initParticles() {
	posX = new Float32Array(particles);
	posY = new Float32Array(particles);
	velX = new Float32Array(particles);
	velY = new Float32Array(particles);

	for (let i = 0; i < particles; i++) {
		posX[i] = Math.random() * W;
		posY[i] = Math.random() * H;

		// Random velocity with average magnitude ~speed
		const ang = Math.random() * Math.PI * 2;
		const v = (0.25 + Math.random() * 0.75) * speed * 100; // px/sec baseline
		velX[i] = Math.cos(ang) * v;
		velY[i] = Math.sin(ang) * v;
	}
}

function physicsStep(dt) {
	const r = radius;
	const w = W, h = H;
	const start = performance.now();

	for (let i = 0; i < particles; i++) {
		let x = posX[i] + velX[i] * dt;
		let y = posY[i] + velY[i] * dt;

		if (x < r) { x = r; velX[i] = -velX[i]; }
		else if (x > w - r) { x = w - r; velX[i] = -velX[i]; }

		if (y < r) { y = r; velY[i] = -velY[i]; }
		else if (y > h - r) { y = h - r; velY[i] = -velY[i]; }

		posX[i] = x; posY[i] = y;
	}

	const end = performance.now();
	stepSamples.push(end - start);
	if (stepSamples.length > fpsWindow) stepSamples.shift();
}

function render() {
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, W, H);

	ctx.fillStyle = '#4ec9b0';
	const r = radius;
	for (let i = 0; i < particles; i++) {
		// Draw small squares (faster than full arcs)
		ctx.fillRect(posX[i] - r, posY[i] - r, r * 2, r * 2);
	}
}

function loop() {
	const now = performance.now();
	if (lastFrameTime === 0) lastFrameTime = now;
	const dt = Math.min((now - lastFrameTime) / 1000, 0.1); // clamp
	lastFrameTime = now;

	// Detect GC pauses as big gaps (heuristic)
	if (dt > 0.120) gcPauses++;

	physicsStep(dt);
	render();

	// FPS metrics
	const fps = 1000 / (dt * 1000);
	fpsSamples.push(fps);
	if (fpsSamples.length > fpsWindow) fpsSamples.shift();

	// Memory (Chrome-only)
	let heapStr = 'n/a';
	try {
		const mem = performance.memory?.usedJSHeapSize;
		if (mem) heapStr = `${(mem / (1024 * 1024)).toFixed(1)} MB`;
	} catch {}

	postMessage({
		type: 'metrics',
		fps: {
			current: fps,
			avg: average(fpsSamples),
			min: Math.min(...fpsSamples),
			max: Math.max(...fpsSamples),
		},
		step: {
			avg: average(stepSamples),
		},
		memory: {
			heap: heapStr,
			gcPauses,
		},
		config: {
			particles,
			speed
		}
	});

	// Target ~60 FPS
	setTimeout(loop, 1000 / 60);
}

function average(arr) {
	if (!arr.length) return 0;
	let s = 0;
	for (let v of arr) s += v;
	return s / arr.length;
}
