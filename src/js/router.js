// --------------------------------------------------------------------------------------------------------------------

"use strict"

// npm
var HashiRouter = require('hashirouter')

// local
var store = require('./store.js')

// --------------------------------------------------------------------------------------------------------------------

// Only these pages are rendered, anything else goes to 'Not Found':
//
// - 'app'     - your images (once logged in)
// - 'sign-in' - a log in form
// - 'image'   - to view an image (not just yours, but anyones)
//
var router = new HashiRouter({
  def : 'app',
  debug : true,
})
router.add('app', (imageId) => {
  store.init('app')
})
router.add('sign-in', (imageId) => {
  store.init('sign-in')
})
router.add('img/:img_id', (img_id) => {
  store.init('img', { img_id : img_id })
})
router.setNotFound((hash) => {
  window.location.hash = 'app'
  store.init('not-found')
})

// --------------------------------------------------------------------------------------------------------------------

module.exports = router

// --------------------------------------------------------------------------------------------------------------------
