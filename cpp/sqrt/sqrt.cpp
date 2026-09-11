#include <cmath>
#include <emscripten.h>

extern "C" {
	EMSCRIPTEN_KEEPALIVE
	double compute_sqrt (double x) {
		return sqrt (x);
	}
}
