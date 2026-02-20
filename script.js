const loader = document.getElementById('loader');
const nameModal = document.getElementById('name-modal');
const app = document.getElementById('app');
const chatView = document.getElementById('chat-view');
const msgInput = document.getElementById('msg-in');
const histList = document.getElementById('hist-list');

// TERA VERCEL URL
const VERCEL_URL = "https://apna-ai-ayush.vercel.app/api/chat";

let userName = localStorage.getItem('ayush_chat_user');
let chatSessions = JSON.parse(localStorage.getItem('ayush_sessions')) || [];
let currentChat = [];
let currentSessionId = Date.now();

// ================================
// SMOOTH MODAL ANIMATIONS
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
    setTimeout(() => { m.style.display = 'none'; }, 400);
}

// ================================
// LOADING & APP START
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
    addBubble('ai', `Aaiye **${userName}**, main aapki kaise madad kar sakta hoon?`);
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
// SEND MESSAGE (ONLY CHAT)
// ================================
async function sendMsg() {
    const text = msgInput.value.trim();
    if (!text) return;

    addBubble('user', text);
    currentChat.push({ role: 'user', content: text });
    msgInput.value = '';

    const aiGenDiv = document.createElement('div');
    aiGenDiv.innerHTML = `<div style="padding:10px; color:#aaa; font-style:italic; font-size:0.85rem;">Thinking...</div>`;
    chatView.appendChild(aiGenDiv);
    chatView.scrollTop = chatView.scrollHeight;

    try {
        const response = await fetch(VERCEL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: 'chat', // Sirf chat bhej rahe hain
                prompt: text,
                userName: userName,
                messages: currentChat.slice(-10) // Context ke liye last 10 messages
            })
        });

        if (!response.ok) throw new Error("Server Error");

        const data = await response.json();
        aiGenDiv.remove();

        const aiReply = data.choices[0].message.content;
        addBubble('ai', aiReply);
        currentChat.push({ role: 'ai', content: aiReply });
        
        saveCurrentSession();

    } catch (error) {
        aiGenDiv.innerHTML = `<div style="color:red; font-size:0.8rem;">Disconnected. Check your internet or API.</div>`;
    }
}

// ================================
// BUBBLES & HISTORY
// ================================
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

function saveCurrentSession() {
    if (currentChat.length === 0) return;
    const title = currentChat.find(m => m.role === 'user')?.content.substring(0, 25) || "Conversation";
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
        div.innerHTML = `<i class="far fa-comment-alt"></i> ${session.title}`;
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

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('overlay');
    sb.classList.toggle('active');
    ov.style.display = sb.classList.contains('active') ? 'block' : 'none';
}

function createNewChat() {
    currentChat = [];
    currentSessionId = Date.now();
    chatView.innerHTML = '';
    addBubble('ai', "Nayi chat shuru karein.");
    if(document.getElementById('sidebar').classList.contains('active')) toggleSidebar();
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
    }, 500);
}
    
