em++ lib.cpp -O3 -std=c++17 \
	--bind \
	-o lib.js \
	-s WASM=1 \
	-s MODULARIZE=1 \
	-s EXPORT_ES6=1 \
	-s ENVIRONMENT=web \
	-s ALLOW_MEMORY_GROWTH=1
