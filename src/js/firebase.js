// --------------------------------------------------------------------------------------------------------------------

// global
var firebase = require('firebase')

// --------------------------------------------------------------------------------------------------------------------

firebase.initializeApp({
  apiKey        : process.env.FIREBASE_API_KEY,
  authDomain    : process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL   : process.env.FIREBASE_DATABASE_URL,
  storageBucket : process.env.FIREBASE_STORAGE_BUCKET,
})

// --------------------------------------------------------------------------------------------------------------------

module.exports = firebase

// --------------------------------------------------------------------------------------------------------------------
