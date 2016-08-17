// --------------------------------------------------------------------------------------------------------------------

"use strict"

// npm
var page = require('page')

// local
var store = require('./store.js')

// --------------------------------------------------------------------------------------------------------------------

// Idea from https://enome.github.io/javascript/2014/05/09/lets-create-our-own-router-component-with-react-js.html
function nav(path, ev) {
  console.log('*** path:', path)
  console.log('*** ev:', ev)
  ev.preventDefault()
  page.show(path)
}

page('/', () => {
  console.log('page: /')
  store.init('gallery', { pageNum : 1 })
})

page('/sign-in', () => {
  console.log('page: /sign-in')
  store.init('sign-in')
})

page('/docs', () => {
  console.log('page: /docs')
  store.init('docs')
})

page('/about', () => {
  console.log('page: /about')
  store.init('about')
})

page('/settings', () => {
  console.log('page: /settings')
  store.init('settings')
})

page('/gallery/:pageNum', (ctx) => {
  let pageNum = ctx.params.pageNum
  console.log('page: /gallery/:pageNum', pageNum)

  // always gives a number, even zero (for empty strings or anything else)
  pageNum |= 0 // eslint-disable-line no-bitwise

  if ( pageNum === 0 ) {
    page.redirect('/gallery/1')
    return
  }

  store.init('gallery', { pageNum : pageNum })
})

page('/img/:imgId', (ctx) => {
  const imgId = ctx.params.imgId
  console.log('page: /img/:imgId', imgId)
  store.init('img', { imgId : imgId })
})

page('*', () => {
  console.log('page: /not-found')
  store.init('not-found')
})

// --------------------------------------------------------------------------------------------------------------------

module.exports = {
  page,
  nav,
}

// --------------------------------------------------------------------------------------------------------------------
