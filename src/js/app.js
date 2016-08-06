// --------------------------------------------------------------------------------------------------------------------

"use strict"

// global
var React = require('react')

// local
var cfg = require('./cfg.js')
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
          ? <ul>
              {
                msgs.map((msg, i) => <li key={ i }>{ msg }</li> )
              }
            </ul>
          : null
        }
      </div>
    )
  }
})

var Status = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  onClickUpload(ev) {
    ev.preventDefault()
    document.getElementById('file').click()
  },
  onChangeFile(ev) {
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

    for( let i = 0; i < ev.target.files.length; i++ ) {
      uploadImage(store, ev.target.files[i], function(err, res) {
        if (err) {
          store.addMsg('' + err)
          return
        }
        // if everything went well, we don't need to do anything
      })
    }
  },
  onClickSort(parent, child, ev) {
    ev.preventDefault()
    ev.stopPropagation()
    var store = this.props.store
    store.setFilter(parent, child)
  },
  render() {
    const store = this.props.store
    const count = store.countImgs()
    const filters = store.getFilters()

    const page = store.getPage()

    let left, right
    if ( page === 'gallery' ) {
      left = (
        <div className="level-left">
          <div className="level-item">
            <p className="subtitle is-5">
              <strong>{ count }</strong> image(s)
            </p>
          </div>
          <p className="level-item">
            <input type="file" id="file" name="file" onChange={ this.onChangeFile } multiple={ true } style={ { display: 'none' } }/>
            <a className="button is-success" onClick={ this.onClickUpload }>Upload Images</a>
          </p>
        </div>
      )
      right = (
        <div className="level-right">
           <p className="level-item">Sort:</p>
           {
             Object.keys(filters.sort).map((title, i) => {
               if ( filters.sort[title] ) {
                 return <p key={ 'msg-' + i } className="level-item"><strong>{ title }</strong></p>
               }
               return <p key={ 'msg-' + i } onClick={ this.onClickSort.bind(this, 'sort', title) } className="level-item"><a>{ title }</a></p>
             })
           }
        </div>
      )
    }
    else {
      left = <div className="level-left" />
      right = <div className="level-right" />
    }

    // yes, logged in
    return (
      <section className="section">
        <div className="container">
          <nav className="level">
            { left }
            { right }
          </nav>
        </div>
      </section>
    )
  }
})

var ThumbnailImage = React.createClass({
  propTypes: {
    imgId : React.PropTypes.string.isRequired,
    img   : React.PropTypes.object.isRequired,
  },
  render() {
    var imgId = this.props.imgId
    var img   = this.props.img

    if ( img.state === 'uploading' ) {
      return (
        <article className="tile is-child box">
          <p style={{ fontSize: '18px' }} className="title">Uploading...</p>
          <p style={{ fontSize: '12px' }} className="subtitle">Progress: { img.progress }%</p>
          <progress max="100" value={ img.progress } style={ { width: "100%" } } />
        </article>
      )
    }

    if ( img.state === 'paused' ) {
      return (
        <article className="tile is-child box">
          <p style={{ fontSize: '18px' }} className="title">Paused</p>
          <p style={{ fontSize: '12px' }} className="subtitle">Progress: { img.progress }%</p>
          <progress max="100" value={ img.progress } style={ { width: "100%" } } />
        </article>
      )
    }

    if ( img.state === 'error' ) {
      return (
        <article className="tile is-child box">
          <p style={{ fontSize: '18px' }} className="title">Error</p>
          <p style={{ fontSize: '12px' }} className="subtitle">{ img.msg }</p>
        </article>
      )
    }

    if ( img.state === 'saving-metadata' ) {
      return (
        <article className="tile is-child box">
          {
            img.downloadUrl
            ? <figure className="image is-4by3">
                <a href={ '#img/' + imgId }><img src={ img.downloadUrl } /></a>
              </figure>
            : null
          }
          <p style={{ fontSize: '18px' }} className="title">Saving metadata...</p>
          <p style={{ fontSize: '12px' }} className="subtitle">Progress: Complete</p>
        </article>
      )
    }

    return (
      <article className="tile is-child box">
        <figure className="image is-4by3">
          <a href={ '#img/' + imgId }><img src={ img.downloadUrl } /></a>
        </figure>
        <p style={{ fontSize: '18px' }} className="title">{ img.filename }</p>
        <p style={{ fontSize: '12px' }} className="subtitle">{ img.contentType }</p>
      </article>
    )
  }
})

