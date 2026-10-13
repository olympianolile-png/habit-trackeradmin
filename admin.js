

import { auth, db } from "./firebase.js";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

async function loadDashboardData() {
    console.log("Loading dashboard data...");

    const usersList = document.getElementById("usersList");
    const habitsList = document.getElementById("habitsList");
    const completedHabitsList =
        document.getElementById("completedHabitsList");
    console.log("Completed Habits HTML element:", completedHabitsList);

    try {
        const usersSnapshot = await getDocs(
            collection(db, "users")
        );

        const users = usersSnapshot.docs.map(document => ({
            id: document.id,
            ...document.data()
        }));

        console.log("Users retrieved:", users.length);

        const habitsSnapshot = await getDocs(
            collection(db, "habits")
        );

        const habits = habitsSnapshot.docs.map(document => ({
            id: document.id,
            ...document.data()
        }));

        console.log("Habits retrieved:", habits.length);

        const logsSnapshot = await getDocs(
            collection(db, "habitLogs")
        );

        console.log("Habit logs retrieved:", logsSnapshot.size);

        const userNames = new Map(
            users.map(user => [
                user.id,
                [user.name, user.surname]
                    .filter(Boolean)
                    .join(" ") || "Name unavailable"
            ])
        );

        const habitNames = new Map(
            habits.map(habit => [
                habit.id,
                habit.name || "Unnamed habit"
            ])
        );

        if (completedHabitsList) {
            completedHabitsList.replaceChildren();

            const completedLogs = logsSnapshot.docs
                .map(document => ({
                    id: document.id,
                    ...document.data()
                }))
                .filter(log => log.completed === true);

            if (completedLogs.length === 0) {
                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 4;
                cell.textContent = "No completed habits found.";

                row.appendChild(cell);
                completedHabitsList.appendChild(row);
            }

            completedLogs.forEach(log => {
                const row = document.createElement("tr");

                const userCell = document.createElement("td");
                const habitCell = document.createElement("td");
                const dateCell = document.createElement("td");
                const statusCell = document.createElement("td");

                userCell.textContent =
                    userNames.get(log.userId) || "User not found";

                habitCell.textContent =
                    habitNames.get(log.habitId) || "Habit not found";

                if (log.date && typeof log.date.toDate === "function") {
                    dateCell.textContent =
                        log.date.toDate().toLocaleString();
                } else {
                    dateCell.textContent = "Date unavailable";
                }

                statusCell.textContent = "Completed";

                row.append(userCell, habitCell, dateCell, statusCell);
                completedHabitsList.appendChild(row);
            });
        }

        document.getElementById("userCount").textContent =
            users.length;

        document.getElementById("habitCount").textContent =
            habits.length;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeUserIds = new Set();

        logsSnapshot.forEach(logDocument => {
            const log = logDocument.data();

            if (
                log.completed === true &&
                log.userId &&
                log.date &&
                typeof log.date.toDate === "function" &&
                log.date.toDate() >= sevenDaysAgo
            ) {
                activeUserIds.add(log.userId);
            }
        });

        const activeUsersElement =
            document.getElementById("activeUserCount");
        if (activeUsersElement) {
            activeUsersElement.textContent = activeUserIds.size;
        }

        const habitCounts = {};

        habits.forEach(habit => {
            if (habit.userId) {
                habitCounts[habit.userId] =
                    (habitCounts[habit.userId] || 0) + 1;
            }
        });

        usersList.replaceChildren();

        if (users.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 3;
            cell.textContent = "No users found.";

            row.appendChild(cell);
            usersList.appendChild(row);
        } else {
            users.forEach(user => {
                const row = document.createElement("tr");

                const nameCell = document.createElement("td");
                const emailCell = document.createElement("td");
                const countCell = document.createElement("td");

                const fullName = [
                    user.name,
                    user.surname
                ].filter(Boolean).join(" ");

                nameCell.textContent = fullName || "Name unavailable";
                emailCell.textContent = user.email || "No email";
                countCell.textContent = habitCounts[user.id] || 0;

                row.append(nameCell, emailCell, countCell);
                usersList.appendChild(row);
            });
        }

        habitsList.replaceChildren();

        if (habits.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 3;
            cell.textContent = "No habits found.";

            row.appendChild(cell);
            habitsList.appendChild(row);
        } else {
            habits.forEach(habit => {
                const row = document.createElement("tr");

                const nameCell = document.createElement("td");
                const ownerCell = document.createElement("td");
                const dateCell = document.createElement("td");

                nameCell.textContent = habit.name || "Unnamed habit";

                ownerCell.textContent =
                    userNames.get(habit.userId) || "Owner not found";

                if (
                    habit.createdAt &&
                    typeof habit.createdAt.toDate === "function"
                ) {
                    dateCell.textContent =
                        habit.createdAt.toDate().toLocaleDateString();
                } else {
                    dateCell.textContent = "Not available";
                }

                row.append(nameCell, ownerCell, dateCell);
                habitsList.appendChild(row);
            });
        }

        console.log("User Management updated.");
        console.log("Habit Overview updated.");
        console.log("Starting Completed Habits section...");
    } catch (error) {
        console.error("Dashboard loading failed:", error);
        alert("Unable to load dashboard data. Check the browser console.");
    }
}

