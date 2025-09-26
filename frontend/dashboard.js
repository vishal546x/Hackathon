// Use the same Firebase config as in login.js
const firebaseConfig = {
  apiKey: "AIzaSyDvOHl0cslHOIfZP_x10PC0ZjlKiNVe8ZA",
  authDomain: "hackathon-67329.firebaseapp.com",
  projectId: "hackathon-67329",
  storageBucket: "hackathon-67329.appspot.com",
  messagingSenderId: "728481126603",
  appId: "1:728481126603:web:89ae1afa251cdbaab3a34e",
  measurementId: "G-0QF9KYSDCC"
};

// Initialize Firebase (check to avoid re-initializing)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// Get HTML elements
const userDisplayName = document.getElementById('user-display-name');
const signOutButton = document.getElementById('sign-out-btn');

// Auth state listener
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in. Display their name.
        userDisplayName.textContent = user.displayName;
    } else {
        // No user is signed in. Redirect to login page.
        window.location.href = 'login.html';
    }
});

// Sign out functionality
signOutButton.addEventListener('click', () => {
    auth.signOut().catch((error) => {
        console.error('Sign out error', error);
    });
});