// Dropdown menu logic
document.addEventListener('DOMContentLoaded', () => {
    const profileButton = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileButton && profileDropdown) {
        profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
    }
    window.addEventListener('click', () => {
        if (profileDropdown && profileDropdown.classList.contains('show')) {
            profileDropdown.classList.remove('show');
        }
    });
});

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

// 2. Get references to HTML elements
const userDisplayName = document.getElementById('user-display-name');
const userInitial = document.getElementById('user-initial');
const signOutBtn = document.getElementById('sign-out-btn');
const companiesGrid = document.getElementById('companies-grid');
const loadingMessage = document.getElementById('loading-message');
const profileModal = document.getElementById('profile-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const profileLink = document.querySelector('#profile-dropdown a[href="#"]');
const profileModalName = document.getElementById('profile-modal-name');
const profileModalEmail = document.getElementById('profile-modal-email');
const profileModalInterest = document.getElementById('profile-modal-interest');
const yourCompaniesLink = document.getElementById('your-companies-link');
const yourRolesLink = document.getElementById('your-roles-link');
let currentUserData = null;
let currentUserId = null;


// 3. Authentication Logic
// In home.js

auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUserId = user.uid;
        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();
        if (doc.exists) {
            currentUserData = doc.data(); 
            userDisplayName.textContent = currentUserData.name;
            userInitial.textContent = currentUserData.name.charAt(0).toUpperCase();
        } else {
            userDisplayName.textContent = user.email;
            userInitial.textContent = user.email.charAt(0).toUpperCase();
        }
        
        // --- NEW: Check for a filter in the URL ---
        const urlParams = new URLSearchParams(window.location.search);
        const filter = urlParams.get('filter');

        if (filter === 'my-companies') {
            loadEnrolledCompanies();
        } else if (filter === 'my-roles') {
            loadEnrolledRoles();
        } else {
            // Default behavior if no filter is present
            loadAllCompanies();
        }

    } else {
        window.location.href = "login.html";
    }
});
// 4. Functions to load and display data
async function loadAllCompanies() {
    try {
        const snapshot = await db.collection('companies').get();
        displayCompanies(snapshot, 'Explore Top Companies');
    } catch (error) { console.error("Error loading all companies:", error); }
}

async function loadEnrolledCompanies() {
    if (!currentUserId) return;
    try {
        companiesGrid.innerHTML = `<p class="col-span-full text-center">Loading your companies...</p>`;
        const progressSnapshot = await db.collection('users').doc(currentUserId).collection('progress').get();
        const roadmapIds = new Set(progressSnapshot.docs.map(doc => doc.data().roadmapId).filter(id => id));
        if (roadmapIds.size === 0) { displayCompanies(null, 'Your Enrolled Companies'); return; }
        const roadmapsQuery = await db.collection('roadmaps').where(firebase.firestore.FieldPath.documentId(), 'in', [...roadmapIds]).get();
        const companyIds = new Set(roadmapsQuery.docs.map(doc => doc.data().companyId));
        if (companyIds.size === 0) { displayCompanies(null, 'Your Enrolled Companies'); return; }
        const companiesSnapshot = await db.collection('companies').where(firebase.firestore.FieldPath.documentId(), 'in', [...companyIds]).get();
        displayCompanies(companiesSnapshot, 'Your Enrolled Companies');
    } catch (error) { console.error("Error loading enrolled companies:", error); }
}

// --- UPDATED Function to load ONLY enrolled roles ---
async function loadEnrolledRoles() {
    if (!currentUserId) return;
    try {
        companiesGrid.innerHTML = `<p class="col-span-full text-center">Loading your roles...</p>`;
        
        // Step 1: Get user's progress to find started roadmaps
        const progressSnapshot = await db.collection('users').doc(currentUserId).collection('progress').get();
        const roadmapIds = new Set(progressSnapshot.docs.map(doc => doc.data().roadmapId).filter(id => id));

        if (roadmapIds.size === 0) {
            displayRoles(null, null); // Pass nulls to show empty message
            return;
        }

        // Step 2: Fetch the roadmap documents
        const roadmapsSnapshot = await db.collection('roadmaps').where(firebase.firestore.FieldPath.documentId(), 'in', [...roadmapIds]).get();
        
        // --- NEW: Step 3: Fetch associated company data to get names ---
        const companyIds = new Set(roadmapsSnapshot.docs.map(doc => doc.data().companyId));
        const companiesSnapshot = await db.collection('companies').where(firebase.firestore.FieldPath.documentId(), 'in', [...companyIds]).get();

        // Create a simple map for easy name lookup: { companyId: 'CompanyName', ... }
        const companyNameMap = {};
        companiesSnapshot.forEach(doc => {
            companyNameMap[doc.id] = doc.data().name;
        });

        // Step 4: Display the roles, passing the name map as well
        displayRoles(roadmapsSnapshot, companyNameMap);

    } catch (error) {
        console.error("Error loading enrolled roles:", error);
    }
}

