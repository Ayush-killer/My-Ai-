let allSessions = JSON.parse(localStorage.getItem('ai_sessions') || '[]');
let currentSession = { id: Date.now(), messages: [] };
let userName = localStorage.getItem('ai_user_name');
const chatView = document.getElementById('chat-view');
const msgInput = document.getElementById('msg-in');
const imgToggle = document.getElementById('img-toggle');
const VERCEL_URL = "https://apna-ai-ayush.vercel.app/api/chat";

// TYPING EFFECT
function typeWriter(element, text) {
    let formattedText = text
        .replace(/## (.*?)\n/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\n/g, '<br>');
    
    element.innerHTML = formattedText;
    chatView.scrollTop = chatView.scrollHeight;
}

function addBubble(role, text, img = null, save = true) {
    if(save) currentSession.messages.push({role, content: text, img});
    const container = document.createElement('div');
    container.className = `${role}-msg`;
    
    let content = img ? `<img src="${img}" style="max-width:100%; border-radius:12px; margin-bottom:10px; border:1px solid #eee;">` : '';
    
    if (text) {
        content += `<div class="bubble">${role === 'user' ? text : ''}</div>`;
    }

    if(role === 'ai' && text) {
        content += `<div class="copy-btn" onclick="copyText(this, \`${text.replace(/`/g, "\\`")}\`)"><i class="far fa-copy"></i> Copy</div>`;
    }

    container.innerHTML = content;
    chatView.appendChild(container);

    if(role === 'ai' && text) {
        const bubble = container.querySelector('.bubble');
        typeWriter(bubble, text);
    }
    
    chatView.scrollTop = chatView.scrollHeight;
    if(save) saveToLocal();
}

async function sendMsg() {
    const val = msgInput.value.trim();
    if(!val) return;
    
    addBubble('user', val);
    msgInput.value = '';
    
    const genDiv = document.createElement('div');
    genDiv.className = 'ai-msg';
    genDiv.innerHTML = `<div class="bubble" style="color:#999; font-style:italic;">Analyzing...</div>`;
    chatView.appendChild(genDiv);

    try {
        const res = await fetch(VERCEL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: imgToggle.checked ? 'image' : 'chat',
                prompt: val,
                messages: currentSession.messages.map(m => ({role: m.role, content: m.content})),
                userName: userName
            })
        });
        const data = await res.json();
        genDiv.remove();

        if (imgToggle.checked) { 
            addBubble('ai', '', data.imageUrl); 
        } else { 
            addBubble('ai', data.choices[0].message.content); 
        }
    } catch (e) {
        genDiv.innerHTML = "Connection Error.";
    }
}

// REST OF LOGIC
function saveToLocal() {
    const idx = allSessions.findIndex(s => s.id === currentSession.id);
    if(idx === -1) allSessions.push(currentSession); else allSessions[idx] = currentSession;
    localStorage.setItem('ai_sessions', JSON.stringify(allSessions));
    renderHistory();
}

function copyText(btn, text) {
    navigator.clipboard.writeText(text);
    btn.innerHTML = '<i class="fas fa-check"></i> Copied';
    setTimeout(() => btn.innerHTML = '<i class="far fa-copy"></i> Copy', 2000);
}

function startNewChat() {
    currentSession = { id: Date.now(), messages: [] };
    chatView.innerHTML = '';
    addBubble('ai', `Hello **${userName}**, how can I assist you today?`, null, false);
}

window.onload = () => {
    renderHistory();
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        if(!userName) document.getElementById('name-modal-overlay').style.display = 'flex';
        else showApp();
    }, 2000);
};

function saveUserName() {
    const input = document.getElementById('user-name-input');
    if(input.value.trim()) {
        userName = input.value.trim();
        localStorage.setItem('ai_user_name', userName);
        document.getElementById('name-modal-overlay').style.display = 'none';
        showApp();
    }
}

function showApp() {
    document.getElementById('app').style.display = 'flex';
    document.getElementById('user-display').innerText = userName;
    if(currentSession.messages.length === 0) startNewChat();
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
        div.innerText = s.messages[0]?.content.substring(0, 30) || "New Conversation";
        div.onclick = () => {
            currentSession = s;
            chatView.innerHTML = '';
            s.messages.forEach(m => addBubble(m.role, m.content, m.img, false));
            toggleSidebar();
        };
        list.appendChild(div);
    });
}

function showConfirmModal() { document.getElementById('confirm-modal-overlay').style.display = 'flex'; }
function hideConfirmModal() { document.getElementById('confirm-modal-overlay').style.display = 'none'; }
function finalDeactivate() { localStorage.clear(); location.reload(); }
function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => addBubble('user', "Analyze this image:", e.target.result);
        reader.readAsDataURL(input.files[0]);
    }
}
