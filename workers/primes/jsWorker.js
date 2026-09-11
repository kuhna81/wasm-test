// workers/jsWorker.js
// Dedicated module worker to keep the UI responsive.

function computePrimeNumbersUpTo(maximumValue) {
  if (maximumValue < 2) return [];

  // isCompositeFlags[i] === 1 => i is composite; 0 => not marked composite
  const isCompositeFlags = new Uint8Array(maximumValue + 1);
  isCompositeFlags[0] = 1;
  isCompositeFlags[1] = 1;

  const squareRootLimit = Math.floor(Math.sqrt(maximumValue));

  // Mark composites for each prime candidate up to sqrt(limit)
  for (let currentPrimeCandidate = 2; currentPrimeCandidate <= squareRootLimit; currentPrimeCandidate++) {
    if (isCompositeFlags[currentPrimeCandidate] === 0) {
      let multipleValue = currentPrimeCandidate * currentPrimeCandidate;
      while (multipleValue <= maximumValue) {
        isCompositeFlags[multipleValue] = 1;
        multipleValue += currentPrimeCandidate;
      }
    }
  }

  // Collect prime numbers
  const primeNumbers = [];
  for (let value = 2; value <= maximumValue; value++) {
    if (isCompositeFlags[value] === 0) {
      primeNumbers.push(value);
    }
  }
  return primeNumbers;
}

self.onmessage = (messageEvent) => {
  const { limit } = messageEvent.data;
  const startTimestampMs = performance.now();
  const primeNumbers = computePrimeNumbersUpTo(limit);
  const endTimestampMs = performance.now();

  self.postMessage({
    engineName: 'JavaScript',
    elapsedTimeMs: endTimestampMs - startTimestampMs,
    primeNumbers
  });
};
