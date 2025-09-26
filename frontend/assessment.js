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

// 2. HTML Elements
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
const backToLessonsBtn = document.getElementById('back-to-lessons-btn');

// 3. Quiz State
let allQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let lessonId, roadmapId; // Will be retrieved from URL

// 4. Main Logic
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
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
            assessmentTitleElem.textContent = data.title;
            userAnswers = new Array(allQuestions.length).fill(null);
            displayQuestion(currentQuestionIndex);
        } else {
            assessmentTitleElem.textContent = 'Assessment not found.';
        }
    } catch (error) {
        console.error("Error fetching assessment:", error);
    }
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
        button.onclick = () => selectAnswer(index, optionIndex);
        optionsContainer.appendChild(button);
    });

    updateNavigation();
}

// 7. Handle Answer Selection
function selectAnswer(questionIndex, answerIndex) {
    userAnswers[questionIndex] = answerIndex;
    // Re-render the question to show the "selected" state
    displayQuestion(questionIndex);
}

// 8. Update Navigation Buttons
function updateNavigation() {
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.classList.toggle('hidden', currentQuestionIndex === allQuestions.length - 1);
    submitBtn.classList.toggle('hidden', currentQuestionIndex !== allQuestions.length - 1);
}

// 9. Navigation Event Listeners
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

// 10. Submit, Score, and Save
async function submitAssessment() {
    let score = 0;
    allQuestions.forEach((question, index) => {
        if (question.correctAnswerIndex === userAnswers[index]) {
            score++;
        }
    });
    const finalScore = Math.round((score / allQuestions.length) * 100);

    // Save the score to Firestore
    const user = auth.currentUser;
    if (user && lessonId) {
        const progressRef = db.collection('users').doc(user.uid).collection('progress').doc(lessonId);
        try {
            await progressRef.set({
                status: 'completed',
                assessmentScore: finalScore,
                completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                roadmapId: roadmapId || null
            }, { merge: true }); // Merge to avoid overwriting other fields
        } catch (error) {
            console.error("Error saving score:", error);
            alert("There was an error saving your score. Please try again.");
            return;
        }
    }

    displayResults(finalScore);
}

// 11. Display Final Results
// 11. Display Final Results
function displayResults(score) {
    quizContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    scoreText.textContent = `${score}%`;
    
    // The corrected line is here:
    backToLessonsBtn.onclick = () => history.go(-2); // Go back 2 pages (from assessment -> content -> lessons)
}