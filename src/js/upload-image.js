// --------------------------------------------------------------------------------------------------------------------

"use strict"

// local
var firebase = require('./firebase.js')

// --------------------------------------------------------------------------------------------------------------------


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

  // firstly, get a new database ref
  var dbRef = firebase.database().ref()
  var userRef = dbRef.child('user/' + currentUser.uid)
  var imgRef = userRef.push()
  var pubRef = dbRef.child('img/' + imgRef.key)

  // firebase storage -> /img/<imgRef.key>
  var storage = firebase.storage()
  var fileRef = storage.ref().child('img/' + imgRef.key)

  var now = Date.now()
  store.imgChanged(imgRef.key, { state : 'uploading', progress : 0, inserted : now })

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
      var progress = Math.floor(snapshot.bytesTransferred / snapshot.totalBytes * 100)

      switch (snapshot.state) {
      case firebase.storage.TaskState.RUNNING: // or 'running'
        store.imgChanged(imgRef.key, { state : 'uploading', progress : progress, inserted : now })
        break
      case firebase.storage.TaskState.PAUSED: // or 'paused'
        store.imgChanged(imgRef.key, { state : 'paused', progress : progress, inserted : now })
        break
      default:
        console.log('- Unknown shapshot.state:', snapshot.state)
      }
    },
    function(err) {
      // something went wrong with the upload
      store.imgChanged(imgRef.key, { state : 'error', msg : '' + err, inserted : now })

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

      // We can cheat here and start showing the image already, since the upload has finished - no need to wait for
      // the 'database' imgRef to save and then be notified back.
      store.imgChanged(imgRef.key, { state : 'saving-metadata', downloadUrl : uploadTask.snapshot.downloadURL, inserted : now })

      // firstly, get the metadata from the file back
      fileRef.getMetadata().then(function(metadata) {
        console.log('file metadata:', metadata)

        imgRef.set({
          downloadUrl : uploadTask.snapshot.downloadURL,
          title       : file.name,
          desc        : '',
          tag         : '',
          filename    : file.name,
          size        : metadata.size,
          contentType : metadata.contentType,
          inserted    : firebase.database.ServerValue.TIMESTAMP,
          updated     : firebase.database.ServerValue.TIMESTAMP,
        }).catch(function(err) {
          console.log('imgRef.set: err:', err)
        })

        pubRef.set({
          // include `uid` so we can check auth in the database (otherwise anyone could put stuff here)
          uid      : currentUser.uid,
          inserted : firebase.database.ServerValue.TIMESTAMP,
        }).catch(function(err) {
          console.log('pubRef.set: err:', err)
        })

        // for now, just callback
        callback()
      }).catch(function(err) {
        console.log('error getting file metadata:', err)
        callback(err)
      })
    }
  )
}

// --------------------------------------------------------------------------------------------------------------------

module.exports = uploadImage

// --------------------------------------------------------------------------------------------------------------------
