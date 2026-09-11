#include <emscripten/emscripten.h>
#include <cstdlib>
#include <cmath>

// Simple particle state in WASM memory
static float* posX = nullptr;
static float* posY = nullptr;
static float* velX = nullptr;
static float* velY = nullptr;

static int N = 0;
static int WIDTH = 640, HEIGHT = 400;
static float RADIUS = 2.0f;

// Initialize particles (random positions & velocities)
extern "C" {

EMSCRIPTEN_KEEPALIVE
void init_particles(int count, int width, int height, float speedScale, float radius) {
  // cleanup previous
  if (posX) { free(posX); posX = nullptr; }
  if (posY) { free(posY); posY = nullptr; }
  if (velX) { free(velX); velX = nullptr; }
  if (velY) { free(velY); velY = nullptr; }

  N = count;
  WIDTH = width;
  HEIGHT = height;
  RADIUS = radius;

  posX = (float*)malloc(sizeof(float) * N);
  posY = (float*)malloc(sizeof(float) * N);
  velX = (float*)malloc(sizeof(float) * N);
  velY = (float*)malloc(sizeof(float) * N);

  for (int i = 0; i < N; ++i) {
    posX[i] = (float)rand() / (float)RAND_MAX * WIDTH;
    posY[i] = (float)rand() / (float)RAND_MAX * HEIGHT;
    float ang = (float)rand() / (float)RAND_MAX * 6.28318530718f; // 2π
    float v = (0.25f + ((float)rand() / (float)RAND_MAX) * 0.75f) * speedScale * 100.0f;
    velX[i] = cosf(ang) * v;
    velY[i] = sinf(ang) * v;
  }
}

EMSCRIPTEN_KEEPALIVE
void step(float dt) {
  const float w = (float)WIDTH;
  const float h = (float)HEIGHT;
  const float r = RADIUS;

  for (int i = 0; i < N; ++i) {
    float x = posX[i] + velX[i] * dt;
    float y = posY[i] + velY[i] * dt;

    if (x < r) { x = r; velX[i] = -velX[i]; }
    else if (x > w - r) { x = w - r; velX[i] = -velX[i]; }

    if (y < r) { y = r; velY[i] = -velY[i]; }
    else if (y > h - r) { y = h - r; velY[i] = -velY[i]; }

    posX[i] = x; posY[i] = y;
  }
}

// Expose raw pointers for JS to read positions from WASM memory
EMSCRIPTEN_KEEPALIVE
float* get_posX_ptr() { return posX; }

EMSCRIPTEN_KEEPALIVE
float* get_posY_ptr() { return posY; }

EMSCRIPTEN_KEEPALIVE
int get_count() { return N; }

EMSCRIPTEN_KEEPALIVE
void cleanup() {
  if (posX) { free(posX); posX = nullptr; }
  if (posY) { free(posY); posY = nullptr; }
  if (velX) { free(velX); velX = nullptr; }
  if (velY) { free(velY); velY = nullptr; }
  N = 0;
}

} // extern "C"
