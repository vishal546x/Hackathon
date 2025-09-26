// 1. Initialize Firebase (use the same config as home.js)
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
const pageTitle = document.getElementById('page-title');
const rolesGrid = document.getElementById('roles-grid');
const signOutBtn = document.getElementById('sign-out-btn');

// 3. Main logic to run on page load
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Get companyId from the URL query parameter
            const urlParams = new URLSearchParams(window.location.search);
            const companyId = urlParams.get('company');

            if (companyId) {
                loadRoadmapsForCompany(companyId);
            } else {
                pageTitle.textContent = 'Company Not Found';
                rolesGrid.innerHTML = '<p class="text-center text-red-500">No company was specified in the URL.</p>';
            }
        } else {
            window.location.href = "login.html";
        }
    });
});

// 4. Function to load company info and its roadmaps
async function loadRoadmapsForCompany(companyId) {
    try {
        // Fetch the company's name first to update the title
        const companyRef = db.collection('companies').doc(companyId);
        const companyDoc = await companyRef.get();

        if (!companyDoc.exists) {
            pageTitle.textContent = 'Company Not Found';
            return;
        }

        const companyName = companyDoc.data().name;
        pageTitle.textContent = `Available Roles at ${companyName}`;

        // Now, fetch the roadmaps for this company
        const roadmapsSnapshot = await db.collection('roadmaps').where('companyId', '==', companyId).get();

        if (roadmapsSnapshot.empty) {
            rolesGrid.innerHTML = `<p class="col-span-full text-center text-gray-500">No roles found for ${companyName}.</p>`;
            return;
        }

        rolesGrid.innerHTML = ''; // Clear the grid

        roadmapsSnapshot.forEach(doc => {
            const roadmapData = doc.data();
            const roadmapId = doc.id;

            const roleCard = `
                <div class="role-card bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div class="p-6 flex-grow">
                        <h3 class="text-2xl font-bold text-gray-900">${roadmapData.title}</h3>
                        <p class="text-gray-600 mt-2">${roadmapData.roleDescription || ''}</p>
                    </div>
                    <div class="p-6 bg-gray-50">
                        <a href="roadmap-details.html?id=${roadmapId}" class="w-full text-center block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition">
                            View Roadmap
                        </a>
                    </div>
                </div>
            `;
            rolesGrid.innerHTML += roleCard;
        });

    } catch (error) {
        console.error("Error loading roadmaps:", error);
        pageTitle.textContent = 'Error Loading Data';
        rolesGrid.innerHTML = '<p class="text-center text-red-500">Could not fetch data from the server.</p>';
    }
}

// 5. Sign-Out Logic
signOutBtn.addEventListener('click', () => {
    auth.signOut();
});