const loader = document.getElementById('loader');
const app = document.getElementById('app');
const chatView = document.getElementById('chat-view');
const msgInput = document.getElementById('msg-in');
const histList = document.getElementById('hist-list');

// APNA VERCEL URL YAHAN DALO
const VERCEL_URL "https://apna-ai-backend-jd8f-ayush-killers-projects.vercel.app/api/chat"; 

let userName = localStorage.getItem('ayush_user');
let chatSessions = JSON.parse(localStorage.getItem('ayush_chats')) || [];
let currentChat = [];
let currentSessionId = Date.now();

// 1. LOADING LOGIC
function runInitialLoading() {
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            if (!userName) {
                showModal('name-modal');
            } else {
                startApp();
                renderHistory();
                if (currentChat.length === 0) {
                    addBubble('ai', `Namaste ${userName}! Main apki kaise madad kar sakta hoon?`);
                }
            }
        }, 800);
    }, 5000); 
}
window.onload = runInitialLoading;

// 2. SEND MESSAGE LOGIC
async function sendMsg() {
    const text = msgInput.value.trim();
    if (!text) return;

    addBubble('user', text);
    msgInput.value = '';
    msgInput.style.height = 'auto';
    
    currentChat.push({ role: 'user', content: text });

    const thinkingId = 'think-' + Date.now();
    const thinking = document.createElement('div');
    thinking.id = thinkingId;
    thinking.className = 'msg-container ai-container';
    thinking.innerHTML = '<div class="msg-wrapper ai-msg">Thinking...</div>';
    chatView.appendChild(thinking);
    chatView.scrollTop = chatView.scrollHeight;

    try {
        const response = await fetch(VERCEL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                messages: currentChat,
                userName: userName
            })
        });

        const data = await response.json();
        const thinkDiv = document.getElementById(thinkingId);
        if(thinkDiv) thinkDiv.remove();

        if (data.choices && data.choices[0].message) {
            const aiReply = data.choices[0].message.content;
            addBubble('ai', aiReply);
            currentChat.push({ role: 'assistant', content: aiReply });
            saveToLocalStorage();
        } else {
            addBubble('ai', "Locha ho gaya: Response nahi mila.");
        }

    } catch (e) {
        const thinkDiv = document.getElementById(thinkingId);
        if(thinkDiv) thinkDiv.remove();
        addBubble('ai', "Error: Backend se connect nahi ho pa raha.");
    }
}

// 3. BUBBLE LOGIC
function addBubble(role, content) {
    const container = document.createElement('div');
    container.className = `msg-container ${role === 'user' ? 'user-container' : 'ai-container'}`;

    const wrapper = document.createElement('div');
    wrapper.className = `msg-wrapper ${role === 'user' ? 'user-msg' : 'ai-msg'}`;
    wrapper.textContent = content;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(content).then(() => {
            copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color:#4CAF50;"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
            }, 1500);
        });
    };

    container.appendChild(wrapper);
    container.appendChild(copyBtn);
    chatView.appendChild(container);
    chatView.scrollTop = chatView.scrollHeight;
}

// 4. STORAGE & UI FUNCTIONS
function saveToLocalStorage() {
    const firstUserMsg = currentChat.find(m => m.role === 'user');
    const title = firstUserMsg ? firstUserMsg.content.substring(0, 25) + "..." : "New Chat";
    const idx = chatSessions.findIndex(s => s.id === currentSessionId);
    if (idx > -1) {
        chatSessions[idx].messages = JSON.parse(JSON.stringify(currentChat));
    } else {
        chatSessions.unshift({ id: currentSessionId, title: title, messages: JSON.parse(JSON.stringify(currentChat)) });
    }
    localStorage.setItem('ayush_chats', JSON.stringify(chatSessions));
    renderHistory();
}

function renderHistory() {
    histList.innerHTML = '';
    chatSessions.forEach(s => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<i class="fa-regular fa-comment"></i> &nbsp; ${s.title}`;
        div.onclick = () => {
            currentSessionId = s.id;
            currentChat = JSON.parse(JSON.stringify(s.messages));
            chatView.innerHTML = '';
            currentChat.forEach(m => addBubble(m.role === 'user' ? 'user' : 'ai', m.content));
            toggleSidebar();
        };
        histList.appendChild(div);
    });
}

function createNewChat() {
    currentSessionId = Date.now();
    currentChat = [];
    chatView.innerHTML = '';
    addBubble('ai', `Naya chat shuru, bolo ${userName}!`);
}

function showModal(id) { 
    const m = document.getElementById(id); 
    m.style.display='flex'; 
    setTimeout(()=>m.classList.add('active'),50); 
}

function hideModal(id) { 
    const m = document.getElementById(id); 
    m.classList.remove('active'); 
    setTimeout(()=>m.style.display='none',500); 
}

function saveName() {
    const val = document.getElementById('user-name-input').value.trim();
    if(val) { 
        userName = val; 
        localStorage.setItem('ayush_user', val); 
        hideModal('name-modal'); 
        startApp(); 
        addBubble('ai', `Swagat hai ${userName}!`);
    }
}

function startApp() { app.style.display='block'; }
function openConfirm() { showModal('confirm-modal'); }
function closeConfirm() { hideModal('confirm-modal'); }
function finalClearData() { localStorage.removeItem('ayush_chats'); location.reload(); }

function toggleSidebar() {
    const s = document.getElementById('sidebar');
    const o = document.getElementById('overlay');
    s.classList.toggle('active');
    o.style.display = s.classList.contains('active') ? 'block' : 'none';
}

// Enter key fix
msgInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMsg();
    }
});

