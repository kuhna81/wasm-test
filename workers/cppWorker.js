let factory, moduleInstance;

async function init() {
  if (moduleInstance) return moduleInstance;
  factory = (await import('../cpp/lib.js')).default;
  moduleInstance = await factory({
    locateFile: (filename) => '../cpp/' + filename
  });
  return moduleInstance;
}

self.onmessage = async ({ data }) => {
	/*
	const mod = await init();
	const r = mod.sieve_primes(20);
	console.log('repr:', r.toString?.(), r);
	console.log('has size():', typeof r.size === 'function');
	console.log('size():', typeof r.size === 'function' ? r.size() : 'no size');
	console.log('first few:', typeof r.get === 'function' ? [r.get(0), r.get(1), r.get(2)] : 'no get');
	*/
  const { limit } = data;
  const t0 = performance.now();
  const mod = await init();

  const primeNumbers = mod.sieve_primes_js(limit);

  const t1 = performance.now();
  self.postMessage({
    engineName: 'WASM (C++ via Emscripten)',
    elapsedTimeMs: t1 - t0,
    primeNumbers
  });
};
