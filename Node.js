const admin = require('firebase-admin');

// Make sure you initialize the app first!
// This could be with a service account key or environment variable.
admin.initializeApp();

const db = admin.firestore();

async function checkFirebaseConnection() {
  try {
    // Attempt to get a list of collections
    const collections = await db.listCollections();

    if (collections.length > 0) {
      console.log('✅ Success! Connected to Firebase and Firestore.');
    } else {
      console.log('✅ Success! Connected to Firebase, but Firestore has no collections.');
    }

  } catch (error) {
    console.error('❌ Error! Failed to connect to Firebase.');
    console.error('Error details:', error.message);
  }
}

// Run the check
checkFirebaseConnection();