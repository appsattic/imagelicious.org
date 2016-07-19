// --------------------------------------------------------------------------------------------------------------------

"use strict"

// --------------------------------------------------------------------------------------------------------------------

// only a single instance of the store
var store = {
  hash : null,
  page : null,
  args : {},
  user : null,
  msgs : [],
  imgs : {},
  listeners : [],

  setUser : function setUser(user) {
    this.user = user
    this.notify()
  },

  getUser : function getUser() {
    return this.user
  },

  setHash : function setHash(hash) {
    this.hash = hash
    this.notify()
  },

  getHash : function getHash() {
    return this.hash
  },

  setPage : function setPage(page) {
    this.page = page
    this.notify()
  },

  getPage : function getPage() {
    return this.page
  },

  setArgs : function setArgs(args) {
    this.args = args
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

  imgAdded : function imgAdded(data) {
    console.log('imgAdded:', data)
    // console.log('imgAdded: key=' + data.key)
    // console.log('imgAdded: val=', data.val())
    var key = data.key
    var val = data.val()
    this.imgs[key] = val
    this.notify()
  },

  imgChanged : function imgChanged(data) {
    console.log('imgChanged:', data.key)
    var key = data.key
    var val = data.val()
    this.imgs[key] = val
    this.notify()
  },

  imgRemoved : function imgRemoved(data) {
    console.log('imgRemoved:', data.key)
    // this.imgs.push(img)
    this.notify()
  },

  getImgs : function getImgs() {
    return this.imgs
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
    this.hash = null
    this.page = null
    this.args = {}
    this.user = null
    this.msgs = []
    this.imgs = {}
    this.listeners = []
  },
}

// --------------------------------------------------------------------------------------------------------------------

module.exports = store

// --------------------------------------------------------------------------------------------------------------------
