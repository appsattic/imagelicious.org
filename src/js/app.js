// --------------------------------------------------------------------------------------------------------------------

"use strict"

// global
var React = require('react')

// local
var cfg = require('./cfg.js')
var firebase = require('./firebase.js')
var uploadImage = require('./upload-image.js')
var slugitAll = require('./slugit-all.js')

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

var ThumbnailImage = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
    imgId : React.PropTypes.string.isRequired,
    img   : React.PropTypes.object.isRequired,
  },
  onClickEdit(img, ev) {
    ev.preventDefault()
    ev.stopPropagation()

    const { store } = this.props
    store.setEdit(img)
  },
  render() {
    const { imgId, img } = this.props

    if ( img.state === 'uploading' ) {
      return (
        <article className="tile is-child box">
          <h5 className="title is-5">Uploading...</h5>
          <h6 className="subtitle is-6">Progress: { img.progress }%</h6>
          <progress max="100" value={ img.progress } style={ { width: "100%" } } />
        </article>
      )
    }

    if ( img.state === 'paused' ) {
      return (
        <article className="tile is-child box">
          <h5 className="title is-5">Paused</h5>
          <h6 className="subtitle is-6">Progress: { img.progress }%</h6>
          <progress max="100" value={ img.progress } style={ { width: "100%" } } />
        </article>
      )
    }

    if ( img.state === 'error' ) {
      return (
        <article className="tile is-child box">
          <h5 className="title is-5">Error</h5>
          <h6 className="subtitle is-6">{ img.msg }</h6>
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
          <h5 className="title is-5">Saving metadata...</h5>
          <h6 className="subtitle is-6">Progress: Complete</h6>
        </article>
      )
    }

    return (
      <article className="r-thumbnail-image tile is-child box">
        <figure className="image is-4by3">
          <a href={ '#img/' + imgId }><img src={ img.downloadUrl } /></a>
          <p className="btns btns-tl">
            <a className="button is-primary" onClick={ this.onClickEdit.bind(this, img) }><span className="icon" style={{ marginLeft: 0 }}><i className="fa fa-pencil"></i></span></a>
          </p>
          <p className="btns btns-tr">
            <a className="button is-primary"><span className="icon" style={{ marginLeft: 0 }}><i className="fa fa-trash"></i></span></a>
          </p>
        </figure>
        <h5 className="title is-5">{ img.title }</h5>
        <h6 className="subtitle is-6">{ img.contentType }</h6>
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
    const totalPages = Math.ceil(total / perPage)
    const isFirst = pageNum === 1
    const isLast  = totalPages === 0 || pageNum === totalPages

    const first = (
      <a
        href="#gallery/1"
        className={ 'button' + (isFirst ? ' is-disabled' : '') }
      >&laquo;</a>
    )
    const prev = (
      <a
        href={ "#gallery/" + ( pageNum - 1 ) }
        className={ 'button' + (isFirst ? ' is-disabled' : '') }
      >&lt;</a>
    )
    const next = (
      <a
        href={ "#gallery/" + ( pageNum + 1 ) }
        className={ 'button' + (isLast ? ' is-disabled' : '') }
      >&gt;</a>
    )
    const last = (
      <a
        href={ "#gallery/" + totalPages }
        className={ 'button' + (isLast ? ' is-disabled' : '') }
      >&raquo;</a>
    )

    const pages = []
    for(let p = 1; p <= totalPages; p++) {
      pages.push(
        <a href={ "#gallery/" + p } className={ 'button' + (p === pageNum ? ' is-disabled' : '') }>
          { p }
        </a>
      )
    }

    const items = [
      first,
      prev,
      ...pages,
      next,
      last,
    ]

    return (
      <nav className="pagination">
        <ul>
          {
            items.map((item, i) => <li key={ i }>{ item }</li>)
          }
        </ul>
      </nav>
    )
  }
})

var UploadBar = React.createClass({
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

    // yes, logged in
    return (
      <nav className="level">
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
      return (
        <section className="section">
          <div className="container">
            Please sign in.
          </div>
        </section>
      )
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
          <ThumbnailImage store={ store } imgId={ img.key } img={ img } />
        </div>
      )
    })

    // render the upload form and their images
    return (
      <section className="section">
        <div className="container">
          <UploadBar store={ store } />
          <Pagination pageNum={ pageNum } total={ imgKeys.length } perPage={ cfg.imgsPerPage } />
          <div className="columns is-multiline is-mobile">
            { columns }
          </div>
        </div>
      </section>
    )
  }
})

