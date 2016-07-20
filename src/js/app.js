// --------------------------------------------------------------------------------------------------------------------

// global
var React = require('react')

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

    // firebase.auth() so we can get the currentUser
    var auth = firebase.auth()
    var currentUser = auth.currentUser
    console.log('currentUser:', currentUser)

    // firstly, get a new database ref
    var ref = firebase.database().ref().child('user/' + currentUser.uid)
    var ref = firebase.database().ref()

    var dbRef = ref.child('user/' + currentUser.uid).push()
    var pubRef = ref.child('img/' + dbRef.key)
    console.log('dbRef.key=' + dbRef.key)

    // firebase storage -> /img/<dbRef.key>
    var storage = firebase.storage()
    console.log('dbRef.key:', dbRef.key)
    var fileRef = storage.ref().child('img/' + dbRef.key)
    console.log('ref path:', fileRef.fullPath)

    store.imgChanged(dbRef.key, { state : 'uploading', progress : 0 })

    // file metadata : https://firebase.google.com/docs/storage/web/file-metadata
    var uploadTask = fileRef.put(file, {
      name : file.name,
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
        store.imgChanged(dbRef.key, { state : 'uploading', progress : Math.floor(progress) })
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
        // successful upload - now save to datastore

        console.log('File available at', uploadTask.snapshot.downloadURL)

        // firstly, get the metadata from the file back
        fileRef.getMetadata().then(function(metadata) {
          // Metadata now contains the metadata for 'images/forest.jpg'
          console.log('file metadata:', metadata)

          dbRef.set({
            displayName : currentUser.displayName,
            downloadUrl : uploadTask.snapshot.downloadURL,
            filename    : file.name,
            size        : metadata.size,
            contentType : metadata.contentType,
          })

          pubRef.set({
            displayName : currentUser.displayName,
            downloadUrl : uploadTask.snapshot.downloadURL,
            filename    : file.name,
            size        : metadata.size,
            contentType : metadata.contentType,
          })

        }).catch(function(error) {
          console.log('error getting file metadata:', err)
        });
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
      <section className="section">
        <div className="container">
          Hello, { user.displayName }!
          { ' | ' }
          { '<' + user.email + '>' }
          { ' | ' }
          <a href="#" onClick={ this.signOut }>Sign Out</a>
        </div>
      </section>
    )
  }
})

var Image = React.createClass({
  render() {
    var img = this.props.img
    if ( img.state === 'uploading' ) {
      return (
        <article className="tile is-child box">
          <p style={{ fontSize: '18px'}} className="title">Uploading...</p>
          <p style={{ fontSize: '12px'}} className="subtitle">Progress: { img.progress }%</p>
        </article>
      )
    }

    return (
      <article className="tile is-child box">
        <figure className="image is-4by3">
          <img src={ this.props.downloadUrl } />
        </figure>
        <p style={{ fontSize: '18px'}} className="title">{ this.props.filename }</p>
        <p style={{ fontSize: '12px'}} className="subtitle">{ this.props.contentType }</p>
      </article>
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

      // show the logged in user all of their images
      var imgs = store.getImgs()
      var imgKeys = Object.keys(imgs)
      let columns = imgKeys.sort().reverse().map(function(key) {
        return (
          <div key={ key } className="column is-one-quarter">
            <Image
              img={ imgs[key] }
              filename={ imgs[key].filename }
              contentType={ imgs[key].contentType }
              downloadUrl={ imgs[key].downloadUrl }
            />
          </div>
        )
      })

      // render the upload form and their images
      return (
        <div className="container">
          { user ? <ImageUploadForm store={ store } /> : null }
          <div className="columns is-multiline is-mobile">
            { columns }
          </div>
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

var TopBar = React.createClass({
  render() {
    return (
      <section className="hero is-primary is-medium">
        <div className="hero-head">
          <header className="nav">
            <div className="container">
              <div className="nav-left">
                <a className="nav-item">
                  <img src="images/bulma-white.png" alt="Logo" />
                </a>
              </div>
              <span className="nav-toggle">
                <span></span>
                <span></span>
                <span></span>
              </span>
              <div className="nav-right nav-menu">
                <a className="nav-item is-active">
                  Home
                </a>
                <a className="nav-item">
                  Examples
                </a>
                <a className="nav-item">
                  Documentation
                </a>
                <span className="nav-item">
                  <a className="button is-primary is-inverted">
                    <span className="icon">
                      <i className="fa fa-github"></i>
                    </span>
                    <span>Download</span>
                  </a>
                </span>
              </div>
            </div>
          </header>
        </div>
      </section>
    )
  },
})

var Hero = React.createClass({
  render() {
    return (
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container">
            <h1 className="title">
              imagelicious.org
            </h1>
            <h2 className="subtitle">
              Photo Gallery, on Firebase
            </h2>
          </div>
        </div>
      </section>
    )
  }
})

var Footer = React.createClass({
  render() {
    return (
      <footer className="footer">
        <div className="container">
          <div className="content has-text-centered">
            <p>
              <strong>imagelicious.org</strong> by <a href="https://chilts.org/">Andrew Chilton</a>, runs on <a href="https://firebase.google.com/">Firebase</a>.
              <br />
              The source code is licensed <a href="http://example.com/">ISC</a>.
            </p>
            <p>
              <a className="icon" href="https://github.com/chilts/imagelicious.org">
                <i className="fa fa-github"></i>
              </a>
            </p>
          </div>
        </div>
      </footer>
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
        <TopBar />
        <Hero />
        <MsgList msgs={ store.getMsgs() } />
        <Status store={ store } />
        <Page store={ store } />
        <Footer />
      </div>
    )
  }
})

// --------------------------------------------------------------------------------------------------------------------

module.exports = App

// --------------------------------------------------------------------------------------------------------------------
