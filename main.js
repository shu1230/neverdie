const socket = io("https://neverdie-1.onrender.com");

// DOM 요소 가져오기
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
const ARTIST_PASSWORD = "1234";

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
        const password = prompt("비밀번호를 입력하세요:");
        if (password === ARTIST_PASSWORD) {
            isArtistMode = true;
            alert("👑 아티스트(맘이) 모드로 전환되었습니다!");
            messageInput.placeholder = "답장 작성 중...";
            messageInput.focus();
        } else if (password !== null) {
            alert("날 닮은 너~ 너 누구야~");
        }
    } else {
        if (confirm("일반 사용자 모드로 돌아가시겠습니까?")) {
            isArtistMode = false;
            alert("일반 모드로 돌아왔습니다.");
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
                <span class="msg-sender">맘이</span>
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