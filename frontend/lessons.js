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
const stageTitleElem = document.getElementById('stage-title');
const lessonsContainer = document.getElementById('lessons-container');
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

            // Load lesson details for the specific stage
            const urlParams = new URLSearchParams(window.location.search);
            const stageId = urlParams.get('id');
            if (stageId) {
                loadLessonDetails(stageId, user.uid);
            } else {
                stageTitleElem.textContent = 'Stage Not Found';
                loadingMessage.textContent = 'No stage was specified in the URL.';
            }
        } else {
            window.location.href = "login.html";
        }
    });
});

// 4. Function to load details for a specific stage
async function loadLessonDetails(stageId, userId) {
    try {
        // Fetch user progress to mark completed lessons
        const progressSnapshot = await db.collection('users').doc(userId).collection('progress').get();
        const progressMap = new Map();
        progressSnapshot.forEach(doc => {
            progressMap.set(doc.id, doc.data());
        });

        // Fetch the stage content
        const stageDoc = await db.collection('stages').doc(stageId).get();
        if (!stageDoc.exists) {
            stageTitleElem.textContent = 'Stage Not Found';
            loadingMessage.textContent = '';
            return;
        }
        
        const stageData = stageDoc.data();
        renderLessons(stageData, progressMap);

    } catch (error) {
        console.error("Error loading lesson details:", error);
        stageTitleElem.textContent = 'Error Loading Data';
        loadingMessage.textContent = 'Could not fetch data from the server.';
    }
}

// 5. Function to render the stage title and its lessons
function renderLessons(stageData, progressMap) {
    stageTitleElem.textContent = stageData.title;
    lessonsContainer.innerHTML = ''; 

    if (!stageData.lessons || stageData.lessons.length === 0) {
        lessonsContainer.innerHTML = '<p class="p-6 text-gray-500">No lessons in this stage yet.</p>';
        return;
    }

    // You need to get the roadmapId to build the link correctly
    const urlParams = new URLSearchParams(window.location.search);
    const roadmapId = urlParams.get('roadmapId'); // Assuming roadmapId is in the URL

    stageData.lessons.forEach(lesson => {
        // Use the 'completion' field from our new progress model
        const progressInfo = progressMap.get(lesson.lessonId);
        const isCompleted = progressInfo && progressInfo.completion === 1;
        
        const statusIcon = isCompleted 
            ? '<span class="text-green-500 font-bold text-2xl">✓</span>' 
            : '<span class="text-indigo-500 text-2xl">▶</span>';

        const lessonElement = document.createElement('div');
        lessonElement.className = 'lesson-item border-b border-gray-200 last:border-b-0';

        // Update the link to include the necessary roadmapId
        lessonElement.innerHTML = `
            <a href="content.html?roadmapId=${roadmapId}&lessonId=${lesson.lessonId}" class="lesson-item-link flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition">
                <div class="flex items-center">
                    ${statusIcon}
                    <span class="ml-4 text-lg text-gray-800 font-medium">${lesson.title}</span>
                </div>
                <span class="hidden sm:block bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg">
                    ${isCompleted ? 'Review' : 'Start'}
                </span>
            </a>
        `;
        lessonsContainer.appendChild(lessonElement);
    });
}