// --------------------------------------------------------------------------------------------------------------------

"use strict"

// local
var firebase = require('./firebase.js')
var slugitAll = require('./slugit-all.js')

// --------------------------------------------------------------------------------------------------------------------

// only a single instance of the store
var store = {
  page : null,
  args : {},
  user : null,
  msgs : [],
  imgs : {},
  tag  : {},
  filter : {
    sort : {
      'Newest First' : true,
      'Oldest First' : false,
    },
  },
  img  : null,
  edit : null,
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

    // if we're on the '#sign-in'
    if ( page === 'sign-in' ) {
      // nothing to do here
      this.notify()
      return
    }

    // if we're on an `#img/$imgId` page, then we should load up the image
    if ( page === 'img' ) {
      const imgId = args.imgId

      // ToDo: check to see if this `img` is already loaded up
      if ( imgId in this.cache ) {
        this.img = this.cache[imgId]
        this.notify()
        return
      }

      // see if this image is in the users list already
      if ( imgId in this.imgs ) {
        // get a copy of this image for the cache
        const img = Object.assign({}, this.imgs[imgId])
        // save into the current image
        this.img = img
        // ... and into the cache
        this.cache[imgId] = img
        this.notify()
        return
      }

      this.setImg(null)

      // get this image from the datastore
      const imgRef = firebase.database().ref().child('img').child(imgId)
      imgRef.once('value').then((data) => {
        this.setImg(data.val())
      }, (err) => {
        console.log('Error loading info:', err)
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

  imgChanged : function imgChanged(key, img) {
    // We need to do a few things here:
    // 1. save the key into the img object too
    // 2. parse the tag string into a tag array
    // 3. add those tags to our overall tag list

    img.key = key
    img.tags = slugitAll(img.tag)
    this.imgs[key] = img

    // add these tags to the overall tag map
    img.tags.forEach((tag) => {
      this.tag[tag] = true
    })

    // save this to the cache
    this.cache[key] = img

    // and notify of changes
    this.notify()
  },

  imgRemoved : function imgRemoved(key, val) {
    delete this.imgs[key]
    this.notify()
  },

  getImgs : function getImgs() {
    return this.imgs
  },

  getTag : function getTag() {
    return this.tag
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

    // if we have an image, store it in the cache
    if ( img && !(img instanceof Error) ) {
      // proper image (not null, not false and not an error)
      this.cache[img.imgId] = img
    }

    this.notify()
  },

  getImg : function getImg() {
    return this.img
  },

  getFilters : function getFilters() {
    return this.filter
  },

  getFilter : function getFilter(parent, child) {
    if ( !(parent in this.filter) ) {
      throw new Error("store.getFilter() - Unknown parent : " + parent)
    }
    if ( !(child in this.filter[parent] ) ) {
      throw new Error("store.getFilter() - Unknown parent/child : " + parent + '/' + child)
    }
    return this.filter[parent][child]
  },

  setFilter : function setFilter(parent, child) {
    if ( !(parent in this.filter) ) {
      throw new Error("store.filter() - Unknown parent : " + parent)
    }
    if ( !(child in this.filter[parent] ) ) {
      throw new Error("store.filter() - Unknown parent/child : " + parent + '/' + child)
    }
    // reset all other children
    Object.keys(this.filter[parent]).forEach((key) => {
      this.filter[parent][key] = false
    })
    this.filter[parent][child] = true
    this.notify()
  },

  setEdit : function setEdit(obj) {
    this.edit = obj
    this.notify()
  },

  getEdit : function getEdit() {
    return this.edit
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
    this.tag = {}
    this.cache = {}
    this.filter = {
      sort : {
        'Newest First' : true,
        'Oldest First' : false,
      },
    }
  },

}

// --------------------------------------------------------------------------------------------------------------------

module.exports = store

// --------------------------------------------------------------------------------------------------------------------
