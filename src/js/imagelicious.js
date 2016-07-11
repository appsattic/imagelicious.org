// --------------------------------------------------------------------------------------------------------------------

// global
var React = require('react')
var ReactDOM = require('react-dom')

// local
var firebase = require('./firebase.js')
var store = require('./store.js')
var App = require('./app.js')

// --------------------------------------------------------------------------------------------------------------------
// events

firebase.auth().onAuthStateChanged(function(currentUser) {
  console.log('onAuthStateChanged() - currentUser:', currentUser)

  if ( currentUser ) {
    var thisUser = {
      uid           : currentUser.uid,
      displayName   : currentUser.displayName || currentUser.email.split('@')[0],
      email         : currentUser.email,
      emailVerified : currentUser.emailVerified,
      isAnonymous   : currentUser.isAnonymous,
      photoURL      : currentUser.photoURL,
      providerId    : currentUser.providerData[0].providerId,
    }
    console.log('onAuthStateChanged() - thisUser:', thisUser)
    store.setUser(thisUser)
  }
  else {
    store.setUser(null)
  }
  render()
})

// See: http://jamesknelson.com/routing-with-raw-react/
function onHashChange() {
  // take the initial '#' off the window.location.hash
  var hash = window.location.hash.substr(1)
  console.log('onHashChange() - hash: [' + hash + ']')
  store.setHash(hash)
  render()
}

// when there is a hashChange, call our function
window.addEventListener('hashchange', onHashChange, false)

// --------------------------------------------------------------------------------------------------------------------
// render

function render() {
  console.log('render(): ...')
  ReactDOM.render(
    <App store={ store } />,
    document.getElementById('app')
  )
}

store.listen(render)

// on startup, update the hash and render the app
onHashChange()
render()

// --------------------------------------------------------------------------------------------------------------------
