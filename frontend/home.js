// 1. Initialize Firebase with your project's configuration
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

// 2. Get references to HTML elements
const userDisplayName = document.getElementById('user-display-name');
const signOutBtn = document.getElementById('sign-out-btn');
const companiesGrid = document.getElementById('companies-grid');
const loadingMessage = document.getElementById('loading-message');

// 3. Authentication Logic
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // User is signed in
        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();
        if (doc.exists) {
            userDisplayName.textContent = doc.data().name;
        } else {
            // This case should ideally not happen if profile setup is mandatory
            userDisplayName.textContent = user.email;
        }
        
        // Fetch and display companies
        loadCompanies();

    } else {
        // User is signed out
        console.log("No user is signed in. Redirecting to login.");
        window.location.href = "login.html"; // Redirect to your login page
    }
});

// 4. Function to load companies from Firestore
async function loadCompanies() {
    try {
        const snapshot = await db.collection('companies').get();
        
        if (snapshot.empty) {
            loadingMessage.textContent = 'No companies found.';
            return;
        }
        
        // Clear the loading message
        companiesGrid.innerHTML = ''; 

        snapshot.forEach(doc => {
            const companyId = doc.id;
            const companyData = doc.data();

            // Create the company card HTML
            const companyCard = `
                <a href="role.html?company=${companyId}" class="company-card block bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <div class="flex flex-col items-center text-center">
                        <img src="${companyData.logoUrl || 'https://via.placeholder.com/64'}" alt="${companyData.name} Logo" class="h-16 w-16 mb-4 object-contain">
                        <h3 class="text-2xl font-semibold text-gray-900">${companyData.name}</h3>
                        <p class="text-gray-500 mt-1">${companyData.website || ''}</p>
                    </div>
                </a>
            `;
            // Add the new card to the grid
            companiesGrid.innerHTML += companyCard;
        });

    } catch (error) {
        console.error("Error loading companies:", error);
        loadingMessage.textContent = 'Failed to load companies.';
    }
}

// 5. Sign-Out Logic
signOutBtn.addEventListener('click', () => {
    auth.signOut();
});