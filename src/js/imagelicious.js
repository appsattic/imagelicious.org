// --------------------------------------------------------------------------------------------------------------------

// global
var React = require('react')
var ReactDOM = require('react-dom')

// npm
var HashiRouter = require('hashirouter')

// local
var firebase = require('./firebase.js')
var store = require('./store.js')
var App = require('./app.js')

// --------------------------------------------------------------------------------------------------------------------
// events

firebase.auth().onAuthStateChanged(function(currentUser) {
  console.log('onAuthStateChanged() - currentUser:', currentUser)

  var thisUser;

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

    // now that we have a user, let's listen for child events on 'user/<uid>/img/*'
    var imgRef = firebase.database().ref('user/' + currentUser.uid)
    imgRef.on('child_added', function(data) {
      store.imgAdded(data)
    })
    imgRef.on('child_changed', function(data) {
      store.imgChanged(data)
    })
    imgRef.on('child_removed', function(data) {
      store.imgRemoved(data)
    })
  }
  else {
    console.log('WARNING')
    // turn off notifications if the user was logged in
    var thisUser = store.getUser()
    if ( thisUser ) {
      firebase.database().ref('user/' + thisUser.uid).off()
    }
    store.reset(false)
    store.setUser(false)
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

var router = new HashiRouter({
  def : 'app',
  debug : true,
})
router.add('app', (imageId) => {
  console.log('now showing the app')
  store.setPage('app')
  store.setArgs({}) // no args
})
router.add('image/:imageId', (imageId) => {
  console.log('got a new image ' + imageId)
  store.setPage('image')
  store.setArgs({
    imageId : imageId,
  })
})
router.setNotFound((hash) => {
  console.log('Unknown hash=' + hash)
  window.location.hash = 'app'
  // store.setPage('image')
  // store.setArgs([])
})

function onHashChange() {
  var hash = window.location.hash

  // calls a function you provided OR returns a newHash (not both)
  console.log('onHashChange() - calling router.route()')
  var newHash = router.route(hash.substr(1))
  if ( newHash ) {
    console.log('onHashChange() - got newHash=' + newHash)
    window.location.hash = newHash
    return
  }

  store.setHash(hash)
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

// --------------------------------------------------------------------------------------------------------------------