var TagInput = React.createClass({
  propTypes: {
    value    : React.PropTypes.string.isRequired,
    onChange : React.PropTypes.func.isRequired,
  },
  render() {
    var tags = slugitAll(this.props.value)

    return (
      <div>
        <p className="control">
          <input className="input" type="text" placeholder="Comma separated tags" value={ this.props.value } onChange={ this.props.onChange } />
        </p>
        <p>
          <span>Tag Preview: </span>
          {
            tags.map((t) => <span key={ t }><span className="tag is-primary">{ t }</span>{ ' ' }</span>)
          }
        </p>
      </div>
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
            <h3 className="title is-3">{ img.title }</h3>
            <figure className="image is-4by3">
              <img src={ img.downloadUrl } />
            </figure>
            <p>{ img.desc }</p>
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

var EditModal = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  getInitialState() {
    const edit = this.props.store.getEdit()
    return {
      state : 'editing',
      title : edit.title,
      desc  : edit.desc,
      tag   : edit.tag,
    }
  },
  onClickCloseModal(ev) {
    ev.preventDefault()
    ev.stopPropagation()

    const { store } = this.props
    store.setEdit(null)
  },
  onClickSave(ev) {
    ev.preventDefault()
    ev.stopPropagation()

    const { store } = this.props
    const edit = store.getEdit()
    console.log('edit:', edit)
    console.log('edit.key=', edit.key)

    // set the state of this modal to 'saving'
    this.setState({ state : 'saving' })

    // firebase.auth() so we can get the currentUser
    var auth = firebase.auth()
    var currentUser = auth.currentUser

    // ok, let's save this new metadata
    var dbRef = firebase.database().ref()
    var userRef = dbRef.child('user/' + currentUser.uid)
    var imgRef = userRef.child(edit.key)
    var pubRef = dbRef.child('img/' + edit.key)

    // console.log('imgRef:', imgRef.toString())
    // console.log('pubRef:', pubRef.toString())

    // save the `user/$uid/$key`
    var obj = {
      title   : this.state.title,
      desc    : this.state.desc,
      tag     : this.state.tag,
      updated : firebase.database.ServerValue.TIMESTAMP,
    }
    console.log('obj:', obj)
    imgRef.update(obj).then(() => {
      console.log('imgRef.set: saved')
      // this will close the modal
      store.setEdit(null)
    }, (err) => {
      console.log('imgRef.set: err:', err)
      this.setState({ state : 'editing' })
    })

    // save the `img/$key`
    pubRef.update({
      title    : this.state.title,
      desc     : this.state.desc,
      updated  : firebase.database.ServerValue.TIMESTAMP,
    }).catch(function(err) {
      console.log('pubRef.set: err:', err)
    })
  },
  onChange(field, ev) {
    ev.preventDefault()
    ev.stopPropagation()

    var newState = {}
    newState[field] = ev.target.value
    this.setState(newState)
  },
  render() {
    var saveClass = "button is-primary" + ( this.state.state === 'saving' ? ' is-disabled' : '')

    return (
      <div className="modal is-active">
        <div className="modal-background" onClick={ this.onClickCloseModal }></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Edit Image</p>
            <button className="delete" onClick={ this.onClickCloseModal }></button>
          </header>
          <section className="modal-card-body">
            <div className="content">
              <label className="label">Title</label>
              <p className="control">
                <input className="input" type="text" placeholder="Title ..." value={ this.state.title } onChange={ this.onChange.bind(this, 'title') }/>
              </p>
              <label className="label">Description</label>
              <p className="control">
                <textarea className="textarea" placeholder="Description ..." value={ this.state.desc } onChange={ this.onChange.bind(this, 'desc') } />
              </p>
              <label className="label">Tag String</label>
              <TagInput value={ this.state.tag || '' } onChange={ this.onChange.bind(this, 'tag') } />
            </div>
          </section>
          <footer className="modal-card-foot">
            <a className={ saveClass } onClick={ this.onClickSave }>
              { this.state.state === 'saving' ? <span className="icon"><i className="fa fa-spinner fa-spin"></i></span> : null }
              Save
            </a>
            <a className="button" onClick={ this.onClickCloseModal }>Cancel</a>
          </footer>
        </div>
      </div>
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
        <Page store={ store } />
        {
          store.getEdit() && <EditModal store={ store } />
        }
        <Footer />
      </div>
    )
  }
})

// --------------------------------------------------------------------------------------------------------------------

module.exports = App

// --------------------------------------------------------------------------------------------------------------------
