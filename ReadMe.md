# imagelicious.org #

An image hosting site using Firebase only.


## Deploying a copy of imagelicious.org ##

### Firebase ###

In the Firebase console:

1. create a new project
2. find and note down the following variables:
    * apiKey
    * authDomain
    * databaseURL
    * storageBucket
3. allow the 'Auth->Sign in Method' for 'Google Sign In'

It is left as an exercise for the reader to be able to add their own custom domain to Firebase (and there is plenty of
Firebase documentation to help you with this).

### Deploying the Site ###

Firstly, clone the repo and install dev dependencies:

```
git clone https://github.com/chilts/imagelicious
cd imagelicious
npm install
```

Set these environment variables with the respective values (see `set-env.sh` for an example). They will be read during
the build phase:

```sh
export FIREBASE_API_KEY="..."
export FIREBASE_AUTH_DOMAIN="..."
export FIREBASE_DATABASE_URL="..."
export FIREBASE_STORAGE_BUCKET="..."
```

Then deploy the site (hosting, database settings, and storage settings):

```
make deploy
```

This will run the build step, deploy the hosting files, the database rules, and storage rules to your new project.

Voila, the site is now ready.

## Author ##

Andrew Chilton:

* [Andrew Chilton's Blog](https://chilts.org/)
* [andychilton on Twitter](https://twitter.com/andychilton)
* [chilts on GitHub](https://github.com/chilts)

## License ##

ISC License (ISC)

Copyright (c) 2016, Apps Attic Ltd <chilts@appsattic.com>.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted,
provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.

(Ends)