var SignInPage = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  render() {
    var store = this.props.store
    var user = store.getUser()

    if ( !user === null ) {
      return <div />
    }

    return <div>You are already logged in.</div>
  }
})

// Pagination
//
// This component will always show links to:
//
// 1. The first page
// 2. The prev page
// 3. The current page plus a few around it
// 4. The next page
// 5. The last page
//
var Pagination = React.createClass({
  propTypes: {
    pageNum : React.PropTypes.number.isRequired,
    total   : React.PropTypes.number.isRequired,
    perPage : React.PropTypes.number.isRequired,
  },
  render() {
    const { pageNum, total, perPage } = this.props

    // calculate some things related to the first/prev/next/last
    var totalPages = Math.ceil(total / perPage)
    var isFirst = pageNum === 1
    var isLast  = pageNum === totalPages

    var first = (
      <a
        href="#gallery/1"
        className={ 'button' + (isFirst ? ' is-disabled' : '') }
      >&laquo;</a>
    )
    var prev = (
      <a
        href={ "#gallery/" + ( pageNum - 1 ) }
        className={ 'button' + (isFirst ? ' is-disabled' : '') }
      >&lt;</a>
    )
    var next = (
      <a
        href={ "#gallery/" + ( pageNum + 1 ) }
        className={ 'button' + (isLast ? ' is-disabled' : '') }
      >&gt;</a>
    )
    var last = (
      <a
        href={ "#gallery/" + totalPages }
        className={ 'button' + (isLast ? ' is-disabled' : '') }
      >&raquo;</a>
    )

    var pages = []
    for(let p = 1; p <= totalPages; p++) {
      pages.push(
        <li>
          <a
            href={ "#gallery/" + p }
            className={ 'button' + (p === pageNum ? ' is-disabled' : '') }
          >{ p }</a>
        </li>
      )
    }

    return (
      <nav className="pagination">
        <ul>
          <li>{ first }</li>
          <li>{ prev }</li>
          <li></li>
          { pages }
          <li></li>
          <li>{ next }</li>
          <li>{ last }</li>
        </ul>
      </nav>
    )
  }
})

var GalleryPage = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  render() {
    const store = this.props.store
    const user = store.getUser()

    // if there is no user, then don't show any gallery
    if ( !user ) {
      return <div>Please sign in.</div>
    }

    const args = store.getArgs()
    const filters = store.getFilters()
    let pageNum = args.pageNum

    // Filtering and Sorting:
    //
    // 1. filter in/out any currently selected tag
    // 2. sort by Newest/Oldest
    // 3. slice depending on page number

    // get all of the images into `showImgs` for filtering/sorting
    const imgs = store.getImgs()
    const imgKeys = Object.keys(imgs)
    let showImgs = imgKeys.map((key) => imgs[key])

    // 1. filter in/out any currently selected tag
    // ToDo: ...!

    // 2. sort by Newest/Oldest
    // get the full set of image data in an array
    const order = filters.sort['Newest First'] ? 1 : -1
    showImgs = showImgs.sort((a, b) => {
      // From: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
      if ( a.inserted < b.inserted ) return order
      if ( a.inserted > b.inserted ) return -order
      return 0
    })

    // 3. slice depending on page number
    const start = (pageNum - 1) * cfg.imgsPerPage
    const end = pageNum * cfg.imgsPerPage
    showImgs = showImgs.slice(start, end)

    // -- Pagination --
    // From: http://bulma.io/documentation/components/pagination/

    // let's filter the pagination based on the filters available

    let columns = showImgs.map(function(img) {
      return (
        <div key={ img.key } className="column is-one-quarter">
          <ThumbnailImage imgId={ img.key } img={ img } />
        </div>
      )
    })

    // render the upload form and their images
    return (
      <section className="section">
        <div className="container">
          <Pagination pageNum={ pageNum } total={ imgKeys.length } perPage={ cfg.imgsPerPage } />
          <div className="columns is-multiline is-mobile">
            { columns }
          </div>
        </div>
      </section>
    )
  }
})

