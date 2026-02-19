let allSessions = JSON.parse(localStorage.getItem('ai_sessions') || '[]');
let currentSession = { id: Date.now(), messages: [] };
let userName = "Ayush"; // Default set kar diya tere liye

const chatView = document.getElementById('chat-view');
const msgInput = document.getElementById('msg-in');
const imgToggle = document.getElementById('img-toggle');

const VERCEL_URL = "https://tera-backend-link.vercel.app/api/chat";

window.onload = () => {
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.add('visible');
        startNewChat();
    }, 3000);
};

function startNewChat() {
    currentSession = { id: Date.now(), messages: [] };
    chatView.innerHTML = `<div class="ai-msg"><div class="bubble">Ram Ram <b>${userName}</b> bhai! Tera 'APNA AI' hazir hai. Bol kya kaam hai?</div></div>`;
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

        if (imgToggle.checked) {
            addBubble('ai', '', data.imageUrl);
        } else {
            addBubble('ai', data.choices[0].message.content);
        }
    } catch (e) {
        genBubble.remove();
        addBubble('ai', "Bhai backend link check kar, connection nahi ho raha!");
    }
}

function addBubble(role, text, img = null) {
    const div = document.createElement('div');
    div.className = `${role}-msg`;
    let html = img ? `<img src="${img}" style="width:100%; border-radius:10px;"><br>` : '';
    html += text ? `<div class="bubble">${text}</div>` : '';
    div.innerHTML = html;
    chatView.appendChild(div);
    chatView.scrollTop = chatView.scrollHeight;
}

function addGeneratingBubble() {
    const div = document.createElement('div');
    div.className = `ai-msg`;
    div.innerHTML = `<div class="bubble">...</div>`;
    chatView.appendChild(div);
    return div;
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}
