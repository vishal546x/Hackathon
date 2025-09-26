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
// Check to avoid re-initializing
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// --- 3. GET HTML ELEMENTS ---
const userDisplayName = document.getElementById('user-display-name');
const signOutButton = document.getElementById('sign-out-btn');

// --- 4. AUTH STATE LISTENER (PAGE PROTECTION) ---
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in.
        console.log('User logged in:', user.displayName);
        // Display their name in the header
        userDisplayName.textContent = user.displayName;
    } else {
        // No user is signed in. Redirect to the login page.
        console.log('No user logged in, redirecting to login page...');
        window.location.href = 'login.html';
    }
});

// --- 5. SIGN OUT LOGIC ---
signOutButton.addEventListener('click', () => {
    auth.signOut().catch((error) => {
        console.error('Sign out error', error);
    });
    // The onAuthStateChanged listener above will handle the redirect
});