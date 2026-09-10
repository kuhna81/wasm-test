// cpp-primes/primes.cpp
#include <vector>
#include <cstdint>
#include <cmath>
#include <emscripten/bind.h>

/**
 * Compute prime numbers from 0 to 'maximum_value' using the Sieve of Eratosthenes.
 * Returns a vector of prime numbers (uint32_t).
 */
std::vector<uint32_t> sieve_primes(uint32_t maximum_value) {
    // Handle small inputs early
    if (maximum_value < 2) {
        return {};
    }

    // 'is_composite_flags[i] == 1' means i is composite; 0 means "not yet marked composite"
    std::vector<uint8_t> is_composite_flags(static_cast<size_t>(maximum_value) + 1, 0);

    // 0 and 1 are not prime numbers
    is_composite_flags[0] = 1;
    is_composite_flags[1] = 1;

    // Pre-allocate an estimated capacity to reduce reallocations
    // Using n / ln(n) as a rough upper bound on π(n)
    double maximum_value_as_double = static_cast<double>(maximum_value);
    size_t estimated_prime_count =
        static_cast<size_t>(maximum_value_as_double / std::max(1.0, std::log(maximum_value_as_double)));

    std::vector<uint32_t> prime_numbers;
    prime_numbers.reserve(estimated_prime_count);

    uint32_t square_root_limit = static_cast<uint32_t>(std::sqrt(maximum_value));

    // Main sieve loop
    for (uint32_t current_prime_candidate = 2; current_prime_candidate <= maximum_value; ++current_prime_candidate) {
        if (is_composite_flags[current_prime_candidate] == 0) {
            // Found a prime
            prime_numbers.push_back(current_prime_candidate);

            // Mark composites for current_prime_candidate up to sqrt(limit)
            if (current_prime_candidate <= square_root_limit) {
                uint32_t multiple_value = current_prime_candidate * current_prime_candidate;
                while (multiple_value <= maximum_value) {
                    is_composite_flags[multiple_value] = 1;
                    multiple_value += current_prime_candidate;
                }
            }
        }
    }

    return prime_numbers;
}

// ---- Embind bindings ----
EMSCRIPTEN_BINDINGS(primes_module) {
    emscripten::function("sieve_primes", &sieve_primes);
    emscripten::register_vector<uint32_t>("VectorUint32");
}
