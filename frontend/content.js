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
const lessonTitleElem = document.getElementById('lesson-title');
const videoContainer = document.getElementById('video-container');
const markCompleteBtn = document.getElementById('mark-complete-btn');
const takeAssessmentBtn = document.getElementById('take-assessment-btn');
const signOutBtn = document.getElementById('sign-out-btn');

// Global variables to hold current lesson info
let currentStageId, currentLessonId, currentRoadmapId;

// 3. Main logic to run on page load
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            const urlParams = new URLSearchParams(window.location.search);
            currentStageId = urlParams.get('stageId');
            currentLessonId = urlParams.get('lessonId');

            if (currentStageId && currentLessonId) {
                loadContent(currentStageId, currentLessonId, user.uid);
            } else {
                lessonTitleElem.textContent = 'Lesson Not Found';
            }
        } else {
            window.location.href = "login.html";
        }
    });
});

// 4. Function to load the lesson content
async function loadContent(stageId, lessonId, userId) {
    try {
        const stageDoc = await db.collection('stages').doc(stageId).get();
        if (!stageDoc.exists) {
            lessonTitleElem.textContent = 'Error: Stage not found.';
            return;
        }

        const stageData = stageDoc.data();
        const lessonData = stageData.lessons.find(lesson => lesson.lessonId === lessonId);

        if (!lessonData) {
            lessonTitleElem.textContent = 'Error: Lesson not found in this stage.';
            return;
        }
        
        // Find the roadmapId this lesson belongs to (for progress tracking)
        const roadmapQuery = await db.collection('roadmaps').where('stages', 'array-contains', { order: 1, title: stageData.title, stageId: stageId }).get(); // This is a simplified query
        if (!roadmapQuery.empty) {
            currentRoadmapId = roadmapQuery.docs[0].id;
        }


        // Render the content
        renderContent(lessonData);

    } catch (error) {
        console.error("Error loading content:", error);
        lessonTitleElem.textContent = 'Error loading content.';
    }
}

// 5. Function to render the video and buttons
function renderContent(lesson) {
    lessonTitleElem.textContent = lesson.title;

    // Extract YouTube Video ID and create embed iframe
    const videoId = getYouTubeId(lesson.videoUrl);
    if (videoId) {
        videoContainer.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${videoId}?rel=0" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
            </iframe>
        `;
    } else {
        videoContainer.innerHTML = '<p class="text-white text-center p-8">Invalid YouTube URL.</p>';
    }

    // Set the link for the assessment button
    // This will point to your future assessment page
    takeAssessmentBtn.href = `assessment.html?assessmentId=${lesson.assessmentId}&lessonId=${currentLessonId}&roadmapId=${currentRoadmapId}`;
}

// 6. Event listener for the "Mark as Complete" button
markCompleteBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user || !currentLessonId) return;

    const progressRef = db.collection('users').doc(user.uid).collection('progress').doc(currentLessonId);

    try {
        await progressRef.set({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            assessmentScore: null, // Score is null because they didn't take the assessment
            roadmapId: currentRoadmapId || null
        }, { merge: true }); // Use merge to avoid overwriting score if it exists

        alert(`"${lessonTitleElem.textContent}" marked as complete!`);
        markCompleteBtn.textContent = 'Completed';
        markCompleteBtn.disabled = true;
        markCompleteBtn.classList.add('bg-green-500', 'hover:bg-green-500');
        markCompleteBtn.classList.remove('bg-gray-600', 'hover:bg-gray-700');

    } catch (error) {
        console.error("Error updating progress:", error);
        alert("Could not mark as complete. Please try again.");
    }
});

// 7. Sign-Out Logic
signOutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Helper function to extract Video ID from various YouTube URL formats
function getYouTubeId(url) {
    let ID = '';
    url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if (url[2] !== undefined) {
        ID = url[2].split(/[^0-9a-z_\-]/i);
        ID = ID[0];
    } else {
        ID = url;
    }
    return ID;
}