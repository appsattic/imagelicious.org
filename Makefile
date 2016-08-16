PATH := node_modules/.bin:${PATH}

# See: http://marmelab.com/blog/2016/02/29/auto-documented-makefile.html

make-help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: clean eslint firebase-config html css js

eslint:
	eslint src/js/*.js

firebase-config:
	m4 --prefix-builtins --define=__FIREBASE_STORAGE_BUCKET__=${FIREBASE_STORAGE_BUCKET} storage.rules.json.m4 > storage.rules.json

public:
	mkdir -p public/img
	mkdir -p public/js
	mkdir -p public/css

html: public
	m4 --prefix-builtins --define=__MIN__=${MIN} --define=__GA__=${GA_TRACKING_ID} src/index.html > public/index.html
	cp src/img/* public/img/

css: public
	cp src/css/* public/css/
	cleancss --output public/css/styles.min.css src/css/styles.css

js:
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

deploy-storage: firebase-config
	firebase deploy --only storage

clean:
	rm -rf public

.PHONY: public
