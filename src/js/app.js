// --------------------------------------------------------------------------------------------------------------------

// global
var React = require('react')

// npm
var zid = require('zid')

// local
var firebase = require('./firebase.js')

// --------------------------------------------------------------------------------------------------------------------

var MsgList = React.createClass({
  propTypes: {
    msgs : React.PropTypes.array.isRequired,
  },
  render() {
    var msgs = this.props.msgs
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
          null
        }
      </div>
    )
  }
})

// From : https://firebase.google.com/docs/storage/web/upload-files
var ImageUploadForm = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  onChange(ev) {
    ev.preventDefault()

    // our own store
    var store = this.props.store

    // Firstly, check the file is okay, 'file' would be something like:
    //
    // {
    //   name             : "filename.png",
    //   lastModified     : 1439245086000,
    //   lastModifiedDate : new Date("2015-08-10T22:18:06.000Z"),
    //   size             : 31564,
    //   type             : "image/png",
    // }
    var file = ev.target.files[0]
    console.log('file:', file)

    // make sure the file has something in it
    if ( file.size === 0 ) {
      store.addMsg('File size must be greater than 0 bytes')
      return;
    }

    // firebase auth
    var auth = firebase.auth()
    var currentUser = auth.currentUser
    console.log('currentUser:', currentUser)

    // firebase storage -> /user/<uid>/<id>/<file.filename>
    var storage = firebase.storage()
    var id = zid(16)
    console.log('id:', id)
    var path = [
      'user',
      auth.currentUser.uid,
      id,
      file.name,
    ].join('/')
    console.log('path:', path)
    var fileRef = storage.ref().child(path)
    console.log('ref path:', fileRef.fullPath)

    var uploadTask = fileRef.put(file, {
      'contentType' : file.type
    })

    // Register three observers:
    // 1. 'state_changed' observer, called any time the state changes
    // 2. Error observer, called on failure
    // 3. Completion observer, called on successful completion
    uploadTask.on(
      'state_changed',
      function(snapshot) {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded.
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
        case firebase.storage.TaskState.PAUSED: // or 'paused'
          console.log('Upload is paused');
          break;
        case firebase.storage.TaskState.RUNNING: // or 'running'
          console.log('Upload is running');
          break;
        }
      },
      function(err) {
        // Handle unsuccessful uploads
        console.log('uploadTask.err:', err)

        switch (err.code) {
        case 'storage/unauthorized':
          // User doesn't have permission to access the object
          console.log('- storage/unauthorized', err)
          break;
        case 'storage/canceled':
          // User canceled the upload
          console.log('- storage/canceled', err)
          break;
        case 'storage/unknown':
          // Unknown error occurred, inspect error.serverResponse
          console.log('- storage/unknown', err)
          break;
        default:
          console.log('- Unknown error:', err)
        }

      },
      function() {
        console.log('uploadTask.completed')
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        var downloadUrl = uploadTask.snapshot.downloadURL
        console.log('File available at', downloadUrl)
        // now we can save this image to the datastore
        // ToDo: ...!
      }
    )
  },
  render() {
    return (
      <input type="file" id="file" name="file" onChange={ this.onChange }/>
    )
  }
})

var Status = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  signIn(ev) {
    ev.preventDefault()

    var store = this.props.store

    var provider = new firebase.auth.GoogleAuthProvider()
    var p = firebase.auth().signInWithRedirect(provider)
    p.then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      // var token = result.credential.accessToken
      // The signed-in user info.
      // var user = result.user
      // ...
      console.log('signIn() - result:', result)
    }).catch((err) => {
      // Handle Errors here.
      // var errorCode = error.code
      // var errorMessage = error.message
      // The email of the user's account used.
      // var email = error.email
      // The firebase.auth.AuthCredential type that was used.
      // var credential = error.credential

      // add this err to the messages
      store.addError(err.message)
    })
  },
  signOut(ev) {
    ev.preventDefault()

    var store = this.props.store

    var p = firebase.auth().signOut()
    p.then(
      () => {
        // refresh the page so all data is emptied
        window.location = ''
      },
      (err) => {
        store.addError(err.message)
      }
    )
  },
  render() {
    var store = this.props.store
    var user = store.getUser()

    // status unknown
    if ( user === null ) {
      return <p>Loading...</p>
    }

    // not logged in
    if ( user === false ) {
      return (
        <p>
          <a href="#" onClick={ this.signIn }>Sign in with Google</a>.
        </p>
      )
    }

    // yes, logged in
    return (
      <p>
        Hello, { user.displayName }!
        { ' | ' }
        { '<' + user.email + '>' }
        { ' | ' }
        <a href="#" onClick={ this.signOut }>Sign Out</a>
      </p>
    )
  }
})

var Page = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  render() {
    var store = this.props.store
    var user = store.getUser()

    console.log('Page.render(): hash=' + store.getHash())

    // render a logged in page
    var page = store.getPage()
    var args = store.getArgs()

    console.log('page=' + page)

    if ( page === 'app' ) {
      if ( !user ) {
        return <div />
      }

      // render the upload form
      return (
        <div>
          { user ? <ImageUploadForm store={ store } /> : null }
        </div>
      )
    }

    if ( page === 'image' ) {
      return (
        <div>
          <p>This is an image, right here: imageId={ args.imageId }.</p>
        </div>
      )
    }

    return (
      <div>404 - Not Found</div>
    )
  }
})

var App = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  render() {
    var store = this.props.store

    return (
      <div>
        <MsgList msgs={ store.getMsgs() } />
        <Status store={ store } />
        <Page store={ store } />
      </div>
    )
  }
})

// --------------------------------------------------------------------------------------------------------------------

module.exports = App

// --------------------------------------------------------------------------------------------------------------------
