PATH := node_modules/.bin:${PATH}

build: clean public html browserify

public:
	mkdir -p public

html:
	m4 --prefix-builtins --define=__MIN__=${MIN} src/index.html > public/index.html

browserify:
	browserify src/js/imagelicious.js --outfile public/imagelicious.js
	uglifyjs --output public/imagelicious.min.js public/imagelicious.js

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
