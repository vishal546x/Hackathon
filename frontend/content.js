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
const lessonTitleElem = document.getElementById('lesson-title');
const videoContainer = document.getElementById('video-container');
const markCompleteBtn = document.getElementById('mark-complete-btn');
const takeAssessmentBtn = document.getElementById('take-assessment-btn');
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

// Global variables
let currentUserId = null;
let currentUserData = null;
let currentLessonId = null;
let currentRoadmapId = null;

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

            // Load lesson content based on URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            currentRoadmapId = urlParams.get('roadmapId'); // Get roadmapId
            currentLessonId = urlParams.get('lessonId'); // Get lessonId
            if (currentRoadmapId && currentLessonId) {
                loadContent(currentRoadmapId, currentLessonId, user.uid);
            } else {
                lessonTitleElem.textContent = 'Lesson Not Found';
            }
        } else {
            window.location.href = "login.html";
        }
    });
});

// 4. Function to load the lesson content
async function loadContent(roadmapId, lessonId, userId) {
    try {
        // Find the stage that contains this lesson's roadmap
        const roadmapDoc = await db.collection('roadmaps').doc(roadmapId).get();
        if (!roadmapDoc.exists) throw new Error("Roadmap not found");
        const stages = roadmapDoc.data().stages;

        let lessonData = null;
        for (const stageInfo of stages) {
            const stageDoc = await db.collection('stages').doc(stageInfo.stageId).get();
            if (stageDoc.exists) {
                const foundLesson = stageDoc.data().lessons.find(l => l.lessonId === lessonId);
                if (foundLesson) {
                    lessonData = foundLesson;
                    break;
                }
            }
        }

        if (!lessonData) throw new Error("Lesson not found in any stage of this roadmap");

        renderContent(lessonData);
        checkCompletionStatus(userId, lessonId);

    } catch (error) {
        console.error("Error loading content:", error);
        lessonTitleElem.textContent = 'Error loading content.';
    }
}

// 5. Function to render the video and buttons
function renderContent(lesson) {
    lessonTitleElem.textContent = lesson.title;
    const videoId = getYouTubeId(lesson.videoUrl);
    if (videoId) {
        videoContainer.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${videoId}?rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
        videoContainer.innerHTML = '<p class="text-white text-center p-8">Invalid YouTube URL.</p>';
    }
    takeAssessmentBtn.href = `assessment.html?assessmentId=${lesson.assessmentId}&lessonId=${currentLessonId}&roadmapId=${currentRoadmapId}`;
}

// 6. Function to check if the lesson is already complete
async function checkCompletionStatus(userId, lessonId) {
    const progressRef = db.collection('users').doc(userId).collection('progress').doc(lessonId);
    const doc = await progressRef.get();
    if (doc.exists && doc.data().completion === 1) {
        markCompleteBtn.textContent = 'Completed';
        markCompleteBtn.disabled = true;
        markCompleteBtn.classList.add('bg-green-500', 'hover:bg-green-500');
        markCompleteBtn.classList.remove('bg-gray-600', 'hover:bg-gray-700');
    }
}

// 7. Event listener for the "Mark as Complete" button
markCompleteBtn.addEventListener('click', async () => {
    if (!currentUserId || !currentLessonId) return;

    const progressRef = db.collection('users').doc(currentUserId).collection('progress').doc(currentLessonId);
    try {
        await progressRef.update({
            completion: 1,
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        
        checkCompletionStatus(currentUserId, currentLessonId); // Re-check to update button state

    } catch (error) {
        console.error("Error updating progress:", error);
        alert("Could not mark as complete. Please try again.");
    }
});

// Helper function to extract Video ID
function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}