var ImgPage = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  render() {
    var store = this.props.store
    var img = store.getImg()

    if ( img === null ) {
      return <div>Loading...</div>
    }

    if ( img === false ) {
      return <div>Unknown Image</div>
    }

    if ( img instanceof Error ) {
      return <div>Something went wrong when loading image : { '' + img }</div>
    }

    return (
      <section className="section">
        <div className="container">
          <article className="tile is-child box">
            <figure className="image is-4by3">
              <img src={ img.downloadUrl } />
            </figure>
            <p style={{ fontSize: '18px' }} className="title">{ img.filename }</p>
            <p style={{ fontSize: '12px' }} className="subtitle">{ img.contentType }</p>
          </article>
        </div>
      </section>
    )
  }
})

var AboutPage = React.createClass({
  render() {
    return (
      <section className="section">
        <div className="container">
          <h3 className="title is-3">About Imagelicious</h3>
          <h5 className="subtitle is-5">Photo Gallery, built using Firebase.</h5>
          <p>Some text here.</p>
        </div>
      </section>
    )
  }
})

var Page = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  render() {
    var store = this.props.store

    // render a logged in page
    var page = store.getPage()

    if ( page === 'sign-in' ) {
      return <SignInPage store={ store } />
    }

    if ( page === 'gallery' ) {
      return <GalleryPage store={ store } />
    }

    if ( page === 'img' ) {
      return <ImgPage store={ store } />
    }

    if ( page === 'about' ) {
      return <AboutPage />
    }

    return (
      <div>404 - Not Found</div>
    )
  }
})

var TopBar = React.createClass({
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

    var right
    // status unknown
    if ( user === null ) {
      right = (
        <div className="nav-right nav-menu">
          <span className="nav-item">Loading...</span>
        </div>
      )
    }
    else if ( user === false ) {
      right = (
        <div className="nav-right nav-menu">
          <a className="nav-item" href="#sign-in" onClick={ this.signIn }>
            Sign in using Google
          </a>
        </div>
      )
    }
    else {
      // yes, we have a user
      right = (
        <div className="nav-right nav-menu">
          <a className="nav-item" href="#settings">
            { user.email }
          </a>
          <a className="nav-item" href="#sign-out" onClick={ this.signOut }>
            Sign Out
          </a>
        </div>
      )
    }

    return (
      <section className="hero is-primary">
        <div className="hero-head">
          <div className="container">
            <nav className="nav">
              <div className="nav-left">
                <a className="nav-item is-brand" href="/#gallery/1">
                  <img src="/img/logo-48x36.png" alt="Logo" />
                  imagelicious.org
                </a>
                <a className="nav-item" href="#docs">
                  Docs
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
              <span className="nav-toggle">
                <span></span>
                <span></span>
                <span></span>
              </span>
              { right }
            </nav>
          </div>
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
    var user = store.getUser()

    if ( user === null ) {
      // don't show the Hero when loading
      return <div />
    }

    if ( user ) {
      // don't show the Hero if the user is logged in
      return <div />
    }

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
        <iframe src="https://ghbtns.com/github-btn.html?user=appsattic&repo=imagelicious.org&type=star&count=true" frameBorder="0" scrolling="0" width="90px" height="20px"></iframe>
        { ' ' }
        <iframe src="https://ghbtns.com/github-btn.html?user=chilts&type=follow&count=true" frameBorder="0" scrolling="0" width="150px" height="20px"></iframe>
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
        <TopBar store={ store } />
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
