// --- 1. CONFIGURE FIREBASE ---
// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDuvMicM4rV1f3DF8pt7e7_4ag-wb7zRqo",
  authDomain: "hackathon-98293.firebaseapp.com",
  projectId: "hackathon-98293",
  storageBucket: "hackathon-98293.firebasestorage.app",
  messagingSenderId: "1020588547017",
  appId: "1:1020588547017:web:5dedd0c80a4f3c04542618",
  measurementId: "G-44D57HM0T4"
};

// --- 2. INITIALIZE FIREBASE ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- 3. GET HTML ELEMENTS ---
const loginButton = document.getElementById('google-login-btn');
const loader = document.getElementById('loader');

// --- 4. LOGIN LOGIC ---
loginButton.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    loader.classList.remove('hidden');
    loginButton.classList.add('hidden');

    auth.signInWithPopup(provider)
        .then(result => {
            // This will create a user profile in Firestore if they're new
            createUserProfileDocument(result.user);
        })
        .catch(error => {
            console.error("Error during sign in:", error);
            loader.classList.add('hidden');
            loginButton.classList.remove('hidden');
        });
});

// Create user document in Firestore if one doesn't exist
async function createUserProfileDocument(userAuth) {
    if (!userAuth) return;
    const userDocRef = db.collection('users').doc(userAuth.uid);
    const snapshot = await userDocRef.get();
    if (!snapshot.exists) {
        const { displayName, email } = userAuth;
        const createdAt = new Date();
        await userDocRef.set({
            name: displayName,
            email: email,
            createdAt: createdAt,
        });
    }
}

// --- 5. REDIRECT IF LOGGED IN ---
auth.onAuthStateChanged(user => {
    if (user) {
        // If user is logged in, redirect to the home page
        window.location.href = 'home.html';
    } else {
        // If user is logged out, ensure the loader is hidden
        loader.classList.add('hidden');
    }
});