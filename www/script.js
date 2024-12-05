const teacherSelect = document.getElementById("teacher-select");
const getDirectionsButton = document.getElementById("get-directions");
const directionsDisplay = document.getElementById("directions-display");
const addTeacherBtn = document.getElementById("add-teacher-btn");
const addTeacherForm = document.getElementById("add-teacher-form");
const submitTeacherButton = document.getElementById("submit-teacher");

// Update this for your deployed backend
const BACKEND_URL = "https://teacher-location-in-a-building-api.vercel.app";
const getTeachersEndpoint = `${BACKEND_URL}/api/people`;
const getDirectionsEndpoint = `${BACKEND_URL}/api/directions/`;
const addTeacherEndpoint = `${BACKEND_URL}/api/add-teacher`;

// Fetch Teachers
async function loadTeachers() {
    try {
        const response = await fetch(getTeachersEndpoint);
        const data = await response.json();
        console.log(data);

        if (Array.isArray(data.teachers)) {
            teacherSelect.innerHTML = '<option value="" disabled selected>Select a teacher</option>';
            data.teachers.forEach((teacher) => {
                const option = document.createElement("option");
                option.value = teacher.name;
                option.textContent = teacher.name;
                teacherSelect.appendChild(option);
            });
        } else {
            console.error("Expected an array of teachers, but received:", data);
            alert("Failed to load teachers. Invalid response from the server.");
        }
    } catch (error) {
        console.error("Error loading teachers:", error);
        alert("Failed to load teachers. Please try again.");
    }
}

// Get Directions
async function getDirections() {
    const teacherName = teacherSelect.value;

    if (!teacherName) {
        alert("Please select a teacher.");
        return;
    }

    try {
        const response = await fetch(`${getDirectionsEndpoint}${encodeURIComponent(teacherName)}`);
        const data = await response.json();

        if (data.error) {
            directionsDisplay.innerHTML = `<p>${data.error}</p>`;
        } else {
            directionsDisplay.innerHTML = `
                <p><strong>Branch:</strong> ${data.branch}</p>
                <p><strong>Floor:</strong> ${data.floor}</p>
                <p><strong>Directions:</strong> ${data.directions}</p>
                ${data.imageUrl
                    ? `<img src="${data.imageUrl}" alt="${teacherName}" style="max-width: 20%; height: 20%;  ">`
                    : ""
                }
            `;
        }

        directionsDisplay.style.display = "block";
    } catch (error) {
        console.error("Error fetching directions:", error);
        alert("Failed to fetch directions. Please try again.");
    }
}

// Add Teacher
submitTeacherButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const name = document.getElementById("teacher-name").value;
    const floor = document.getElementById("teacher-floor").value;
    const branch = document.getElementById("teacher-branch").value;
    const directions = document.getElementById("teacher-directions").value;
    const image = document.getElementById("teacher-image").files[0];

    if (!name || !floor || !branch || !directions || !image) {
        alert("Please fill in all the fields and upload an image.");
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("floor", floor);
    formData.append("branch", branch);
    formData.append("directions", directions);
    formData.append("image", image);

    try {
        const response = await fetch(addTeacherEndpoint, {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            alert("Teacher added successfully!");
            window.location.href = "index.html";
        } else {
            alert("Failed to add teacher. Please try again.");
        }
    } catch (error) {
        console.error("Error adding teacher:", error);
        alert("An error occurred while adding the teacher.");
    }
});

// Initialize
window.addEventListener("DOMContentLoaded", (event) => {
    loadTeachers();
});

getDirectionsButton.addEventListener("click", getDirections);
