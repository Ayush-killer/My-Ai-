let allSessions = JSON.parse(localStorage.getItem('ai_sessions') || '[]');
let currentSession = { id: Date.now(), messages: [] };
let userName = localStorage.getItem('ai_user_name') || "Ayush";

const chatView = document.getElementById('chat-view');
const msgInput = document.getElementById('msg-in');
const imgToggle = document.getElementById('img-toggle');
const VERCEL_URL = "TERA_VERCEL_BACKEND_URL"; 

window.onload = () => {
    renderHistory();
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        checkUser();
    }, 3000);
};

// IMAGE UPLOAD HANDLER
function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // User ko dikhane ke liye message bubble mein image add karo
            addBubble('user', "Bhai, ye image dekh:", e.target.result);
            // Yahan tu backend par image bhej sakta hai payload badal kar
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function checkUser() {
    if(!localStorage.getItem('ai_user_name')) {
        document.getElementById('name-modal-overlay').style.display = 'flex';
    } else { showApp(); }
}

function saveUserName() {
    const input = document.getElementById('user-name-input');
    if(input.value.trim() !== "") {
        userName = input.value.trim();
        localStorage.setItem('ai_user_name', userName);
        document.getElementById('name-modal-overlay').style.display = 'none';
        showApp();
    }
}

function showApp() {
    document.getElementById('app').classList.add('visible');
    document.getElementById('user-display').innerText = `Hi, ${userName}`;
    if (currentSession.messages.length === 0) startNewChat();
}

function startNewChat() {
    currentSession = { id: Date.now(), messages: [] };
    chatView.innerHTML = `<div class="ai-msg"><div class="bubble">Ram Ram <b>${userName}</b> bhai! Bol kya banau aaj?</div></div>`;
}

async function sendMsg() {
    const val = msgInput.value.trim();
    if(!val) return;
    addBubble('user', val);
    msgInput.value = '';
    const genBubble = addGeneratingBubble();
    try {
        const payload = imgToggle.checked 
            ? { type: 'image', prompt: val, userName: userName }
            : { type: 'chat', messages: [{role: 'user', content: val}], userName: userName };

        const res = await fetch(VERCEL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        genBubble.remove();
        if (imgToggle.checked) { addBubble('ai', '', data.imageUrl); } 
        else { addBubble('ai', data.choices[0].message.content); }
    } catch (e) {
        genBubble.remove();
        addBubble('ai', "Bhai locha ho gaya!");
    }
}

function addBubble(role, text, img = null, save = true) {
    if(save) currentSession.messages.push({role, text, img});
    const div = document.createElement('div');
    div.className = `${role}-msg`;
    div.innerHTML = (img ? `<img src="${img}" style="width:100%; border-radius:15px; margin-bottom:10px; border:2px solid #fff;">` : '') + (text ? `<div class="bubble">${text}</div>` : '');
    chatView.appendChild(div);
    chatView.scrollTop = chatView.scrollHeight;
    if(save) {
        const idx = allSessions.findIndex(s => s.id === currentSession.id);
        if(idx === -1) allSessions.push(currentSession); else allSessions[idx] = currentSession;
        localStorage.setItem('ai_sessions', JSON.stringify(allSessions));
        renderHistory();
    }
}

function addGeneratingBubble() {
    const div = document.createElement('div');
    div.className = `ai-msg`;
    div.innerHTML = `<div class="bubble">Bhai soch raha hai...</div>`;
    chatView.appendChild(div);
    return div;
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function renderHistory() {
    const list = document.getElementById('hist-list');
    list.innerHTML = '';
    allSessions.slice().reverse().forEach(s => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerText = s.messages.find(m => m.role === 'user')?.text.substring(0, 25) || "Chat";
        div.onclick = () => { 
            currentSession = s; 
            chatView.innerHTML = ''; 
            s.messages.forEach(m => addBubble(m.role, m.text, m.img, false));
            toggleSidebar();
        };
        list.appendChild(div);
    });
}
