// --------------------------------------------------------------------------------------------------------------------

"use strict"

// global
var React = require('react')

// local
var cfg = require('./cfg.js')
var firebase = require('./firebase.js')
var db = require('./db.js')
var slugitAll = require('./slugit-all.js')

// --------------------------------------------------------------------------------------------------------------------

var domain = 'imagelicious.org'
var tagLine = 'Photo Gallery, built using Firebase.'

var Imagelicious = React.createClass({
  render() {
    return <a href="/">imagelicious.org</a>
  },
})

var Firebase = React.createClass({
  render() {
    return <a href="https://firebase.google.com/" target="_blank">Firebase</a>
  },
})

var GitHub = React.createClass({
  render() {
    return <a href="https://github.com/appsattic/imagelicious.org" target="_blank">Firebase</a>
  },
})

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
  onClickDel(img, ev) {
    ev.preventDefault()
    ev.stopPropagation()

    const { store } = this.props
    store.setDel(img)
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
            img.thumbnailUrl
            ? <figure className="image is-4by3">
                <a href={ '#img/' + imgId }><img src={ img.thumbnailUrl } /></a>
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
          <a href={ '#img/' + imgId }><img src={ img.thumbnailUrl } /></a>
          <p className="btns btns-tl">
            <a className="button is-primary" onClick={ this.onClickEdit.bind(this, img) }><span className="icon" style={{ marginLeft: 0 }}><i className="fa fa-pencil"></i></span></a>
          </p>
          {
            /*
          <p className="btns btns-tr">
            <a className="button is-primary" onClick={ this.onClickDel.bind(this, img) }><span className="icon" style={{ marginLeft: 0 }}><i className="fa fa-trash"></i></span></a>
          </p>
            */
          }
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
    store   : React.PropTypes.object.isRequired,
    showing : React.PropTypes.number.isRequired,
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
      db.uploadImage(store, ev.target.files[i], function(err, res) {
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
  onChangeFilterTag(ev) {
    ev.preventDefault()
    ev.stopPropagation()

    var store = this.props.store
    store.clearFilter('tag')

    const val = ev.target.value
    if ( val !== 'All' ) {
      store.setFilter('tag', val)
    }
  },
  render() {
    const { store, showing } = this.props

    const count       = store.countImgs()
    const validSorts  = store.getValid('sort')       // returns an array
    const validTags   = store.getValid('tag').sort() // returns an array
    const tagSelected = store.getSelected('tag')     // returns an array (of length 0 or 1)

    // yes, logged in
    return (
      <nav className="level">
        <div className="level-left">
          <p className="level-item">
            <input type="file" id="file" name="file" onChange={ this.onChangeFile } multiple={ true } style={ { display: 'none' } }/>
            <a className="button is-success" onClick={ this.onClickUpload }>Upload Images</a>
          </p>
          <div className="level-item">
            <p className="subtitle is-5">
              {
                this.props.showing === count
                  ? <span><strong>{ count }</strong> image(s) total</span>
                  : <span>Showing <strong>{ showing }</strong> of <strong>{ count }</strong> image(s)</span>
              }
            </p>
          </div>
        </div>
        <div className="level-right">
           <p className="level-item">Sort:</p>
           {
             validSorts.map((title, i) => {
               if ( store.getFilter('sort', title) ) {
                 return <p key={ 'msg-' + i } className="level-item"><strong>{ title }</strong></p>
               }
               return <p key={ 'msg-' + i } onClick={ this.onClickSort.bind(this, 'sort', title) } className="level-item"><a>{ title }</a></p>
             })
           }
           <p className="level-item"> : </p>
           <p className="level-item">Tag Filter:</p>
           <p className="control">
            <span className="select">
              <select value={ tagSelected.length ? tagSelected[0] : '' } onChange={ this.onChangeFilterTag }>
                <option key={ 'All' }>All</option>
                {
                  validTags.map((tag) => <option key={ tag }>{ tag }</option>)
                }
              </select>
            </span>
          </p>
        </div>
      </nav>
    )
  }
})

var SimpleSection = React.createClass({
  propTypes: {
    text : React.PropTypes.string.isRequired,
  },
  render() {
    return (
      <section className="section">
        <div className="container">
          { this.props.text }
        </div>
      </section>
    )
  },
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
      return <SimpleSection text="Please sign in." />
    }

    const args = store.getArgs()
    const filters = store.getFilters()
    let pageNum = args.pageNum

    // Filtering and Sorting:
    //
    // 1. filter in/out any currently selected tag
    // 2. sort by Newest/Oldest
    // 3. slice depending on page number

    // get all of the images into `selectedImgs` for filtering/sorting
    const imgs = store.getImgs()
    const imgKeys = Object.keys(imgs)
    let selectedImgs = imgKeys.map((key) => imgs[key])

    // 1. filter in/out any currently selected tag
    const tagSelected = store.getSelected('tag')   // returns an array (of length 0 or 1)
    if ( tagSelected.length ) {
      selectedImgs = selectedImgs.filter((img) => {
        var hasTag = false
        img.tags.forEach((tag) => {
          if ( tag === tagSelected[0] ) {
            hasTag = true
          }
        })
        return hasTag
      })
    }
    else {
      // no filter needs to be performed since no tag is currently selected
    }

    // 2. sort by Newest/Oldest
    // get the full set of image data in an array
    const order = filters.sort['Newest First'] ? 1 : -1
    selectedImgs = selectedImgs.sort((a, b) => {
      // From: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
      if ( a.inserted < b.inserted ) return order
      if ( a.inserted > b.inserted ) return -order
      return 0
    })

    // 3. slice depending on page number
    const start = (pageNum - 1) * cfg.imgsPerPage
    const end = pageNum * cfg.imgsPerPage
    const showImgs = selectedImgs.slice(start, end)

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
          <UploadBar store={ store } showing={ selectedImgs.length } />
          <Pagination pageNum={ pageNum } total={ selectedImgs.length } perPage={ cfg.imgsPerPage } />
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
  onClickBack(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    history.back()
  },
  render() {
    var store = this.props.store
    var img = store.getImg()

    if ( img === null ) {
      return <SimpleSection text="Loading..." />
    }

    if ( img === false ) {
      let msg = "Unknown Image : " + store.getArgs().imgId
      return <SimpleSection text={ msg } />
    }

    if ( img instanceof Error ) {
      return <SimpleSection text={ 'Something went wrong when loading image : ' + img } />
    }

    return (
      <section className="section">
        <div className="container">
          <div className="content">
            <p><a href="#" onClick={ this.onClickBack }>&laquo; Back to Previous Page</a></p>
          </div>
          <article className="tile is-child box">
            <h3 className="title is-3">{ img.title }</h3>
            <figure className="image is-4by3">
              <img src={ img.downloadUrl } />
            </figure>
            <div className="content">
              <p>{ img.desc || <em>No description.</em> }</p>
            </div>
          </article>
        </div>
      </section>
    )
  }
})

