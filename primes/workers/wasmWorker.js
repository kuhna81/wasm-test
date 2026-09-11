let factory, moduleInstance, wasmReady;

const modulePath = '../wasm/primes.js';
const pathPrefix = '../wasm/';

async function init() {
  if (moduleInstance) return moduleInstance;
  factory = (await import(modulePath)).default;
  moduleInstance = await factory({
    locateFile: (filename) => pathPrefix + filename
  });
  return moduleInstance;
}

(async () => {
	factory = (await import(modulePath)).default;

	wasmReady = factory({
		locateFile: (filename) => pathPrefix + filename
	}).then((instance) => {
		moduleInstance = instance;
		console.log('wasm module initialized');
	});
})();

self.onmessage = async ({ data }) => {
	const { limit } = data;

	const t0 = performance.now();
	//const mod = await init();
	const primeNumbers = moduleInstance.sieve_primes_js(limit);

	const t1 = performance.now();
	self.postMessage({
		engineName: 'WASM (C++ via Emscripten)',
		elapsedTimeMs: t1 - t0,
		primeNumbers
	});
};
