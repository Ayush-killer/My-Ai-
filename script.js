const loader = document.getElementById('loader');
const nameModal = document.getElementById('name-modal');
const app = document.getElementById('app');
const chatView = document.getElementById('chat-view');
const msgInput = document.getElementById('msg-in');
const histList = document.getElementById('hist-list');
const imgPreviewContainer = document.getElementById('image-preview-container');
const imgPreview = document.getElementById('image-preview');

// TERA VERCEL URL
const VERCEL_URL = "https://apna-ai-ayush.vercel.app/api/chat";

let userName = localStorage.getItem('ayush_chat_user');
let chatSessions = JSON.parse(localStorage.getItem('ayush_sessions')) || [];
let currentChat = [];
let currentSessionId = Date.now();
let selectedImageBase64 = null;

// ================================
// SMOOTH POPUP ANIMATIONS
// ================================
function showModal(id) {
    const m = document.getElementById(id);
    m.style.display = 'flex';
    m.style.opacity = '0';
    const card = m.querySelector('.modal-card');
    card.style.transform = 'scale(0.7)';
    card.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    setTimeout(() => {
        m.style.opacity = '1';
        card.style.transform = 'scale(1)';
    }, 50);
}

function hideModal(id) {
    const m = document.getElementById(id);
    const card = m.querySelector('.modal-card');
    m.style.opacity = '0';
    card.style.transform = 'scale(0.7)';
    setTimeout(() => { 
        m.style.display = 'none'; 
    }, 400);
}

// ================================
// INITIAL LOADING & REBOOT
// ================================
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
    addBubble('ai', `Welcome back, <b>${userName}</b>! Main aapki kya madad kar sakta hoon?`);
}

function saveName() {
    const val = document.getElementById('user-name-input').value.trim();
    if (val) {
        userName = val;
        localStorage.setItem('ayush_chat_user', userName);
        hideModal('name-modal');
        setTimeout(startApp, 500);
    }
}

// ================================
// IMAGE PREVIEW LOGIC
// ================================
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
// SEND MESSAGE (SYNCED WITH BACKEND)
// ================================
async function sendMsg() {
    const text = msgInput.value.trim();
    if (!text && !selectedImageBase64) return;

    // Frontend Display
    let displayHTML = selectedImageBase64 ? `<img src="${selectedImageBase64}" class="chat-img-mini">` : '';
    displayHTML += text ? `<span>${text}</span>` : '';
    addBubble('user', displayHTML);

    // Context ke liye current chat mein save
    currentChat.push({ role: 'user', content: text });

    msgInput.value = '';
    const isImageTask = selectedImageBase64 ? 'image' : 'chat';
    clearImagePreview();

    // Searching... Loader
    const aiGenDiv = document.createElement('div');
    aiGenDiv.innerHTML = `<div style="padding:10px; color:#aaa; font-style:italic; font-size:0.85rem;">Searching...</div>`;
    chatView.appendChild(aiGenDiv);
    chatView.scrollTop = chatView.scrollHeight;

    try {
        const response = await fetch(VERCEL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: isImageTask,
                prompt: text,
                userName: userName,
                messages: currentChat.map(m => ({ role: m.role, content: m.content }))
            })
        });

        const data = await response.json();
        aiGenDiv.remove();

        if (data.imageUrl) {
            // Agar Image Generate hui hai
            const aiImg = `<img src="${data.imageUrl}" class="chat-img-mini">`;
            addBubble('ai', aiImg);
            currentChat.push({ role: 'ai', content: aiImg });
        } else {
            // Agar Chat Reply hai
            const aiReply = data.choices[0].message.content;
            addBubble('ai', aiReply);
            currentChat.push({ role: 'ai', content: aiReply });
        }
        
        saveCurrentSession();

    } catch (error) {
        aiGenDiv.innerHTML = `<div style="color:red; font-size:0.8rem;">Backend Error: Connection failed.</div>`;
        console.error("Vercel Error:", error);
    }
}

// ================================
// HISTORY & SIDEBAR
// ================================
function saveCurrentSession() {
    if (currentChat.length === 0) return;
    const title = currentChat.find(m => m.role === 'user')?.content.substring(0, 20) || "Conversation";
    const idx = chatSessions.findIndex(s => s.id === currentSessionId);
    if (idx > -1) chatSessions[idx].messages = currentChat;
    else chatSessions.unshift({ id: currentSessionId, title: title + "...", messages: currentChat });
    localStorage.setItem('ayush_sessions', JSON.stringify(chatSessions));
    renderHistory();
}

function renderHistory() {
    histList.innerHTML = '';
    chatSessions.forEach(session => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<i class="far fa-message" style="margin-right:10px;"></i> ${session.title}`;
        div.onclick = () => {
            currentSessionId = session.id;
            currentChat = [...session.messages];
            chatView.innerHTML = '';
            currentChat.forEach(m => addBubble(m.role, m.content));
            toggleSidebar();
        };
        histList.appendChild(div);
    });
}

function createNewChat() {
    currentChat = [];
    currentSessionId = Date.now();
    chatView.innerHTML = '';
    addBubble('ai', "New chat started.");
    if(document.getElementById('sidebar').classList.contains('active')) toggleSidebar();
}

function addBubble(role, content) {
    const div = document.createElement('div');
    div.style.margin = "10px 0";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    const align = role === 'user' ? 'flex-end' : 'flex-start';
    const bg = role === 'user' ? '#000' : '#f2f2f2';
    const color = role === 'user' ? '#fff' : '#000';
    div.innerHTML = `<div style="max-width:85%; padding:12px 16px; background:${bg}; color:${color}; border-radius:18px; align-self:${align}; font-size:0.95rem;">${content}</div>`;
    chatView.appendChild(div);
    chatView.scrollTop = chatView.scrollHeight;
}

// ================================
// UI & REBOOT CONTROLS
// ================================
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('overlay');
    sb.classList.toggle('active');
    ov.style.display = sb.classList.contains('active') ? 'block' : 'none';
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
    // Reboot to black loading screen
    setTimeout(() => {
        document.getElementById('user-name-input').value = '';
        runInitialLoading(); 
    }, 500);
}
