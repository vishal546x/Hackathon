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
const roadmapTitleElem = document.getElementById('roadmap-title');
const roadmapDescriptionElem = document.getElementById('roadmap-description');
const stagesContainer = document.getElementById('stages-container');
const loadingMessage = document.getElementById('loading-message');
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

            // Load roadmap details for the specific ID in the URL
            const urlParams = new URLSearchParams(window.location.search);
            const roadmapId = urlParams.get('id');
            if (roadmapId) {
                loadRoadmapDetails(roadmapId, user.uid);
            } else {
                roadmapTitleElem.textContent = 'Roadmap Not Found';
                loadingMessage.textContent = 'No roadmap was specified in the URL.';
            }
        } else {
            window.location.href = "login.html";
        }
    });
});

// 4. Function to load all details for a roadmap
async function loadRoadmapDetails(roadmapId, userId) {
    try {
        // Fetch user progress to calculate completion percentages
        const progressSnapshot = await db.collection('users').doc(userId).collection('progress').get();
        const progressMap = new Map();
        progressSnapshot.forEach(doc => {
            progressMap.set(doc.id, doc.data());
        });

        // Fetch the main roadmap document
        const roadmapDoc = await db.collection('roadmaps').doc(roadmapId).get();
        if (!roadmapDoc.exists) {
            roadmapTitleElem.textContent = 'Roadmap Not Found';
            loadingMessage.textContent = '';
            return;
        }
        const roadmapData = roadmapDoc.data();
        roadmapTitleElem.textContent = roadmapData.title;
        roadmapDescriptionElem.textContent = roadmapData.roleDescription;

        // Fetch all stage documents associated with this roadmap
        const stagePromises = roadmapData.stages.map(stageInfo => 
            db.collection('stages').doc(stageInfo.stageId).get()
        );
        const stageDocs = await Promise.all(stagePromises);
        
        stagesContainer.innerHTML = ''; 

        // Render each stage
        stageDocs.forEach(stageDoc => {
            if (stageDoc.exists) {
                // Pass roadmapId to the render function to build correct links
                renderStage(roadmapId, stageDoc.id, stageDoc.data(), progressMap);
            }
        });

    } catch (error) {
        console.error("Error loading roadmap details:", error);
        roadmapTitleElem.textContent = 'Error Loading Data';
    }
}

// 5. Function to render a single stage and its progress
function renderStage(roadmapId, stageId, stageData, progressMap) {
    const totalLessons = stageData.lessons ? stageData.lessons.length : 0;
    let completedLessons = 0;

    if (totalLessons > 0) {
        stageData.lessons.forEach(lesson => {
            const progressInfo = progressMap.get(lesson.lessonId);
            if (progressInfo && progressInfo.completion === 1) {
                completedLessons++;
            }
        });
    }

    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    const stageLink = document.createElement('a');
    // This link now correctly includes BOTH roadmapId and the stage's own ID
    stageLink.href = `lessons.html?roadmapId=${roadmapId}&id=${stageId}`; 
    stageLink.className = 'stage-card-link block';

    stageLink.innerHTML = `
        <div class="stage-card bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <div class="flex justify-between items-center">
                <h3 class="text-2xl font-bold text-gray-800">${stageData.title}</h3>
                <span class="text-indigo-600 font-semibold text-lg">View →</span>
            </div>
            <p class="text-gray-500 mt-2">${totalLessons} Lessons</p>
            <div class="progress-bar-container bg-gray-200 rounded-full mt-4 h-2.5">
                <div class="progress-bar bg-indigo-600 h-2.5 rounded-full" style="width: ${progressPercentage}%"></div>
            </div>
            <p class="text-right text-sm text-gray-500 mt-1">${completedLessons} / ${totalLessons} Completed</p>
        </div>
    `;

    stagesContainer.appendChild(stageLink);
}