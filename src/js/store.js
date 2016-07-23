// --------------------------------------------------------------------------------------------------------------------

"use strict"

// local
var cfg = require('./cfg.js')
var firebase = require('./firebase.js')

// --------------------------------------------------------------------------------------------------------------------

// only a single instance of the store
var store = {
  page : null,
  args : {},
  user : null,
  msgs : [],
  imgs : {},
  img  : null,
  cache : {},
  listeners : [],

  // `user` will be in one of three states:
  //
  // * `null` - if the current log in state is unknown
  // * `false` - if it is know the user is not logged in
  // * `object` - the logged in user's information
  setUser : function setUser(user) {
    this.user = user
    this.notify()
  },

  getUser : function getUser() {
    return this.user
  },

  init : function init(page, args) {
    this.setPage(page)
    this.setArgs(args)

    // If showing the app, we don't need any initialisation logic since the top-level `imagelicious.js` file listens to
    // firebase.auth().onAuthStateChanged() and sets up a listener for child events on `/user/<uid>` in the database.
    if ( page === 'app' ) {
      // nothing to do here
      this.notify()
      return
    }

    // if we're on the '#sign-in', 
    if ( page === 'sign-in' ) {
      // nothing to do here
      this.notify()
      return
    }

    // if we're on an `#img/$img_id` page, then we should load up the image
    if ( page === 'img' ) {
      // ToDo: check to see if this `img` is already loaded up
      if ( args.img_id in this.cache ) {
        console.log('yes, we have this image in the cache' + args.img_id)
        console.log(this.cache[args.img_id])
        // store.setImg(this.cache[args.img_id])
        this.img = this.cache[args.img_id]
        this.notify()
        return
      }

      console.log('init is trying to fetch this img:', args.img_id)

      this.setImg(null) // "Loading ..."

      // get a reference to this image from it's Google Storage location : https://firebase.google.com/docs/storage/web/download-files
      let url = 'gs://' + cfg.firebase.storageBucket + '/img/' + args.img_id
      let ref = firebase.storage().refFromURL(url)
      let p = ref.getDownloadURL()
      p.then((url) => {
        console.log('*** url=' + url)
        this.setImg({
          img_id : args.img_id,
          url : url,
        })
        console.log('after store.setImg()')
      }).catch((err) => {
        // Handle any errors
        console.log('*** Error getting the download URL: ', err)
        if ( err.code === 'storage/object-not-found' ) {
          this.setImg(false)
        }
      })
    }

    // if anything else ... hmm, we shouldn't ever get here

    this.notify()
  },

  setPage : function setPage(page) {
    this.page = page
    this.notify()
  },

  getPage : function getPage() {
    return this.page
  },

  setArgs : function setArgs(args) {
    this.args = args || {}
    this.notify()
  },

  getArgs : function getPagegetArgs() {
    return this.args
  },

  addMsg : function addMsg(msg) {
    this.msgs.push(msg)
    this.notify()
  },

  getMsgs : function getMsgs() {
    return this.msgs
  },

  imgChanged : function imgChanged(key, val) {
    this.imgs[key] = val
    this.notify()
  },

  imgRemoved : function imgRemoved(key, val) {
    delete this.imgs[key]
    this.notify()
  },

  getImgs : function getImgs() {
    return this.imgs
  },

  countImgs : function countImgs() {
    return Object.keys(this.imgs).length
  },

  // `img` will be in one of 4 states:
  //
  // - null   - loading
  // - false  - image doesn't exist
  // - Error  - failed when loading
  // - object - loaded up correctly
  setImg : function setImg(img) {
    this.img = img
    console.log('setting img:', img)

    // if we have an image, store it in the cache
    if ( img && !(img instanceof Error) ) {
      console.log('yes, we have a proper img, not null, not false and not an error:', img.img_id)
      this.cache[img.img_id] = img
    }

    this.notify()
  },

  getImg : function getImg() {
    return this.img
  },

  listen: function listen(fn) {
    this.listeners.push(fn)
  },

  notify: function notify() {
    this.listeners.forEach((fn) => {
      fn()
    })
  },

  extract: function extract() {
    return JSON.parse(JSON.stringify(this))
  },

  reset: function() {
    // Don't reset everything. The following are left untouched:
    //
    // * page
    // * args
    // * img
    // * listeners
    //
    this.user = null
    this.msgs = []
    this.imgs = {}
    this.cache = {}
  },
}

// --------------------------------------------------------------------------------------------------------------------

module.exports = store

// --------------------------------------------------------------------------------------------------------------------
