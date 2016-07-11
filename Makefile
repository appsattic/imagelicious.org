PATH := node_modules/.bin:$(PATH)

build: clean public html browserify

public:
	mkdir -p public

html:
	cp src/index.html public/

browserify:
	browserify src/js/imagelicious.js --transform [ babelify --presets [ es2015 react ] ] --transform browserify-shim --outfile public/imagelicious.js
	uglifyjs --output public/imagelicious.min.js public/imagelicious.js

server:
	firebase serve

deploy: build
	firebase deploy

clean:
	rm -rf public
