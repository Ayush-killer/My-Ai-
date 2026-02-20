const loader = document.getElementById('loader');
const nameModal = document.getElementById('name-modal');
const app = document.getElementById('app');
const chatView = document.getElementById('chat-view');
const msgInput = document.getElementById('msg-in');
const histList = document.getElementById('hist-list');
const imgPreviewContainer = document.getElementById('image-preview-container');
const imgPreview = document.getElementById('image-preview');

// TERA VERCEL URL SAHI JAGAH PAR
const VERCEL_URL = "https://apna-ai-ayush.vercel.app/api/chat";

let userName = localStorage.getItem('ayush_chat_user');
let chatSessions = JSON.parse(localStorage.getItem('ayush_sessions')) || [];
let currentChat = [];
let currentSessionId = Date.now();
let selectedImageBase64 = null;

function runInitialLoading() {
    loader.style.display = 'flex';
    loader.style.opacity = '1';
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            if (!userName) showModal('name-modal');
            else startApp();
        }, 500);
    }, 3000);
}

window.onload = () => { renderHistory(); runInitialLoading(); };

function startApp() {
    app.style.display = 'block';
    chatView.innerHTML = '';
    addBubble('ai', `Welcome back, <b>${userName}</b>!`);
}

function saveName() {
    const val = document.getElementById('user-name-input').value.trim();
    if (val) {
        userName = val;
        localStorage.setItem('ayush_chat_user', userName);
        hideModal('name-modal');
        setTimeout(startApp, 400);
    }
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedImageBase64 = e.target.result;
            imgPreview.src = selectedImageBase64;
            imgPreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function clearImagePreview() {
    selectedImageBase64 = null;
    imgPreviewContainer.style.display = 'none';
    document.getElementById('file-input').value = '';
}

// ================================
// SEND MESSAGE (VERCEL INTEGRATED)
// ================================
async function sendMsg() {
    const text = msgInput.value.trim();
    if (!text && !selectedImageBase64) return;

    let messageContent = '';
    if (selectedImageBase64) {
        messageContent += `<img src="${selectedImageBase64}" class="chat-img-mini">`;
    }
    if (text) {
        messageContent += `<span>${text}</span>`;
    }

    addBubble('user', messageContent);
    currentChat.push({ role: 'user', content: text, image: selectedImageBase64 });
    
    msgInput.value = '';
    clearImagePreview();

    // AI Searching Loader
    const aiGenDiv = document.createElement('div');
    aiGenDiv.innerHTML = `<div style="padding:10px; color:#aaa; font-style:italic;">Searching...</div>`;
    chatView.appendChild(aiGenDiv);
    chatView.scrollTop = chatView.scrollHeight;

    try {
        const response = await fetch(VERCEL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: text,
                image: selectedImageBase64,
                messages: currentChat.map(m => ({role: m.role, content: m.content})),
                userName: userName
            })
        });

        const data = await response.json();
        aiGenDiv.remove();

        // Server se reply nikalna
        const aiReply = data.reply || data.choices?.[0]?.message?.content || "No response from server.";
        
        currentChat.push({ role: 'ai', content: aiReply });
        addBubble('ai', aiReply);
        saveCurrentSession();

    } catch (error) {
        aiGenDiv.innerHTML = `<div style="color:red;">Error: System disconnect.</div>`;
    }
}

function saveCurrentSession() {
    if (currentChat.length === 0) return;
    const firstText = currentChat.find(m => m.role === 'user')?.content.replace(/<[^>]*>/g, '').substring(0, 20) || "Image Chat";
    const idx = chatSessions.findIndex(s => s.id === currentSessionId);
    if (idx > -1) chatSessions[idx].messages = currentChat;
    else chatSessions.unshift({ id: currentSessionId, title: firstText + "...", messages: currentChat });
    localStorage.setItem('ayush_sessions', JSON.stringify(chatSessions));
    renderHistory();
}

function renderHistory() {
    histList.innerHTML = '';
    chatSessions.forEach(session => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<i class="far fa-message" style="margin-right:10px;"></i> ${session.title}`;
        div.onclick = () => loadSession(session.id);
        histList.appendChild(div);
    });
}

function loadSession(id) {
    const s = chatSessions.find(x => x.id === id);
    if (s) {
        currentSessionId = s.id;
        currentChat = [...s.messages];
        chatView.innerHTML = '';
        currentChat.forEach(m => {
            let content = m.image ? `<img src="${m.image}" class="chat-img-mini">` : '';
            content += m.content;
            addBubble(m.role, content);
        });
        toggleSidebar();
    }
}

function createNewChat() {
    currentChat = [];
    currentSessionId = Date.now();
    chatView.innerHTML = '';
    addBubble('ai', "New chat shuru.");
    if(document.getElementById('sidebar').classList.contains('active')) toggleSidebar();
}

function addBubble(role, content) {
    const div = document.createElement('div');
    div.style.margin = "8px 0";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    const align = role === 'user' ? 'flex-end' : 'flex-start';
    const bg = role === 'user' ? '#000' : '#f1f1f1';
    const color = role === 'user' ? '#fff' : '#000';
    div.innerHTML = `<div style="max-width:85%; padding:10px 14px; background:${bg}; color:${color}; border-radius:18px; align-self:${align}; font-size:0.95rem; font-weight:500;">${content}</div>`;
    chatView.appendChild(div);
    chatView.scrollTop = chatView.scrollHeight;
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('overlay');
    sb.classList.toggle('active');
    ov.style.display = sb.classList.contains('active') ? 'block' : 'none';
}

function showModal(id) {
    const m = document.getElementById(id);
    m.style.display = 'flex';
    setTimeout(() => { m.style.opacity = '1'; }, 10);
}

function hideModal(id) {
    const m = document.getElementById(id);
    m.style.opacity = '0';
    setTimeout(() => { m.style.display = 'none'; }, 300);
}

function openConfirm() { showModal('confirm-modal'); }
function closeConfirm() { hideModal('confirm-modal'); }

function finalClearData() {
    localStorage.clear();
    userName = null;
    chatSessions = [];
    currentChat = [];
    hideModal('confirm-modal');
    if(document.getElementById('sidebar').classList.contains('active')) toggleSidebar();
    app.style.display = 'none';
    renderHistory();
    setTimeout(() => {
        document.getElementById('user-name-input').value = '';
        runInitialLoading(); 
    }, 400);
}
