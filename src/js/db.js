// --------------------------------------------------------------------------------------------------------------------

"use strict"

// npm
const pica = require('pica')
const pushid = require('pushid')

// local
const firebase = require('./firebase.js')

// --------------------------------------------------------------------------------------------------------------------

function resizeImage(file, callback) {
  console.log('resizeImage(): entry')

  var reader = new FileReader()
  reader.addEventListener('load', (ev) => {
    // firstly, let's create an img so we can create a thumbnail
    var img = document.createElement("img")
    img.src = ev.target.result

    // now we need to wait for the onload for the image too
    img.onload = () => {
      console.log("image is loaded")
      console.log('width:' + img.width)
      console.log('height:' + img.height)

      // create a src canvas
      // var src = new Canvas() // eslint: no-undef
      var src = document.createElement('canvas')
      src.width = img.width
      src.height = img.height

      // create the dst canvas
      // var dst = new Canvas() // eslint: no-undef
      var dst = document.createElement('canvas')
      var width = 256
      dst.width  = width
      dst.height = img.height * width / img.width

      // do the resize
      pica.resizeCanvas(img, dst, {
        quality          : 3,
        alpha            : true,
        unsharpAmount    : 80,
        unsharpRadius    : 0.6,
        unsharpThreshold : 2,
        transferable     : true,
      }, function (err) {
        if (err) return callback(err)

        console.log('image resized:', err)
        console.log('- img width:', img.width)
        console.log('- img height:', img.height)
        console.log('- src width:', src.width)
        console.log('- src height:', src.height)
        console.log('- new width:', dst.width)
        console.log('- new height:', dst.height)

        // callback with the new canvas
        callback(null, dst)
      })
    }
  })
  reader.readAsDataURL(file)
}

function uploadThm(store, key, now, dataUrl, callback) {
  console.log('uploadThm(): entry:', store, key, now, dataUrl.length)
  var storage = firebase.storage()
  var fileRef = storage.ref().child('thm/' + key)

  // upload this image with https://firebase.google.com/docs/reference/js/firebase.storage.Reference#put
  var uploadTask = fileRef.putString(dataUrl, 'data_url')

  // Register three observers:
  // 1. 'state_changed' observer, called any time the state changes
  // 2. Error observer, called on failure
  // 3. Completion observer, called on successful completion
  uploadTask.on(
    'state_changed',
    function(snapshot) {
      // ignore progress
    },
    callback,
    callback
  )

  return uploadTask
}

function uploadImg(store, key, now, file, callback) {
  var storage = firebase.storage()
  var fileRef = storage.ref().child('img/' + key)

  // file metadata : https://firebase.google.com/docs/storage/web/file-metadata
  var uploadTask = fileRef.put(file, {
    name : file.name,
  })

  console.log('*** already know the uploadTask.snapshot.downloadURL:' + uploadTask.snapshot.downloadURL)

  // Register three observers:
  // 1. 'state_changed' observer, called any time the state changes
  // 2. Error observer, called on failure
  // 3. Completion observer, called on successful completion
  uploadTask.on(
    'state_changed',
    function(snapshot) {
      // Observe state change events such as progress, pause, and resume
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded.
      var progress = Math.floor(snapshot.bytesTransferred / snapshot.totalBytes * 100)

      switch (snapshot.state) {
      case firebase.storage.TaskState.RUNNING: // or 'running'
        store.imgChanged(key, { state : 'uploading', progress : progress, inserted : now })
        break
      case firebase.storage.TaskState.PAUSED: // or 'paused'
        store.imgChanged(key, { state : 'paused', progress : progress, inserted : now })
        break
      default:
        console.log('- Unknown shapshot.state:', snapshot.state)
      }
    },
    function(err) {
      // something went wrong with the upload
      store.imgChanged(key, { state : 'error', msg : '' + err, inserted : now })

      switch (err.code) {
      case 'storage/unauthorized':
        // User doesn't have permission to access the object
        console.log('- storage/unauthorized', err)
        break
      case 'storage/canceled':
        // User canceled the upload
        console.log('- storage/canceled', err)
        break
      case 'storage/unknown':
        // Unknown error occurred, inspect error.serverResponse
        console.log('- storage/unknown', err)
        break
      default:
        console.log('- Unknown error:', err)
      }

      callback(err)
    },
    function() {
      // file saved - now save the metadata
      callback()
    }
  )

  // return the uploadTask to the caller so they can use it themselves
  return uploadTask
}

