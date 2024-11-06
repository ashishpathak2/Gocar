const arrow = document.querySelector(".arrow");

// Function to set the arrow icon to point down
function handleArrow() {
    arrow.innerHTML = '<path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"/>';
}

// Function to set the arrow icon to point up (close icon)
function handleArrowClose() {
    arrow.innerHTML = '<path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>';
}

// Event listener to change arrow icon when modal is hidden
document.getElementById('exampleModal').addEventListener('hidden.bs.modal', handleArrowClose);

// Function to handle checking an element and updating the display
function Onchecked(element) {
    const closeModalBtn = document.querySelector(".btn-close");
    const allCheckIcons = document.querySelectorAll(".check-icon");

    // Remove the check icon from all cards
    allCheckIcons.forEach(icon => icon.classList.add("d-none"));

    // Show the check icon for the selected element
    const checkIcon = element.querySelector(".d-none");
    checkIcon.classList.remove("d-none");

    // Update the location text and arrow icon
    const locationText = element.querySelector(".locationName").textContent.trim();
    document.querySelector(".showLocation").innerHTML = `
        ${locationText}
        <svg class="arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
            class="bi bi-caret-down-fill" viewBox="0 0 16 16">
            <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 1 .753 1.659l-4.796 5.48a1 1 0 1-1.506 0z"/>
        </svg>
    `;

    closeModalBtn.click();
}

// Function to change location name display
function changelocationName(element) {
    const locationName = element.textContent;
    document.querySelector(".showLocation").innerHTML = `
        ${locationName}
        <svg class="arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
            class="bi bi-caret-down-fill" viewBox="0 0 16 16">
            <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 1 .753 1.659l-4.796 5.48a1 1 0 1-1.506 0z"/>
        </svg>
    `;
    document.querySelector(".btn-close").click();
}

// Function to toggle between login and signup forms
function hideNamefeild(element) {
    const formContainer = document.querySelector("#accountForm");
    const formType = document.querySelector(".heading");
    const nameFeild = document.querySelector(".nameFeild");
    const accountForm = document.querySelector("#accountForm");
    const formText = document.querySelector(".formText");
    const forgetPassword = document.querySelector(".forgetpassword");


    // Add the 'hide' class to trigger the fade-out effect
    formContainer.classList.add("hide");

    // Wait for the fade-out to complete before changing the content
    setTimeout(() => {
        if (element.innerHTML === "LOGIN") {
            nameFeild.type = "hidden";
            formType.innerHTML = "Login";
            accountForm.action = "/users/login";
            formText.innerHTML = `Never Registered? <button type="button" onclick="hideNamefeild(this)" class="btn btn-link text-decoration-none p-0 ">SIGNUP</button>`;
            forgetPassword.classList.remove("d-none")
        } else {
            nameFeild.type = "text";
            formType.innerHTML = "SignUp";
            accountForm.action = "/users/signup";
            formText.innerHTML = `Already Registered? <button type="button" onclick="hideNamefeild(this)" class="btn btn-link text-decoration-none p-0 ">LOGIN</button>`;
            forgetPassword.classList.add("d-none")

        }

        // After changing the content, remove the 'hide' class to trigger the fade-in effect
        formContainer.classList.remove("hide");
    }, 500); // 500ms matches the transition duration in CSS
}


// Function to handle search input (for debugging or future use)
function handleSeach() {
    const searchFilter = document.querySelector("#searchFilter");
   
}





 



