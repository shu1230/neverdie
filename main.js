// 1. 소켓 서버 연결 (단 한번만 선언)
const socket = io("https://neverdie-1.onrender.com");

// 2. DOM 요소 가져오기
const loadingOverlay = document.getElementById('loading-overlay');
const screen1 = document.getElementById('screen-1');
const screen2 = document.getElementById('screen-2');

const startChatBtn = document.getElementById('start-chat-btn');
const backBtn = document.getElementById('back-btn');
const moreBtn = document.getElementById('more-btn');

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');

// 👑 아티스트 답장 모드 상태 변수
let isArtistMode = false;
const ARTIST_PASSWORD = "12301995";

// 🟢 [로딩 오버레이 끄기 함수]
function hideLoading() {
    if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
        loadingOverlay.classList.add('hidden');
    }
}

// 🟢 서버 연결 성공 시 로딩 화면 제거
socket.on('connect', () => {
    hideLoading();
});

// 🟢 안전장치: 혹시나 연결이 10초 이상 지연되더라도 로딩창을 강제로 꺼서 화면 진입 허용
setTimeout(() => {
    hideLoading();
}, 10000);

// 1️⃣ 대화하기 버튼 클릭 시 채팅 화면으로 이동
startChatBtn.addEventListener('click', () => {
    screen1.classList.remove('active');
    screen2.classList.add('active');
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// 2️⃣ 뒤로가기 버튼
backBtn.addEventListener('click', () => {
    screen2.classList.remove('active');
    screen1.classList.add('active');
});

// 3️⃣ 우측 상단 비밀 버튼 클릭 -> 답장 모드 비밀번호 확인
moreBtn.addEventListener('click', () => {
    if (!isArtistMode) {
        const password = prompt("비밀번호가 뭐야?");
        if (password === ARTIST_PASSWORD) {
            isArtistMode = true;
            alert("알아냈어요?!");
            messageInput.placeholder = "마음에게...";
            messageInput.focus();
        } else if (password !== null) {
            alert("날 닮은 너~ 너 누구야~");
        }
    } else {
        if (confirm("일반 모드")) {
            isArtistMode = false;
            alert("짠!");
            messageInput.placeholder = "마음 속 이야기를...";
        }
    }
});

// 4️⃣ 메시지 전송 이벤트
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    const senderType = isArtistMode ? 'artist' : 'user';

    socket.emit('chatMessage', { 
        text: text,
        senderType: senderType
    });

    messageInput.value = '';
});

// 5️⃣ 서버로부터 실시간 메시지 수신
socket.on('message', (data) => {
    const text = typeof data === 'object' ? data.text : data;
    const senderType = data.senderType || 'user';

    const groupDiv = document.createElement('div');

    if (senderType === 'artist') {
        groupDiv.classList.add('message-group', 'other');
        groupDiv.innerHTML = `
            <img src="profile.png" class="msg-thumb" onerror="this.src='https://via.placeholder.com/32'">
            <div class="msg-content">
                <span class="msg-sender">•૦•💗💗💗</span>
                <div class="other-msg-container">
                    <div class="message other-msg">${escapeHtml(text)}</div>
                    <span class="msg-time">${getCurrentTime()}</span>
                </div>
            </div>
        `;
    } else {
        groupDiv.classList.add('message-group', 'my');
        groupDiv.innerHTML = `
            <div class="msg-content">
                <div class="msg-my-wrapper">
                    <span class="msg-time">${getCurrentTime()}</span>
                    <div class="message my-msg">${escapeHtml(text)}</div>
                </div>
            </div>
        `;
    }

    chatMessages.appendChild(groupDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// 6️⃣ 서버에서 이전 대화 기록 로드
socket.on('loadHistory', (history) => {
    hideLoading(); // 이전 대화 기록을 받을 때도 로딩 끄기
    chatMessages.innerHTML = '';
    history.forEach(data => {
        socket.listeners('message')[0](data);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
