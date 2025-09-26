// This script combines the working logic from login1.js and the theme-switcher from login2.js

// 1. Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDuvMicM4rV1f3DF8pt7e7_4ag-wb7zRqo",
    authDomain: "hackathon-98293.firebaseapp.com",
    projectId: "hackathon-98293",
    storageBucket: "hackathon-98293.firebasestorage.app",
    messagingSenderId: "1020588547017",
    appId: "1:1020588547017:web:5dedd0c80a4f3c04542618",
    measurementId: "G-44D57HM0T4"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// 2. Get references to HTML elements
const loginView = document.getElementById('login-view');
const profileSetupView = document.getElementById('profile-setup-view');
const homePageView = document.getElementById('home-page-view');

const signInBtn = document.getElementById('google-signin-btn');
const completeProfileBtn = document.getElementById('complete-profile-btn');
const signOutBtn = document.getElementById('sign-out-btn');

const nameInput = document.getElementById('name-input');
const interestInput = document.getElementById('interest-input');
const welcomeMessage = document.getElementById('welcome-message');

// --- NEW: Theme Toggler Logic from login2.js ---
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); // Save theme choice
});

// Load saved theme from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // default to dark
    body.setAttribute('data-theme', savedTheme);
});
// --- End of Theme Toggler Logic ---

// 3. Sign-In Logic (from login1.js)
signInBtn.addEventListener('click', () => {
    auth.signInWithPopup(provider)
        .then(async (result) => {
            const user = result.user;
            // Check if user document exists in Firestore
            const userRef = db.collection('users').doc(user.uid);
            const doc = await userRef.get();

            if (doc.exists) {
                // User is already in the database, so go to home page
                showHomePage(doc.data());
            } else {
                // This is a new user, show the profile setup
                showProfileSetup();
            }
        })
        .catch((error) => {
            console.error("Error during sign-in:", error);
        });
});

// 4. Complete Profile Logic for new users (from login1.js)
completeProfileBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    const name = nameInput.value.trim();
    const areaOfInterest = interestInput.value.trim();

    if (!user || name === '' || areaOfInterest === '') {
        alert('Please fill out all fields to complete your profile.');
        return;
    }

    const userData = {
        uid: user.uid,
        name: name,
        email: user.email,
        areaOfInterest: areaOfInterest,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Save user data to Firestore
    db.collection('users').doc(user.uid).set(userData)
        .then(() => {
            console.log("User profile created!");
            showHomePage(userData);
        })
        .catch((error) => {
            console.error("Error saving user data:", error);
        });
});

// 5. Sign-Out Logic (from login1.js)
signOutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        // Show the login view after sign out
        loginView.classList.remove('hidden');
        homePageView.classList.add('hidden');
        profileSetupView.classList.add('hidden'); // Also hide profile setup
    });
});

// 6. Helper functions to switch between views (from login1.js)
function showProfileSetup() {
    loginView.classList.add('hidden');
    profileSetupView.classList.remove('hidden');
}

function showHomePage(userData) {
    // This is the "perfect connection" logic from login1.js
    // It redirects to a separate home page.
    window.location.href = "home.html"; 
}