function saveUserImage(uid, key, filename, size, contentType, downloadUrl, thumbnailUrl, callback) {
  // create the imgRef
  var dbRef = firebase.database().ref()
  var imgRef = dbRef.child('user/' + uid + '/' + key)

  console.log('saveUserImage:', imgRef.key, filename, size, contentType, downloadUrl, thumbnailUrl)
  imgRef.set({
    title        : filename,
    desc         : '',
    tag          : '',
    downloadUrl  : downloadUrl,
    thumbnailUrl : thumbnailUrl,
    filename     : filename,
    size         : size,
    contentType  : contentType,
    inserted     : firebase.database.ServerValue.TIMESTAMP,
    updated      : firebase.database.ServerValue.TIMESTAMP,
  }).then(() => {
    console.log('imgRef - saved')
    callback()
  }, (err) => {
    console.log('imgRef.set: err:', err)
    callback(err)
  })
}

function savePubImage(uid, key, title, downloadUrl, callback) {
  var dbRef = firebase.database().ref()
  var pubRef = dbRef.child('img/' + key)

  console.log('savePubImage:', pubRef.key, uid, title, downloadUrl)
  pubRef.set({
    // include `uid` so we can check auth in the database (otherwise anyone could put stuff here)
    uid          : uid,
    title        : title,
    desc         : '',
    downloadUrl  : downloadUrl,
    inserted     : firebase.database.ServerValue.TIMESTAMP,
    updated      : firebase.database.ServerValue.TIMESTAMP,
  }).then(() => {
    console.log('pubRef - saved!')
    callback()
  }, (err) => {
    console.log('pubRef.set: err:', err)
    callback(err)
  })
}

// From : https://firebase.google.com/docs/storage/web/upload-files
function uploadImage(store, file, callback) {
  // make sure the file has something in it
  if ( file.size === 0 ) {
    callback("File size must be greater than 0 bytes")
    return
  }

  // firebase.auth() so we can get the currentUser
  var auth = firebase.auth()
  var currentUser = auth.currentUser
  var uid = currentUser.uid

  // create a new key and an inserted time
  var key = pushid()
  var now = Date.now()

  // update this key already (ie. the start of showing progress)
  store.imgChanged(key, { state : 'uploading', progress : 0, inserted : now })

  // there are a few things to do here:
  //
  // 1. create a thumbnail by resizing the image
  // 2. upload the image
  // 3. upload the thumbnail
  // 4. save the `/user/<key>` to the datastore
  // 5. save the `/img/<key>` to the datastore
  resizeImage(file, (err, canvas) => {
    console.log('resizeImage(): finished:', err, canvas)

    // upload the Thumbnail and the Image at the same time

    var downloadUrl
    var thumbnailUrl

    const dataUrl = canvas.toDataURL()
    const uploadTaskThumb = uploadThm(store, key, now, dataUrl, (err) => {
      console.log('uploadThm result : ', err)
      thumbnailUrl = uploadTaskThumb.snapshot.downloadURL
    })

    const uploadTask = uploadImg(store, key, now, file, (err, res) => {
      console.log('uploadImg(): finished:', err, res)
      downloadUrl = uploadTask.snapshot.downloadURL

      // We can cheat here and start showing the image already, since the upload has finished - no need to wait for
      // the 'database' imgRef to save and then be notified back.
      store.imgChanged(key, { state : 'saving-metadata', downloadUrl : downloadUrl, thumbnailUrl : thumbnailUrl, inserted : now })

      console.log('2 downloadUrl:', uploadTask.snapshot.downloadURL)

      // save the `/user/$imgId`
      saveUserImage(uid, key, file.name, file.size, file.type, downloadUrl, thumbnailUrl, (err) => {
        console.log('saveUserImage:', err)
      })

      // save the `/img/$imgId`
      savePubImage(uid, key, file.name, downloadUrl, (err) => {
        console.log('savePubImage:', err)
      })

      // just callback
      return callback()
    })
  })
}

// --------------------------------------------------------------------------------------------------------------------

module.exports = {
  uploadImage,
}

// --------------------------------------------------------------------------------------------------------------------
