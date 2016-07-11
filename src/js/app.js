// --------------------------------------------------------------------------------------------------------------------

// global
var React = require('react')

// local
var firebase = require('./firebase.js')

// --------------------------------------------------------------------------------------------------------------------

var App = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  signIn(ev) {
    ev.preventDefault()
    var store = this.props.store

    var provider = new firebase.auth.GoogleAuthProvider()
    firebase.auth().signInWithRedirect(provider).then(function(result) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      // var token = result.credential.accessToken
      // The signed-in user info.
      // var user = result.user
      // ...
      console.log('signIn() - result:', result)
    }).catch(function(error) {
      // Handle Errors here.
      // var errorCode = error.code
      // var errorMessage = error.message
      // The email of the user's account used.
      // var email = error.email
      // The firebase.auth.AuthCredential type that was used.
      // var credential = error.credential

      // add this error
      store.addError(error.message)
    })
  },
  signOut(ev) {
    ev.preventDefault()
    var store = this.props.store

    firebase.auth().signOut().then(function() {
      // refresh the page so all data is emptied
      window.location = ''
    }, function(error) {
      store.addError(error.message)
    })
  },
  render() {
    var store = this.props.store
    var user = store.getUser()
    var msgs = store.getMsgs()

    return (
      <div>
        {
          msgs.length
          ?
          <ul>
            {
              msgs.map((msg, i) => {
                return <li key={ i }>{ msg }</li>
              })
            }
          </ul>
          :
          <div />
        }
        {
          user
          ?
          <p>
            Hello, { user.displayName }!
            { ' | ' }
            { '<' + user.email + '>' }
            { ' | ' }
            <a href="#" onClick={ this.signOut }>Sign Out</a>
          </p>
          :
          <p>
            <a href="#" onClick={ this.signIn }>Sign in with Google</a>.
          </p>
        }
      </div>
    )
  }
})

// --------------------------------------------------------------------------------------------------------------------

module.exports = App

// --------------------------------------------------------------------------------------------------------------------
