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

// 2. Get references to ALL interactive elements
// Page specific
const pageTitle = document.getElementById('page-title');
const rolesGrid = document.getElementById('roles-grid');
// Shared Header Elements
const userDisplayName = document.getElementById('user-display-name');
const userInitial = document.getElementById('user-initial');
const signOutBtn = document.getElementById('sign-out-btn');
const profileButton = document.getElementById('profile-button');
const profileDropdown = document.getElementById('profile-dropdown');
const profileLink = document.getElementById('profile-link');
const yourCompaniesLink = document.getElementById('your-companies-link');
const yourRolesLink = document.getElementById('your-roles-link');
// Modal Elements
const profileModal = document.getElementById('profile-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const profileModalName = document.getElementById('profile-modal-name');
const profileModalEmail = document.getElementById('profile-modal-email');
const profileModalInterest = document.getElementById('profile-modal-interest');

// Global variables to hold user data
let currentUserId = null;
let currentUserData = null;

// 3. Main Logic Execution
document.addEventListener('DOMContentLoaded', () => {
    // --- SHARED HEADER & MODAL LOGIC ---
    profileButton.addEventListener('click', (e) => e.stopPropagation() || profileDropdown.classList.toggle('show'));
    window.addEventListener('click', () => profileDropdown.classList.contains('show') && profileDropdown.classList.remove('show'));
    signOutBtn.addEventListener('click', () => auth.signOut());

    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUserData) {
            profileModalName.textContent = currentUserData.name || 'N/A';
            profileModalEmail.textContent = currentUserData.email || 'N/A';
            profileModalInterest.textContent = currentUserData.areaOfInterest || 'N/A';
            profileModal.classList.remove('hidden');
        }
        profileDropdown.classList.remove('show');
    });

    closeModalBtn.addEventListener('click', () => profileModal.classList.add('hidden'));
    profileModal.addEventListener('click', (e) => (e.target === profileModal) && profileModal.classList.add('hidden'));

    yourCompaniesLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'home.html?filter=my-companies';
    });
    yourRolesLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'home.html?filter=my-roles';
    });

    // --- PAGE-SPECIFIC AUTH LOGIC ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUserId = user.uid;
            const userRef = db.collection('users').doc(user.uid);
            const doc = await userRef.get();
            if (doc.exists) {
                currentUserData = doc.data(); // Store full user data
                userDisplayName.textContent = currentUserData.name;
                userInitial.textContent = currentUserData.name.charAt(0).toUpperCase();
            } else {
                userDisplayName.textContent = user.email;
                userInitial.textContent = user.email.charAt(0).toUpperCase();
            }

            // Load roles for the specific company
            const urlParams = new URLSearchParams(window.location.search);
            const companyId = urlParams.get('company');
            if (companyId) {
                loadRoadmapsForCompany(companyId);
            } else {
                pageTitle.textContent = "Company not found";
            }
        } else {
            window.location.href = "login.html";
        }
    });
});

// 4. Page-Specific Functions (No changes here)
async function loadRoadmapsForCompany(companyId) {
    try {
        const companyRef = db.collection('companies').doc(companyId);
        const companyDoc = await companyRef.get();
        if (!companyDoc.exists) {
            pageTitle.textContent = 'Company Not Found'; return;
        }
        const companyName = companyDoc.data().name;
        pageTitle.textContent = `Available Roles at ${companyName}`;
        const roadmapsSnapshot = await db.collection('roadmaps').where('companyId', '==', companyId).get();
        if (roadmapsSnapshot.empty) {
            rolesGrid.innerHTML = `<p class="col-span-full text-center">No roles found for ${companyName}.</p>`; return;
        }
        rolesGrid.innerHTML = '';
        roadmapsSnapshot.forEach(doc => {
            const roadmapData = doc.data(); const roadmapId = doc.id;
            rolesGrid.innerHTML += `
                <div class="role-card p-0">
                    <div class="card-content flex flex-col items-center justify-center text-center p-8 h-full">
                        <h2 class="text-2xl font-semibold text-slate-100 mb-2">${roadmapData.title}</h2>
                        <p class="text-slate-400 text-sm mb-6">${roadmapData.roleDescription || 'Click to view the roadmap'}</p>
                        <div class="mt-auto"><button class="start-course-btn bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg" data-roadmap-id="${roadmapId}">Start Journey</button></div>
                    </div>
                </div>`;
        });
    } catch (error) { console.error("Error loading roadmaps:", error); }
}

async function enrollInRoadmap(userId, roadmapId) {
    try {
        const roadmapRef = db.collection('roadmaps').doc(roadmapId);
        const roadmapDoc = await roadmapRef.get();
        if (!roadmapDoc.exists) throw new Error("Roadmap document not found!");
        
        const stagesArray = roadmapDoc.data().stages;
        if (!stagesArray || !Array.isArray(stagesArray)) throw new Error("The 'stages' field is missing or not an array!");
        
        const allLessonIds = [];
        for (const stageInfo of stagesArray) {
            const stageRef = db.collection('stages').doc(stageInfo.stageId);
            const stageDoc = await stageRef.get();
            if (stageDoc.exists) {
                const lessonsArray = stageDoc.data().lessons;
                if (!lessonsArray || !Array.isArray(lessonsArray)) throw new Error(`'lessons' field is missing in stage ${stageInfo.stageId}!`);
                lessonsArray.forEach(lesson => allLessonIds.push(lesson.lessonId));
            }
        }

        if (allLessonIds.length === 0) {
            alert("This course has no lessons to enroll in yet."); return;
        }

        const batch = db.batch();
        const roadmapProgressRef = db.collection('users').doc(userId).collection('progress').doc(roadmapId);
        batch.set(roadmapProgressRef, { status: 'started', startedAt: firebase.firestore.FieldValue.serverTimestamp() });
        allLessonIds.forEach(lessonId => {
            const lessonProgressRef = db.collection('users').doc(userId).collection('progress').doc(lessonId);
            batch.set(lessonProgressRef, { completion: 0, lessonId: lessonId, roadmapId: roadmapId });
        });
        
        await batch.commit();
        
        window.location.href = `roadmap-details.html?id=${roadmapId}`;
    } catch (error) {
        console.error("--- ERROR ENROLLING IN ROADMAP ---", error);
        alert("Critical Error: Could not enroll in the course. See console for details.");
    }
}

async function handleStartOrContinueJourney(userId, roadmapId) {
    if (!userId || !roadmapId) return;
    const roadmapProgressRef = db.collection('users').doc(userId).collection('progress').doc(roadmapId);
    try {
        const docSnap = await roadmapProgressRef.get();
        if (!docSnap.exists) {
            await enrollInRoadmap(userId, roadmapId);
        }
        window.location.href = `roadmap-details.html?id=${roadmapId}`;
    } catch (error) {
        console.error("Error checking journey progress:", error);
    }
}

rolesGrid.addEventListener('click', (event) => {
    const startButton = event.target.closest('.start-course-btn');
    if (startButton) {
        const roadmapId = startButton.dataset.roadmapId;
        if (currentUserId && roadmapId) {
            handleStartOrContinueJourney(currentUserId, roadmapId);
        }
    }
});