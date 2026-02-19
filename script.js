let allSessions = JSON.parse(localStorage.getItem('ai_sessions') || '[]');
let currentSession = { id: Date.now(), messages: [] };
let userName = localStorage.getItem('ai_user_name');

const chatView = document.getElementById('chat-view');
const msgInput = document.getElementById('msg-in');
const imgToggle = document.getElementById('img-toggle');
const userDisplay = document.getElementById('user-display');

// !!! YAHAN APNA VERCEL LINK DAALNA !!!
const VERCEL_URL = "https://tera-app-name.vercel.app/api/chat";

window.onload = () => {
    renderHistory();
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => { 
            document.getElementById('loader').style.display = 'none'; 
            checkUser();
        }, 600);
    }, 3000);
};

function checkUser() {
    if(!userName) {
        document.getElementById('name-modal-overlay').style.display = 'flex';
        setTimeout(() => document.getElementById('name-modal').classList.add('show'), 100);
    } else { showApp(); }
}

function saveUserName() {
    const input = document.getElementById('user-name-input');
    if(input.value.trim() !== "") {
        userName = input.value.trim();
        localStorage.setItem('ai_user_name', userName);
        document.getElementById('name-modal').classList.remove('show');
        setTimeout(() => {
            document.getElementById('name-modal-overlay').style.display = 'none';
            showApp();
        }, 400);
    }
}

function showApp() {
    document.getElementById('app').classList.add('visible');
    userDisplay.innerText = `Hi, ${userName}`;
    if (currentSession.messages.length === 0) startNewChat();
}

function startNewChat() {
    currentSession = { id: Date.now(), messages: [] };
    chatView.innerHTML = `<div class="ai-msg"><div class="bubble">Ram Ram <b>${userName}</b> bhai! Tera 'APNA AI' hazir hai.</div></div>`;
    renderHistory();
}

async function sendMsg() {
    const val = msgInput.value.trim();
    if(!val) return;

    addBubble('user', val);
    msgInput.value = '';
    const genBubble = addGeneratingBubble();

    try {
        // Payload taiyar kar rahe hain (Chat ya Image)
        const payload = imgToggle.checked 
            ? { type: 'image', prompt: val, userName: userName }
            : { type: 'chat', messages: [...currentSession.messages.slice(-6).map(m => ({ role: m.role, content: m.text }))], userName: userName };

        const res = await fetch(VERCEL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        genBubble.remove();

        if (imgToggle.checked) {
            addBubble('ai', '', data.imageUrl); // Image dikhao
        } else {
            addBubble('ai', data.choices[0].message.content); // Chat dikhao
        }
    } catch (e) {
        genBubble.remove();
        addBubble('ai', "Bhai locha ho gaya! Check kar API Keys daali hain ya nahi.");
    }
}

// Baki saare Helpers (addBubble, renderHistory, etc.) wahi purane wale use kar lena
function addBubble(role, text, img = null, save = true) {
    if(save) currentSession.messages.push({role, text, img});
    const div = document.createElement('div');
    div.className = `${role}-msg`;
    let html = img ? `<img src="${img}" class="chat-img"><br>` : '';
    html += text ? `<div class="bubble">${text}</div>` : '';
    div.innerHTML = html;
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
    div.innerHTML = `<div class="generating-bubble"><span class="spinner"></span> Tera bhai soch raha hai...</div>`;
    chatView.appendChild(div);
    chatView.scrollTop = chatView.scrollHeight;
    return div;
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function renderHistory() {
    const list = document.getElementById('hist-list');
    if(!list) return;
    list.innerHTML = '';
    allSessions.slice().reverse().forEach(s => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerText = s.messages.find(m => m.role === 'user')?.text.substring(0, 20) || "Naya Chat";
        div.onclick = () => { 
            currentSession = s; 
            chatView.innerHTML = ''; 
            s.messages.forEach(m => addBubble(m.role, m.text, m.img, false));
        };
        list.appendChild(div);
    });
}
function showConfirmModal() { document.getElementById('confirm-modal-overlay').style.display = 'flex'; }
function closeConfirmModal() { document.getElementById('confirm-modal-overlay').style.display = 'none'; }
function executeClearStorage() { localStorage.clear(); location.reload(); }
msgInput.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px'; });

