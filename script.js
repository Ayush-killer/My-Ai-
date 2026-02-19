/* ... Tera Purana Poora Logic Maine Barkarar Rakha Hai ... */

// Naye Functions
function showConfirmModal() {
    document.getElementById('confirm-modal-overlay').classList.add('active');
}
function hideConfirmModal() {
    document.getElementById('confirm-modal-overlay').classList.remove('active');
}
function finalDeactivate() {
    localStorage.clear();
    location.reload();
}

function copyText(btn, text) {
    navigator.clipboard.writeText(text);
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => btn.innerHTML = original, 2000);
}

// TYPING EFFECT FUNCTION: Asli chatbot feel ke liye
function typeWriter(element, html, speed = 15) {
    let i = 0;
    element.innerHTML = "";
    // Temporarily hidden div to calculate full HTML structure
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const plainText = temp.innerText;
    
    function type() {
        if (i < plainText.length) {
            element.innerText += plainText.charAt(i);
            i++;
            chatView.scrollTop = chatView.scrollHeight;
            setTimeout(type, speed);
        } else {
            // Typing khatam hone ke baad asli HTML (headings/bold) set kar do
            element.innerHTML = html;
        }
    }
    type();
}

// UPDATE: Hashtag (#) aur Spacing ki problem fix ki hai
function addBubble(role, text, img = null, save = true) {
    if(save) currentSession.messages.push({role, text, img});
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = role === 'user' ? 'flex-end' : 'flex-start';
    container.className = `${role}-msg`;
    
    let content = img ? `<img src="${img}" style="max-width:80%; border-radius:15px; margin-bottom:8px; border:1px solid rgba(255,255,255,0.1);">` : '';
    
    if (text) {
        // MARKDOWN FIX: Ek # ho ya teen ###, ab sab properly Heading banenge aur khali # gayab ho jayenge.
        let formattedText = text
            .replace(/^#{1,3}\s*(.*)$/gm, function(match, p1) { 
                if(p1.trim() === '') return ''; // Khali # ko uda dega
                return `<h3 style="margin:18px 0 6px 0; color:#fff; font-size:1.15rem;">${p1}</h3>`; 
            })
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        // JS mein extra inline width hata di taaki CSS se proper size aaye
        content += `
            <div class="bubble" style="
                white-space: pre-wrap; 
                ${role === 'ai' ? 'background: transparent; border: none; padding: 5px 0;' : ''}
            ">
                ${role === 'user' ? formattedText : '<span class="typing-area"></span>'}
            </div>
        `;
    }
    
    if(text && !img && role === 'ai') {
        content += `<div class="copy-btn" style="margin-top:10px;" onclick="copyText(this, \`${text.replace(/`/g, "\\`")}\`)"><i class="fas fa-copy"></i> Copy</div>`;
    }

    container.innerHTML = content;
    chatView.appendChild(container);
    
    if(role === 'ai' && text && !img) {
        let target = container.querySelector('.typing-area');
        let htmlContent = text
            .replace(/^#{1,3}\s*(.*)$/gm, function(match, p1) { 
                if(p1.trim() === '') return '';
                return `<h3 style="margin:18px 0 6px 0; color:#fff; font-size:1.15rem;">${p1}</h3>`; 
            })
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        typeWriter(target, htmlContent);
    }

    chatView.scrollTop = chatView.scrollHeight;
    
    if(save) {
        const idx = allSessions.findIndex(s => s.id === currentSession.id);
        if(idx === -1) allSessions.push(currentSession); else allSessions[idx] = currentSession;
        localStorage.setItem('ai_sessions', JSON.stringify(allSessions));
        renderHistory();
    }
}

// --- TERI BAAKI SARI FUNCTIONS (BINA KISI CHANGE KE) ---
let allSessions = JSON.parse(localStorage.getItem('ai_sessions') || '[]');
let currentSession = { id: Date.now(), messages: [] };
let userName = localStorage.getItem('ai_user_name');
const chatView = document.getElementById('chat-view');
const msgInput = document.getElementById('msg-in');
const imgToggle = document.getElementById('img-toggle');

const VERCEL_URL = "https://apna-ai-backend-jd8f.vercel.app/api/chat";

window.onload = () => {
    renderHistory();
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
            if(!userName) { document.getElementById('name-modal-overlay').style.display = 'flex'; } 
            else { showApp(); }
        }, 500);
    }, 3000);
};

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
    document.getElementById('app').style.display = 'flex';
    document.getElementById('user-display').innerText = `Hi, ${userName}`;
    if (currentSession.messages.length === 0) startNewChat();
}

function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) { addBubble('user', "Ye image check kar:", e.target.result); };
        reader.readAsDataURL(input.files[0]);
    }
}

function startNewChat() {
    currentSession = { id: Date.now(), messages: [] };
    chatView.innerHTML = `<div class="ai-msg"><div class="bubble">hello 😎😉<b>${userName}</b> how are you </div></div>`;
}

async function sendMsg() {
    const val = msgInput.value.trim();
    if(!val) return;
    addBubble('user', val);
    msgInput.value = '';
    const genBubble = addGeneratingBubble();
    try {
        const res = await fetch(VERCEL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: imgToggle.checked ? 'image' : 'chat',
                prompt: val,
                messages: [{role: 'user', content: val}],
                userName: userName
            })
        });
        
        if (!res.ok) throw new Error('Backend responding with error');
        
        const data = await res.json();
        genBubble.remove();
        if (imgToggle.checked) { 
            addBubble('ai', '', data.imageUrl); 
        } 
        else { 
            const aiReply = data.choices ? data.choices[0].message.content : (data.reply || "Bhai samajh nahi aaya!");
            addBubble('ai', aiReply); 
        }
    } catch (e) {
        console.error("Fetch error:", e);
        genBubble.remove();
        addBubble('ai', "Bhai error aa gaya! Check kar ki Vercel live hai ya nahi.");
    }
}

function addGeneratingBubble() {
    const div = document.createElement('div');
    div.className = `ai-msg`;
    div.innerHTML = `<div class="bubble" style="color:#888; font-style:italic;">AI is typing...</div>`;
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
        div.innerText = s.messages.find(m => m.role === 'user')?.text.substring(0, 20) || "Chat";
        div.onclick = () => { 
            currentSession = s; 
            chatView.innerHTML = ''; 
            s.messages.forEach(m => addBubble(m.role, m.text, m.img, false));
            toggleSidebar();
        };
        list.appendChild(div);
    });
}
    
