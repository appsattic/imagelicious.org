// --------------------------------------------------------------------------------------------------------------------

// only a single instance of the store
var store = {
  hash : null,
  user : null,
  msgs : [],
  listeners : [],

  setUser : function setUser(user) {
    this.user = user
    this.notify()
  },

  getUser : function getUser(user) {
    return this.user
  },

  setHash : function setHash(hash) {
    this.hash = hash
    this.notify()
  },

  getHash : function getHash(hash) {
    return store.hash
  },

  addMsg : function addMsg(msg) {
    this.msgs.push(msg)
    this.notify()
  },

  getMsgs : function getMsgs() {
    return this.msgs
  },

  listen: function listen(fn) {
    this.listeners.push(fn)
  },

  notify: function notify() {
    this.listeners.forEach((fn) => {
      fn()
    })
  },

  extract : function extract() {
    return JSON.parse(JSON.stringify(this))
  },
}

// --------------------------------------------------------------------------------------------------------------------

module.exports = store

// --------------------------------------------------------------------------------------------------------------------
