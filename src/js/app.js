// --------------------------------------------------------------------------------------------------------------------

// global
var React = require('react')

// local
var firebase = require('./firebase.js')
var uploadImage = require('./upload-image.js')

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

    // Each 'file' would be something like:
    //
    // {
    //   name             : "filename.png",
    //   lastModified     : 1439245086000,
    //   lastModifiedDate : new Date("2015-08-10T22:18:06.000Z"),
    //   size             : 31564,
    //   type             : "image/png",
    // }

    console.log('Files = ' + ev.target.files.length)
    for( let i = 0; i < ev.target.files.length; i++ ) {
      console.log('(' + i + ') file:', ev.target.files[i])
      uploadImage(store, ev.target.files[i], function(err, res) {
        if (err) {
          store.addMsg('' + err)
          return
        }
        // if everything went well, we don't need to do anything
        console.log('Image uploaded')
      })
    }
  },
  onClick(ev) {
    ev.preventDefault()
    document.getElementById('file').click()
  },
  render() {
    return (
      <div>
        <input type="file" id="file" name="file" onChange={ this.onChange } multiple={ true } style={ { display: 'none' } }/>
        <button onClick={ this.onClick }>Upload File(s)</button>
      </div>
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
          <progress max="100" value={ img.progress } style={ { width: "100%" } } />
        </article>
      )
    }

    if ( img.state === 'paused' ) {
      return (
        <article className="tile is-child box">
          <p style={{ fontSize: '18px'}} className="title">Paused</p>
          <p style={{ fontSize: '12px'}} className="subtitle">Progress: { img.progress }%</p>
          <progress max="100" value={ img.progress } style={ { width: "100%" } } />
        </article>
      )
    }

    if ( img.state === 'error' ) {
      return (
        <article className="tile is-child box">
          <p style={{ fontSize: '18px'}} className="title">Error</p>
          <p style={{ fontSize: '12px'}} className="subtitle">{ img.msg }</p>
        </article>
      )
    }

    if ( img.state === 'saving-metadata' ) {
      return (
        <article className="tile is-child box">
          {
            img.downloadUrl
            &&
            <figure className="image is-4by3">
              <img src={ img.downloadUrl } />
            </figure>
          }
          <p style={{ fontSize: '18px'}} className="title">Saving metadata...</p>
          <p style={{ fontSize: '12px'}} className="subtitle">Progress: Complete</p>
        </article>
      )
    }

    return (
      <article className="tile is-child box">
        <figure className="image is-4by3">
          <img src={ img.downloadUrl } />
        </figure>
        <p style={{ fontSize: '18px'}} className="title">{ img.filename }</p>
        <p style={{ fontSize: '12px'}} className="subtitle">{ img.contentType }</p>
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
                <a className="nav-item" href="/">
                  <img src="/img/logo-48x36.png" alt="Logo" />
                  imagelicious.org
                </a>
              </div>
              <span className="nav-toggle">
                <span></span>
                <span></span>
                <span></span>
              </span>
              <div className="nav-right nav-menu">
                <a className="nav-item is-active" href="/">
                  Home
                </a>
                <a className="nav-item">
                  Examples
                </a>
                <a className="nav-item">
                  Documentation
                </a>
                <span className="nav-item">
                  <a href="https://github.com/appsattic/imagelicious.org" className="button is-primary is-inverted">
                    <span className="icon">
                      <i className="fa fa-github"></i>
                    </span>
                    <span>Source Code</span>
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
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  render() {
    var store = this.props.store

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

var Social = React.createClass({
  render() {
    // Twitter Share button from https://publish.twitter.com/
    return (
      <div id="social">
        <iframe src="https://ghbtns.com/github-btn.html?user=appsattic&repo=imagelicious.org&type=star&count=true" frameborder="0" scrolling="0" width="90px" height="20px"></iframe>
        { ' ' }
        <iframe src="https://ghbtns.com/github-btn.html?user=chilts&type=follow&count=true" frameborder="0" scrolling="0" width="150px" height="20px"></iframe>
        { ' ' }
        <a
          href="https://twitter.com/andychilton"
          className="twitter-follow-button"
          data-show-count="true"
        >
          Follow me @andychilton
        </a>
        { ' ' }
        <a
          href="https://twitter.com/share"
          className="twitter-share-button"
          data-text="imagelicious.org - Image hosting service, using only Firebase. Open source."
          data-url="https://imagelicious.org/"
          data-via="andychilton"
          data-show-count="false"
        >
          Tweet about imagelicious.org
        </a>
      </div>
    )
  },
})

var Footer = React.createClass({
  render() {
    return (
      <footer className="footer">
        <div className="container">
          <div className="content has-text-centered">
            <p>
              <strong>imagelicious.org</strong> by <a href="http://chilts.org/" target="_blank">Andrew Chilton</a> of <a href="http://appsattic.com/" target="_blank">AppsAttic</a>, runs on <a href="https://firebase.google.com/" target="_blank">Firebase</a>.
              <br />
              The source code is licensed <a href="https://opensource.org/licenses/ISC" target="_blank">ISC</a>.
            </p>
            <Social />
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
        <Hero store={ store } />
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
