const socket = io();

// DOM 요소 가져오기
const screen1 = document.getElementById('screen-1');
const screen2 = document.getElementById('screen-2');

const startChatBtn = document.getElementById('start-chat-btn');
const backBtn = document.getElementById('back-btn');
const moreBtn = document.getElementById('more-btn'); // 👈 아티스트 모드 전환 버튼

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');

// 👑 아티스트 답장 모드 상태 변수 (기본값: false - 일반 사용자 모드)
let isArtistMode = false;
const ARTIST_PASSWORD = "1234"; // 🔒 원하는 비밀번호로 변경 가능!

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
            alert("어떻게...?");
            messageInput.placeholder = "답장!";
            messageInput.focus();
        } else if (password !== null) {
            alert("날 닮은 너~ 너 누구야~");
        }
    } else {
        // 이미 답장 모드인 경우 모드 해제 여부 묻기
        if (confirm("돌아가기")) {
            isArtistMode = false;
            alert("휴~");
            messageInput.placeholder = "마음 속 이야기를...";
        }
    }
});

// 4️⃣ 메시지 전송 이벤트
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    // 현재 모드에 따라 senderType 결정 ('artist' 또는 'user')
    const senderType = isArtistMode ? 'artist' : 'user';

    // 서버로 메시지와 보낸 사람 유형 전송
    socket.emit('chatMessage', { 
        text: text,
        senderType: senderType
    });

    messageInput.value = '';
});

// 5️⃣ 서버로부터 실시간 메시지 수신 및 화면 출력
socket.on('message', (data) => {
    const text = typeof data === 'object' ? data.text : data;
    const senderType = data.senderType || 'user';

    const groupDiv = document.createElement('div');

    if (senderType === 'artist') {
        // 🟢 [아티스트 메시지] - 연두색 그라데이션 말풍선
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
        // ⚪ [일반 내 메시지] - 흰색 우측 정렬 말풍선
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

// 6️⃣ 서버에서 이전 대화 기록 로드 (DB 연결 시)
socket.on('loadHistory', (history) => {
    chatMessages.innerHTML = '';
    history.forEach(data => {
        // 서버 message 이벤트 재활용
        socket.listeners('message')[0](data);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// 현재 시간 포맷 함수
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// XSS 방지 특수문자 이스케이프 함수
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}