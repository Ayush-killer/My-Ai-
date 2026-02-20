// ===============================
//        5 SECOND LOADER
// ===============================

window.addEventListener("load", function () {

    const loader = document.getElementById("loader");
    const app = document.getElementById("app");
    const nameModal = document.getElementById("name-modal");

    if (!loader || !app) return;

    loader.style.display = "flex";
    app.style.display = "none";

    setTimeout(function () {

        loader.style.opacity = "0";
        loader.style.transition = "opacity 0.5s ease";

        setTimeout(function () {

            loader.style.display = "none";

            // Check if name already saved
            const savedName = localStorage.getItem("apnaAI_username");

            if (savedName) {
                app.style.display = "block";
            } else {
                nameModal.style.display = "flex";
                setTimeout(() => {
                    nameModal.style.opacity = "1";
                }, 100);
            }

        }, 500);

    }, 5000); // EXACT 5 seconds
});


// ===============================
//        SAVE NAME FUNCTION
// ===============================

function saveName() {
    const input = document.getElementById("user-name-input");
    const name = input.value.trim();

    if (name === "") {
        alert("Please enter your name");
        return;
    }

    localStorage.setItem("apnaAI_username", name);

    const nameModal = document.getElementById("name-modal");
    const app = document.getElementById("app");

    nameModal.style.opacity = "0";

    setTimeout(() => {
        nameModal.style.display = "none";
        app.style.display = "block";
    }, 400);
}


// ===============================
//        SIDEBAR TOGGLE
// ===============================

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
}


// ===============================
//        CREATE NEW CHAT
// ===============================

function createNewChat() {
    const chatView = document.getElementById("chat-view");
    chatView.innerHTML = "";
}


// ===============================
//        SEND MESSAGE
// ===============================

function sendMsg() {

    const input = document.getElementById("msg-in");
    const chatView = document.getElementById("chat-view");

    const message = input.value.trim();
    if (message === "") return;

    const msgDiv = document.createElement("div");
    msgDiv.className = "user-message";
    msgDiv.innerText = message;

    chatView.appendChild(msgDiv);

    input.value = "";
    chatView.scrollTop = chatView.scrollHeight;
}


// ===============================
//        IMAGE PREVIEW
// ===============================

function previewImage(event) {

    const previewContainer = document.getElementById("image-preview-container");
    const previewImage = document.getElementById("image-preview");

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        previewImage.src = e.target.result;
        previewContainer.style.display = "block";
    };

    reader.readAsDataURL(file);
}

function clearImagePreview() {
    const previewContainer = document.getElementById("image-preview-container");
    const fileInput = document.getElementById("file-input");

    previewContainer.style.display = "none";
    fileInput.value = "";
}


// ===============================
//        CONFIRM MODAL
// ===============================

function openConfirm() {
    const confirmModal = document.getElementById("confirm-modal");
    confirmModal.style.display = "flex";
    setTimeout(() => {
        confirmModal.style.opacity = "1";
    }, 100);
}

function closeConfirm() {
    const confirmModal = document.getElementById("confirm-modal");
    confirmModal.style.opacity = "0";
    setTimeout(() => {
        confirmModal.style.display = "none";
    }, 300);
}

function finalClearData() {
    localStorage.clear();
    location.reload();
}
