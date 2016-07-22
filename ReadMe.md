# imagelicious.org #

> Image hosting service, using only Firebase.

By using Firebase Hosting, Database, and Storage, you can scale up without having to worry about servers, security or
downloads.

## Using the Site ##

To upload images, the user must sign in using their Google Account.

To view images, the user must have a URL with a valid image ID (obtained either directly or indirectly from the
original uploader).

If you are not signed in nor have an image URL, you can't do much on the site. :)

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
git clone https://github.com/appsattic/imagelicious.org
cd imagelicious.org
npm install
```

Set these environment variables with the respective values (see `set-env.sh` for an example). They will be read during
the build phase:

```sh
export FIREBASE_API_KEY="..."          # e.g. abc...123...xyz (a long opaque string)
export FIREBASE_AUTH_DOMAIN="..."      # e.g. my-project.firebaseapp.com
export FIREBASE_DATABASE_URL="..."     # e.g. https://my-project.firebaseio.com
export FIREBASE_STORAGE_BUCKET="..."   # e.g. my-project.appspot.com
export MIN=".min"                      # or just "" when developing
export GA_TRACKING_ID="UA-XXXXXX-XX"   # or just "" when developing
```

Then deploy the site (hosting, database settings, and storage settings):

```
make deploy
```

This will run the build step, deploy the hosting files, the database rules, and storage rules to your new project.

Voila, the site is now ready.

## Why only Google SignIn ##

Google Account sign in was chosen as the simplest method for this demo site. If you'd like to add more providers, just
edit your project and add the relevant links. You may have to take care to detect and show an error for users who log
in with different accounts and have the same email address (or provide for users to link accounts together).

This demo is mainly to show some Firebase features such as image upload in a single page app (SPA) and not to
demonstrate Firebase's Auth features. To see a full demo of all account capabilities, see my
[Firebase Starter])(https://fir-starter-bonfire.firebaseapp.com) project.

## About AppsAttic ##

[AppsAttic](http://appsattic.com/) provides solutions for many JavaScripty problems. We use Node.js on the server,
ReactJS on the client and JavaScript in many other areas. Please get in touch if you'd like to talk to us. :)

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
