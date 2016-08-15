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
  def : 'gallery/1',
  debug : false,
})
router.add('gallery/:pageNum', (pageNum) => {
  // always gives a number, even zero (for empty strings or anything else)
  pageNum |= 0 // eslint-disable-line no-bitwise

  if ( pageNum === 0 ) {
    window.location.hash = 'gallery/1'
    return
  }

  store.init('gallery', { pageNum : pageNum })
})
router.add('sign-in', () => {
  store.init('sign-in')
})
router.add('about', () => {
  store.init('about')
})
router.add('img/:imgId', (imgId) => {
  store.init('img', { imgId : imgId })
})
router.setNotFound((hash) => {
  window.location.hash = 'app'
  store.init('not-found')
})

// --------------------------------------------------------------------------------------------------------------------

module.exports = router

// --------------------------------------------------------------------------------------------------------------------
