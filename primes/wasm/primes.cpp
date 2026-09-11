#include <vector>
#include <cstdint>
#include <cmath>
#include <emscripten/bind.h>
#include <emscripten/val.h>

std::vector<uint32_t> sieve_primes_internal(uint32_t maximum_value) {
    if (maximum_value < 2) return {};
    std::vector<uint8_t> is_composite(static_cast<size_t>(maximum_value) + 1, 0);
    is_composite[0] = 1; is_composite[1] = 1;

    uint32_t sqrt_limit = static_cast<uint32_t>(std::sqrt(maximum_value));
    for (uint32_t p = 2; p <= sqrt_limit; ++p) {
        if (is_composite[p] == 0) {
            uint32_t m = p * p;
            while (m <= maximum_value) {
                is_composite[m] = 1;
                m += p;
            }
        }
    }

    // Reserve ~n / ln(n) (upper bound on number of primes <= n)
    size_t reserve_count = static_cast<size_t>(
        static_cast<double>(maximum_value) /
        std::max(1.0, std::log(static_cast<double>(maximum_value)))
    );
    std::vector<uint32_t> primes;
    primes.reserve(reserve_count);

    for (uint32_t i = 2; i <= maximum_value; ++i) {
        if (is_composite[i] == 0) primes.push_back(i);
    }
    return primes;
}

// Return a real JS Array
emscripten::val sieve_primes_js(uint32_t maximum_value) {
    std::vector<uint32_t> primes = sieve_primes_internal(maximum_value);
    emscripten::val jsArray = emscripten::val::array();
    for (size_t i = 0; i < primes.size(); ++i) {
        jsArray.set(i, emscripten::val(primes[i]));
    }
    return jsArray;
}

EMSCRIPTEN_BINDINGS(primes_module) {
    emscripten::function("sieve_primes_js", &sieve_primes_js);
}