var HelpPage = React.createClass({
  render() {
    return (
      <section className="section">
        <div className="container content">
          <h3 className="title is-3">imagelicious.org</h3>
          <p>
            <Imagelicious /> is an open source, simple to use personal photo gallery built on <Firebase />.
          </p>
          <p>
            To use Imagelicious you can just sign in at the top right hand corner using your Google Account,
            and start using it straight away. Images that you upload are private unless you share the public URL with friends or
            family. You may change the title, description and tags on your images.
          </p>
          <h4 className="title is-4">Using this WebApp</h4>
          <p>
            In general, unless you sign in to Imagelicious, there&apos;s not much you can do on the site. If you have been given
            an image URL to view, then you can view it independently of whether you are signed in or not. An example image link
            is <a href="#img/-KOtJIqXSyBOZHnlIesu">https://imagelicious.org/#img/-KOtJIqXSyBOZHnlIesu</a>.
          </p>
          <h4 className="title is-4">Features</h4>
          <p>
            Imagelicious has few features, but they are powerful. Some of the highlights are:
          </p>
          <ul>
            <li>Multiple parallel file uploads with progress bars</li>
            <li>Freeform tags field, parsed into individual tags</li>
            <li>Thumbnail generation within the browser (coming soon)</li>
          </ul>
          <h4 className="title is-4">Pages</h4>
          <p>
            There are two main pages inside Imagelicious, your <strong>Gallery</strong> page(s) and your <strong>Image</strong> pages.
            By clicking an image in the gallery, you can see your full-size image. From here you can copy the URL to give to your
            friends and family.
          </p>
          <p>
            Inside the gallery page you&apos;ll see some pagination icons if your have more than 20 images. You can also click the 'pencil'
            icon which appears on top of each image as you hover over it to be able to edit the title, descriptions and tags against
            that image. There is currently no functionality on the image page when viewing your images.
          </p>
          <h4 className="title is-4">Sharing</h4>
          <p>
            You can share a link to any of your images by copying the URL from the address bar of the image you&apos;re currently looking at.
            Your images are public by default, but due to the randomness in the image id, hard to guess. Only the people you share the URL
            with will be able to see your images.
          </p>
          <h4 className="title is-4">Hosted v Self-Hosted</h4>
          <p>
            Imagelicious is hosted on top of Firebase, so in theory you can&apos;t host it yourself, however you can create
            your own Firebase project and run it yourself. Imagelicious is open source so you can also clone it, change it,
            run a new version or even run a version and charge users for it.
          </p>
          <p>
            Imagelicious uses the following Firebase services : Hosting, Database, and Storage. Using Firebase may incur a cost to you, however
            it is your responsibility to investigate and accept this. Please see the project on <GitHub /> for
            docs on how to run Imagelicious yourself.
          </p>
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
          <h5 className="subtitle is-5">{ tagLine }</h5>
          <p>
            imagelicious.org is a personal image gallery that runs as a single page app (SPA) on top of Firebase.
          </p>
          <h4 className="title is-4">Who is it for?</h4>
          <p>
            It is one of three things:
          </p>
          <ol>
            <li>an example of a Firebase app using various technologies (such as ReactJS, Browserify)</li>
            <li>an app instance you can use right here on <a href="/">imagelicious.org</a></li>
            <li>an app that you can clone from the <a href="https://github.com/appsattic/imagelicious.org">GitHub repo</a> and run yourself on top of Firebase</li>
          </ol>
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

    if ( page === 'help' ) {
      return <HelpPage />
    }

    if ( page === 'about' ) {
      return <AboutPage />
    }

    return (
      <section className="section">
        <div className="container">
          Not found. Go to your <a href="#gallery/1">gallery page</a>.
        </div>
      </section>
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
                  { domain }
                </a>
                <a className="nav-item" href="#help">
                  Help
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
            <h1 className="title">{ domain }</h1>
            <h2 className="subtitle">{ tagLine }</h2>
          </div>
        </div>
      </section>
    )
  }
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

    // set the state of this modal to 'in-progress' (which is actually 'saving')
    this.setState({ state : 'in-progress' })

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
    imgRef.update(obj).then(() => {
      // console.log('imgRef.set: saved')
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
    var saveClass = "button is-primary" + ( this.state.state === 'in-progress' ? ' is-disabled' : '')

    return (
      <div className="modal is-active">
        <div className="modal-background" onClick={ this.onClickCloseModal }></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Edit Image</p>
            <button onClick={ this.onClickCloseModal }></button>
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
              { this.state.state === 'in-progress' ? <span className="icon"><i className="fa fa-spinner fa-spin"></i></span> : null }
              Save
            </a>
            <a className="button" onClick={ this.onClickCloseModal }>Cancel</a>
          </footer>
        </div>
      </div>
    )
  }
})

var DelModal = React.createClass({
  propTypes: {
    store : React.PropTypes.object.isRequired,
  },
  getInitialState() {
    return {
      state : 'editing',
    }
  },
  onClickCloseModal(ev) {
    ev.preventDefault()
    ev.stopPropagation()

    const { store } = this.props
    store.setDel(null)
  },
  onClickDel(ev) {
    ev.preventDefault()
    ev.stopPropagation()

    const { store } = this.props
    const del = store.getDel()

    // set the state of this modal to 'in-progress' (which is actually 'deleting')
    this.setState({ state : 'in-progress' })

    // firebase.auth() so we can get the currentUser
    var auth = firebase.auth()
    var currentUser = auth.currentUser

    // now to delete this metadata
    var dbRef = firebase.database().ref()
    var userRef = dbRef.child('user/' + currentUser.uid)
    var imgRef = userRef.child(del.key)
    var pubRef = dbRef.child('img/' + del.key)

    // console.log('imgRef:', imgRef.toString())
    // console.log('pubRef:', pubRef.toString())

    var count = 0

    var p1 = imgRef.remove()
    p1.then(() => {
      console.log("Removal of imgRef successful")
      count++
      if ( count === 2 ) {
        this.setState({ state : 'editing' })
        store.setDel(null)
      }
    }).catch((err) => {
      console.log("Removal of imgRef failed: " + err.message)
    })

    var p2 = pubRef.remove()
    p2.then(() => {
      console.log("Removal of pubRef successful")
      count++
      if ( count === 2 ) {
        this.setState({ state : 'editing' })
        store.setDel(null)
      }
    }).catch((err) => {
      console.log("Removal of pubRef failed: " + err.message)
    })

    // ToDo: remove the object from 'storage'
  },
  render() {
    const { store } = this.props
    const del = store.getDel()

    var saveClass = "button is-primary" + ( this.state.state === 'in-progress' ? ' is-disabled' : '')

    return (
      <div className="modal is-active">
        <div className="modal-background" onClick={ this.onClickCloseModal }></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Delete Image</p>
            <button onClick={ this.onClickCloseModal }></button>
          </header>
          <section className="modal-card-body">
            <div className="content">
              <label className="label">Title</label>
              <p className="control">{ del.title }</p>
              <label className="label">Description</label>
              <p className="control">{ del.title }</p>
              <label className="label">Tag String</label>
              <p className="control">{ del.tag }</p>
            </div>
          </section>
          <footer className="modal-card-foot">
            <a className={ saveClass } onClick={ this.onClickDel }>
              { this.state.state === 'in-progress' ? <span className="icon"><i className="fa fa-spinner fa-spin"></i></span> : null }
              Delete
            </a>
            <a className="button" onClick={ this.onClickCloseModal }>Cancel</a>
          </footer>
        </div>
      </div>
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
        {
          store.getDel() && <DelModal store={ store } />
        }
      </div>
    )
  }
})

// --------------------------------------------------------------------------------------------------------------------

module.exports = App

// --------------------------------------------------------------------------------------------------------------------
