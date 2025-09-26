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
const stageTitleElem = document.getElementById('stage-title');
const lessonsContainer = document.getElementById('lessons-container');
const loadingMessage = document.getElementById('loading-message');
const signOutBtn = document.getElementById('sign-out-btn');

// 3. Main logic to run on page load
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
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
        const progressSnapshot = await db.collection('users').doc(userId).collection('progress').get();
        const progressMap = new Map();
        progressSnapshot.forEach(doc => {
            progressMap.set(doc.id, doc.data());
        });

        const stageDoc = await db.collection('stages').doc(stageId).get();
        if (!stageDoc.exists) {
            stageTitleElem.textContent = 'Stage Not Found';
            loadingMessage.textContent = '';
            return;
        }
        
        const stageData = stageDoc.data();
        
        // Render the UI with the fetched data
        // CHANGED: Pass the 'stageId' to the render function
        renderLessons(stageId, stageData, progressMap);

    } catch (error) {
        console.error("Error loading lesson details:", error);
        stageTitleElem.textContent = 'Error Loading Data';
        loadingMessage.textContent = 'Could not fetch data from the server.';
    }
}

// 5. Function to render the stage title and its lessons
// CHANGED: Add 'stageId' as a parameter here
function renderLessons(stageId, stageData, progressMap) {
    stageTitleElem.textContent = stageData.title;
    lessonsContainer.innerHTML = ''; 

    if (!stageData.lessons || stageData.lessons.length === 0) {
        lessonsContainer.innerHTML = '<p class="p-6 text-gray-500">No lessons in this stage yet.</p>';
        return;
    }

    stageData.lessons.forEach(lesson => {
        const isCompleted = progressMap.has(lesson.lessonId) && progressMap.get(lesson.lessonId).status === 'completed';
        
        const statusIcon = isCompleted 
            ? '<span class="text-green-500 font-bold text-2xl">✓</span>' 
            : '<span class="text-indigo-500 text-2xl">▶</span>';

        const lessonElement = document.createElement('div');
        lessonElement.className = 'lesson-item';

        // This link now correctly uses the 'stageId' variable
        lessonElement.innerHTML = `
            <a href="content.html?stageId=${stageId}&lessonId=${lesson.lessonId}" class="lesson-item-link flex items-center justify-between p-4 sm:p-6">
                <div class="flex items-center">
                    ${statusIcon}
                    <span class="ml-4 text-lg text-gray-800 font-medium">${lesson.title}</span>
                </div>
                <span class="hidden sm:block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition">
                    ${isCompleted ? 'Review' : 'Start'}
                </span>
            </a>
        `;
        lessonsContainer.appendChild(lessonElement);
    });
}

// 6. Sign-Out Logic
signOutBtn.addEventListener('click', () => {
    auth.signOut();
});