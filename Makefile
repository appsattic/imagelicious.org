PATH := node_modules/.bin:$(PATH)

build: clean public html browserify

public:
	mkdir -p public

html:
	cp src/index.html public/

browserify:
	browserify src/js/imagelicious.js --outfile public/imagelicious.js
	uglifyjs --output public/imagelicious.min.js public/imagelicious.js

server:
	firebase serve

deploy: build
	firebase deploy

deploy-hosting: build
	firebase deploy --only hosting

deploy-database: build
	firebase deploy --only database

deploy-storage: build
	firebase deploy --only storage

clean:
	rm -rf public
