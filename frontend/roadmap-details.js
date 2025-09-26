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
const roadmapTitleElem = document.getElementById('roadmap-title');
const roadmapDescriptionElem = document.getElementById('roadmap-description');
const stagesContainer = document.getElementById('stages-container');
const loadingMessage = document.getElementById('loading-message');
const signOutBtn = document.getElementById('sign-out-btn');

// 3. Main logic to run on page load (No changes here)
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
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

// 4. Function to load all details for a roadmap (No changes here)
async function loadRoadmapDetails(roadmapId, userId) {
    try {
        const progressSnapshot = await db.collection('users').doc(userId).collection('progress').get();
        const progressMap = new Map();
        progressSnapshot.forEach(doc => {
            progressMap.set(doc.id, doc.data());
        });

        const roadmapDoc = await db.collection('roadmaps').doc(roadmapId).get();
        if (!roadmapDoc.exists) {
            roadmapTitleElem.textContent = 'Roadmap Not Found';
            loadingMessage.textContent = '';
            return;
        }
        const roadmapData = roadmapDoc.data();
        roadmapTitleElem.textContent = roadmapData.title;
        roadmapDescriptionElem.textContent = roadmapData.roleDescription;

        const stagePromises = roadmapData.stages.map(stageInfo => 
            db.collection('stages').doc(stageInfo.stageId).get()
        );
        const stageDocs = await Promise.all(stagePromises);
        
        stagesContainer.innerHTML = ''; 

        stageDocs.forEach(stageDoc => {
            if (stageDoc.exists) {
                // Pass the stage's ID along with its data to the render function
                renderStage(stageDoc.id, stageDoc.data(), progressMap);
            }
        });

    } catch (error) {
        console.error("Error loading roadmap details:", error);
        roadmapTitleElem.textContent = 'Error Loading Data';
        loadingMessage.textContent = 'Could not fetch data from the server.';
    }
}

// 5. Function to render a single stage and its lessons (*** THIS IS THE UPDATED PART ***)
function renderStage(stageId, stageData, progressMap) {
    const totalLessons = stageData.lessons.length;
    let completedLessons = 0;

    // Calculate how many lessons in this stage are completed
    if (totalLessons > 0) {
        stageData.lessons.forEach(lesson => {
            if (progressMap.has(lesson.lessonId) && progressMap.get(lesson.lessonId).status === 'completed') {
                completedLessons++;
            }
        });
    }

    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Create a link (<a> tag) for the entire card
    const stageLink = document.createElement('a');
    // This links to your NEW lessons page, passing the specific stage ID
    stageLink.href = `lessons.html?id=${stageId}`; 
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

// 6. Sign-Out Logic (No changes here)
signOutBtn.addEventListener('click', () => {
    auth.signOut();
});