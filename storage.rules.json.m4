// --------------------------------------------------------------------------------------------------------------------
//
// From: https://firebase.google.com/docs/storage/security
//
// All files are saved in
//
// * /img/{imageId} - where {imageId} is a 'ref.push().key' from Firebase Storage
//
// --------------------------------------------------------------------------------------------------------------------

service firebase.storage {
  match /b/__FIREBASE_STORAGE_BUCKET__/o {
    match /img/{imageId} {
      // read
      allow read;

      // write
      //
      // Allow write files to this path, subject to the constraints:
      //
      // 1) A user is logged in
      // 2) File is less than 10MB
      // 3) Content type is an image
      // 4) imageId is 20 chars (same as a database 'ref.push().key'
      // 5) ToDo: No file currently exists here
      allow write: if request.auth != null
        && lessThanMegabytes(10)
        && isImage()
        && imageId.size() == 20;
    }
  }
}

function isCurrentUser(uid) {
    return request.auth.uid == uid;
}

function isImage() {
  return request.resource.contentType.matches('image/.*')
}

function lessThanMegabytes(n) {
  return request.resource.size < n * 1024 * 1024
}

// --------------------------------------------------------------------------------------------------------------------
