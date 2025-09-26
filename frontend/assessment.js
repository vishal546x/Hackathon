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
const quizContainer = document.getElementById('quiz-container');
const resultsContainer = document.getElementById('results-container');
const assessmentTitleElem = document.getElementById('assessment-title');
const progressText = document.getElementById('progress-text');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const scoreText = document.getElementById('score-text');
const resultsText = document.getElementById('results-text');
const backToLessonsBtn = document.getElementById('back-to-lessons-btn');
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

// 3. Quiz State & Global variables
let allQuestions = [];
let passPercentage = 80;
let currentQuestionIndex = 0;
let userAnswers = [];
let currentUserId = null;
let currentUserData = null;
let lessonId, roadmapId;

// 4. Main Logic Execution
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

            // Load assessment based on URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const assessmentId = urlParams.get('assessmentId');
            lessonId = urlParams.get('lessonId');
            roadmapId = urlParams.get('roadmapId');

            if (assessmentId && lessonId) {
                loadAssessment(assessmentId);
            } else {
                assessmentTitleElem.textContent = 'Error: Missing assessment details.';
            }
        } else {
            window.location.href = "login.html";
        }
    });
});


// 5. Fetch Assessment from Firestore
async function loadAssessment(assessmentId) {
    try {
        const doc = await db.collection('assessments').doc(assessmentId).get();
        if (doc.exists) {
            const data = doc.data();
            allQuestions = data.questions;
            passPercentage = data.passPercentage || 80;
            assessmentTitleElem.textContent = data.title;
            userAnswers = new Array(allQuestions.length).fill(null);
            displayQuestion(0);
        } else {
            assessmentTitleElem.textContent = 'Assessment not found.';
        }
    } catch (error) { console.error("Error fetching assessment:", error); }
}

// 6. Display a Question
function displayQuestion(index) {
    const question = allQuestions[index];
    progressText.textContent = `Question ${index + 1} of ${allQuestions.length}`;
    questionText.textContent = question.questionText;
    optionsContainer.innerHTML = '';

    question.options.forEach((option, optionIndex) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        if (userAnswers[index] === optionIndex) {
            button.classList.add('selected');
        }
        button.onclick = () => {
            userAnswers[index] = optionIndex;
            displayQuestion(index); // Re-render to show selection
        };
        optionsContainer.appendChild(button);
    });
    updateNavigation();
}

// 7. Update Navigation Buttons
function updateNavigation() {
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.classList.toggle('hidden', currentQuestionIndex === allQuestions.length - 1);
    submitBtn.classList.toggle('hidden', currentQuestionIndex !== allQuestions.length - 1);
}

// 8. Navigation Event Listeners
nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
    }
});
prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion(currentQuestionIndex);
    }
});
submitBtn.addEventListener('click', submitAssessment);

// 9. Submit, Score, and Save Progress
async function submitAssessment() {
    let score = 0;
    allQuestions.forEach((q, i) => {
        if (q.correctAnswerIndex === userAnswers[i]) score++;
    });
    const scorePercentage = Math.round((score / allQuestions.length) * 100);

    // --- KEY LOGIC: Check score and update progress ---
    if (currentUserId && lessonId) {
        if (scorePercentage >= passPercentage) {
            // If they passed, mark as complete and save score
            await updateProgressAfterAssessment(currentUserId, lessonId, scorePercentage);
        } else {
            // If they failed, just save the score
            const progressRef = db.collection('users').doc(currentUserId).collection('progress').doc(lessonId);
            await progressRef.update({ assessmentScore: scorePercentage }).catch(console.error);
        }
    }
    displayResults(scorePercentage);
}

// 10. Display Final Results
function displayResults(score) {
    quizContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    scoreText.textContent = `${score}%`;
    // --- FIX: Use onclick for navigation ---
    backToLessonsBtn.onclick = () => {
        window.location.href = `roadmap-details.html?id=${roadmapId}`;
    };

    if (score >= passPercentage) {
        resultsText.textContent = "Congratulations, you passed!";
        scoreText.classList.remove('text-red-500');
        scoreText.classList.add('text-green-500');
    } else {
        resultsText.textContent = "Please review the material and try again.";
        scoreText.classList.remove('text-green-500');
        scoreText.classList.add('text-red-500');
    }
}

// 11. Firestore Update Function
async function updateProgressAfterAssessment(userId, lessonId, score) {
    const lessonProgressRef = db.collection('users').doc(userId).collection('progress').doc(lessonId);
    try {
        await lessonProgressRef.update({
            completion: 1, // Mark as complete
            assessmentScore: score,
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Lesson ${lessonId} marked as complete with score ${score}.`);
    } catch (error) {
        console.error("Error updating progress after assessment:", error);
    }
}