const teacherSelect = document.getElementById("teacher-select");
const getDirectionsButton = document.getElementById("get-directions");
const directionsDisplay = document.getElementById("directions-display");
const addTeacherBtn = document.getElementById("add-teacher-btn");
const addTeacherForm = document.getElementById("add-teacher-form");
const submitTeacherButton = document.getElementById("submit-teacher");

const getTeachersEndpoint = "http://localhost:3000/api/people";
const getDirectionsEndpoint = "http://localhost:3000/api/directions/";
const addTeacherEndpoint = "http://localhost:3000/api/add-teacher";


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


addTeacherBtn.addEventListener("click", () => {
    window.location.href = "add-teacher.html";
});


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


window.addEventListener("DOMContentLoaded", (event) => {
    loadTeachers();
});

getDirectionsButton.addEventListener("click", getDirections);


document.addEventListener("DOMContentLoaded", () => {
    const teacherForm = document.getElementById("teacher-form");
    const addTeacherEndpoint = "http://localhost:3000/api/add-teacher";

    teacherForm.addEventListener("submit", async (event) => {
        event.preventDefault();


        const name = document.getElementById("teacher-name").value.trim();
        const floor = document.getElementById("teacher-floor").value.trim();
        const branch = document.getElementById("teacher-branch").value.trim();
        const directions = document.getElementById("teacher-directions").value.trim();
        const imageFile = document.getElementById("teacher-image").files[0];


        console.log("Submission Details:");
        console.log("Name:", name);
        console.log("Floor:", floor);
        console.log("branch:", branch);
        console.log("Directions:", directions);
        console.log("Image File:", imageFile);


        if (!name) {
            console.error("Name is missing or empty");
            alert("Please enter a teacher name.");
            return;
        }
        if (!floor) {
            console.error("Floor is missing or empty");
            alert("Please enter the floor.");
            return;
        }
        if (!branch) {
            console.error("branch is missing or empty");
            alert("Please enter the branch number.");
            return;
        }
        if (!directions) {
            console.error("Directions are missing or empty");
            alert("Please enter directions.");
            return;
        }
        if (!imageFile) {
            console.error("Image file is missing");
            alert("Please upload an image.");
            return;
        }


        const formData = new FormData();
        formData.append("name", name);
        formData.append("floor", floor);
        formData.append("branch", branch);
        formData.append("directions", directions);
        formData.append("image", imageFile);


        for (let [key, value] of formData.entries()) {
            console.log(`FormData - ${key}:`, value);
        }

        try {
            const response = await fetch(addTeacherEndpoint, {
                method: "POST",
                body: formData,
            });


            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers);

            const responseData = await response.json();

            console.log("Full response data:", responseData);

            if (response.ok) {
                alert("Teacher added successfully!");
                teacherForm.reset();
                window.location.href = "index.html";
            } else {
                console.error("Error response:", responseData);
                alert(responseData.error || "Failed to add teacher. Please try again.");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("An error occurred while adding the teacher.");
        }
    });
});
