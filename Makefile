PATH := node_modules/.bin:${PATH}

build: clean public html browserify

public:
	mkdir -p public/img
	mkdir -p public/js
	mkdir -p public/css

html:
	m4 --prefix-builtins --define=__MIN__=${MIN} --define=__GA__=${GA_TRACKING_ID} src/index.html > public/index.html
	cp src/css/* public/css/
	cp src/img/* public/img/

browserify:
	browserify src/js/imagelicious.js --outfile public/js/imagelicious.js
	uglifyjs --output public/js/imagelicious.min.js public/js/imagelicious.js

server:
	firebase serve

deploy: build
	firebase deploy

deploy-hosting: build
	firebase deploy --only hosting

deploy-database:
	firebase deploy --only database

deploy-storage:
	firebase deploy --only storage

clean:
	rm -rf public

.PHONY: public