// 5. Helper functions to render UI
function displayCompanies(snapshot, title) {
    const pageTitle = document.querySelector('header.text-center h1');
    pageTitle.textContent = title;
    document.getElementById('show-all-container')?.remove();

    if (!snapshot || snapshot.empty) {
        companiesGrid.innerHTML = `<p class="col-span-full text-center">${title.includes('Enrolled') ? "You haven't started any journeys yet." : "No companies found."}</p>`;
        return;
    }
    
    companiesGrid.innerHTML = '';
    snapshot.forEach(doc => {
        const companyId = doc.id; const companyData = doc.data();
        companiesGrid.innerHTML += `
            <a href="role.html?company=${companyId}" class="company-card block p-0">
                <div class="card-content flex flex-col items-center justify-center p-6 h-full">
                    <img src="${companyData.logoUrl || 'https://via.placeholder.com/64'}" alt="${companyData.name} Logo" class="h-14 w-14 mb-4 object-contain">
                    <h2 class="text-2xl font-semibold text-slate-100">${companyData.name}</h2>
                    <p class="text-slate-400 mt-1">${companyData.description || ''}</p>
                </div>
            </a>`;
    });

    if (title.includes('Enrolled')) {
        const mainElement = document.querySelector('main.w-full');
        mainElement.insertAdjacentHTML('afterend', `<div id="show-all-container" class="text-center mt-8"><a href="#" id="show-all-link" class="text-indigo-400 hover:underline">Show All Companies &rarr;</a></div>`);
        document.getElementById('show-all-link').addEventListener('click', e => { e.preventDefault(); loadAllCompanies(); });
    }
}

// --- UPDATED Helper function to display ROLE cards ---
function displayRoles(snapshot, companyNameMap) {
    const pageTitle = document.querySelector('header.text-center h1');
    pageTitle.textContent = "Your Enrolled Roles";
    document.getElementById('show-all-container')?.remove();

    if (!snapshot || snapshot.empty) {
        companiesGrid.innerHTML = `<p class="col-span-full text-center">You haven't started any roles yet.</p>`;
        return;
    }

    companiesGrid.innerHTML = ''; // Clear the grid
    snapshot.forEach(doc => {
        const roadmapId = doc.id;
        const roadmapData = doc.data();
        // --- NEW: Look up the company name using the map ---
        const companyName = companyNameMap[roadmapData.companyId] || 'Unknown Company';

        companiesGrid.innerHTML += `
            <a href="roadmap-details.html?id=${roadmapId}" class="company-card block p-0">
                <div class="card-content flex flex-col items-center justify-center text-center p-8 h-full">
                    <p class="text-indigo-400 text-sm font-medium mb-2">${companyName}</p> 
                    <h2 class="text-2xl font-semibold text-slate-100 mb-2">${roadmapData.title}</h2>
                    <p class="text-slate-400 text-sm">${roadmapData.roleDescription || 'Click to continue your journey'}</p>
                </div>
            </a>`;
    });

    const mainElement = document.querySelector('main.w-full');
    mainElement.insertAdjacentHTML('afterend', `<div id="show-all-container" class="text-center mt-8"><a href="#" id="show-all-link" class="text-indigo-400 hover:underline">Show All Companies &rarr;</a></div>`);
    document.getElementById('show-all-link').addEventListener('click', e => { e.preventDefault(); loadAllCompanies(); });
}

// 6. Event Listeners for Modals, Sign-Out, etc.
signOutBtn.addEventListener('click', (e) => e.preventDefault() || auth.signOut());
profileLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUserData && profileModal) {
        profileModalName.textContent = currentUserData.name || 'N/A';
        profileModalEmail.textContent = currentUserData.email || 'N/A';
        profileModalInterest.textContent = currentUserData.areaOfInterest || 'N/A';
        profileModal.classList.remove('hidden');
        document.getElementById('profile-dropdown').classList.remove('show');
    }
});
closeModalBtn.addEventListener('click', () => profileModal.classList.add('hidden'));
profileModal.addEventListener('click', (e) => (e.target === profileModal) && profileModal.classList.add('hidden'));

yourCompaniesLink.addEventListener('click', (e) => {
    e.preventDefault();
    loadEnrolledCompanies();
    document.getElementById('profile-dropdown').classList.remove('show');
});

yourRolesLink.addEventListener('click', (e) => {
    e.preventDefault();
    loadEnrolledRoles();
    document.getElementById('profile-dropdown').classList.remove('show');
});