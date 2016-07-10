PATH := node_modules/.bin:$(PATH)

build: clean public html browserify

public:
	mkdir -p public

html:
	cp src/index.html public/

browserify:
	browserify src/js/app.js --transform [ babelify --presets [ es2015 react ] ] --transform browserify-shim | uglifyjs -c > public/app.min.js

server:
	firebase serve

deploy:
	firebase deploy

clean:
	rm -rf public
