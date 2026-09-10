// workers/cppWorker.js
// Module worker to import the ES module emitted by Emscripten.

let wasmModuleFactory = null;
let wasmModuleInstance = null;

/**
 * Initialize the Emscripten module once.
 * We use locateFile so the module can find primes.wasm next to primes.js.
 */
async function initializeWasmModule() {
  if (wasmModuleInstance) return wasmModuleInstance;

  // Path is relative to THIS worker file when imported.
  const modulePath = '../cpp/lib.js';
  const wasmPathPrefix = '../cpp/';

  if (!wasmModuleFactory) {
    wasmModuleFactory = (await import(modulePath)).default;
  }

  wasmModuleInstance = await wasmModuleFactory({
    locateFile: (filename) => wasmPathPrefix + filename
  });

  return wasmModuleInstance;
}

self.onmessage = async (messageEvent) => {
  const { limit } = messageEvent.data;

  const startTimestampMs = performance.now();
  const moduleInstance = await initializeWasmModule();

  // Call the C++ function bound via Embind; it returns a JS Array (VectorUint32 converted).
  const primeNumbers = moduleInstance.sieve_primes(limit);

  const endTimestampMs = performance.now();

  self.postMessage({
    engineName: 'WASM (C++ via Emscripten)',
    elapsedTimeMs: endTimestampMs - startTimestampMs,
    primeNumbers
  });
};