// Confirm Firebase initialization
console.log("Firebase Auth:", auth);
console.log("Firestore Database:", db);
console.log("Firebase Project ID:", db.app.options.projectId);
console.log("Firestore Database ID:", db._databaseId);
console.log("Habit Tracker Admin Dashboard is running!");

// Get dashboard elements
const searchInput = document.querySelector(".search-input");
const userTableBody = document.querySelector("tbody");
const navigationLinks = document.querySelectorAll(".nav-link");

// Search users in the table
if (searchInput && userTableBody) {
    searchInput.addEventListener("input", function () {
        const searchText = searchInput.value.toLowerCase().trim();
        const rows = userTableBody.querySelectorAll("tr");

        rows.forEach(function (row) {
            const rowText = row.textContent.toLowerCase();

            // Keep the empty-state message visible
            if (row.querySelector(".empty-state")) {
                row.style.display = "";
            } else {
                row.style.display =
                    rowText.includes(searchText) ? "" : "none";
            }
        });
    });
}

// Highlight the selected sidebar menu item
navigationLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
        event.preventDefault();

        navigationLinks.forEach(function (item) {
            item.classList.remove("active");
        });

        link.classList.add("active");

        console.log("Selected menu:", link.textContent.trim());
    });
});

// Get login form elements
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const loginButton = document.querySelector("#login-button");

// Connect the login form to Firebase Authentication
if (loginForm && loginMessage && loginButton) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document
            .querySelector("#admin-email").value.trim();

        const password = document
            .querySelector("#admin-password").value;

        loginMessage.textContent = "";
        loginButton.disabled = true;
        loginButton.textContent = "Signing in...";

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;
            let adminSnapshot;

            try {
                const adminRef = doc(db, "admins", user.uid);
                adminSnapshot = await getDoc(adminRef);
            } catch (error) {
                console.error("Admin authorization check failed:", error);

                try {
                    await signOut(auth);
                } catch (signOutError) {
                    console.error(
                        "Could not sign out after admin authorization failed:",
                        signOutError
                    );
                }

                loginMessage.textContent =
                    error.code === "permission-denied"
                        ? "Signed in, but admin access could not be verified. Check Firestore rules for the admins collection."
                        : "Signed in, but admin access could not be verified. Check your connection and try again.";
                return;
            }

            if (
                !adminSnapshot.exists() ||
                adminSnapshot.data().role !== "admin"
            ) {
                try {
                    await signOut(auth);
                    loginMessage.textContent =
                        "Access denied. Add an admins/{uid} document with role: 'admin' for this account in Firestore.";
                } catch (error) {
                    console.error(
                        "Could not sign out the unauthorized account:",
                        error
                    );
                    loginMessage.textContent =
                        "Access denied, and sign out failed. Please reload this page and check Firebase Auth.";
                }
                return;
            }

            const loginScreen = document.querySelector("#login-screen");
            if (loginScreen) {
                loginScreen.style.display = "none";
            }

            loginMessage.textContent = "";
            console.log("Authorized administrator signed in:", user.uid);
            await loadDashboardData();
        } catch (error) {
            console.error("Login error:", error);

            if (error.code === "auth/invalid-credential") {
                loginMessage.textContent =
                    "Incorrect email or password.";
            } else if (error.code === "auth/invalid-email") {
                loginMessage.textContent =
                    "Please enter a valid email address.";
            } else if (error.code === "auth/operation-not-allowed") {
                loginMessage.textContent =
                    "Email and password sign-in is disabled for this Firebase project.";
            } else if (error.code === "auth/too-many-requests") {
                loginMessage.textContent =
                    "Too many attempts. Please try again later.";
            } else if (error.code === "auth/network-request-failed") {
                loginMessage.textContent =
                    "Could not reach Firebase Authentication. Check your connection and try again.";
            } else {
                loginMessage.textContent =
                    "Sign in failed. Check the browser console for details.";
            }
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Sign In";
        }
    });
} else {
    console.error(
        "Login form elements were not found. Check the IDs in index.html."
    );
}
