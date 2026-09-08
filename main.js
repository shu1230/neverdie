// 1. 소켓 서버 연결
const socket = io("https://neverdie-1.onrender.com");

// 2. DOM 요소 가져오기
const screen1 = document.getElementById('screen-1');
const screen2 = document.getElementById('screen-2');

const startChatBtn = document.getElementById('start-chat-btn');
const backBtn = document.getElementById('back-btn');
const moreBtn = document.getElementById('more-btn');

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');

// 동적 프로필/상태 메시지 DOM 요소 참조
const mainProfileImg = document.getElementById('main-profile-img');
const headerProfileImg = document.getElementById('header-profile-img');

const mainStatusMsg = document.getElementById('main-status-msg');

const mainArtistName = document.getElementById('main-artist-name');
const headerArtistName = document.getElementById('header-artist-name');

// 바텀시트 메뉴 요소 참조
const menuSheet = document.getElementById('menu-sheet');
const closeSheetBtn = document.getElementById('close-sheet-btn');

const btnChangeArtistName = document.getElementById('btn-change-artist-name');
const btnChangeProfileImg = document.getElementById('btn-change-profile-img');
const fileInputProfile = document.getElementById('file-input-profile');
const btnToggleArtist = document.getElementById('btn-toggle-artist');
const btnDeleteGuide = document.getElementById('btn-delete-guide');
const btnChangeStatusMsg = document.getElementById('btn-change-status-msg');

// 상태 및 데이터 불러오기 (localStorage 기반)
let isArtistMode = false;
let isAdmin = false; // 관리자 로그인 여부
const ADMIN_PASSWORD = "12301995"; // 관리자 비밀번호 (중복 제거)

let myNickname = localStorage.getItem('user_nickname') || '나';
let profileImgUrl = localStorage.getItem('user_profile_img') || 'profile.jpg';
let statusMsgText = localStorage.getItem('user_status_msg') || '감기 조심! 비염 조심!';
let artistNameText = localStorage.getItem('user_artist_name') || '•૦•💗💗💗';

// 🟢 초기 동적 데이터 화면 적용
function applyStoredData() {
    mainProfileImg.src = profileImgUrl;
    headerProfileImg.src = profileImgUrl;

    mainStatusMsg.innerText = statusMsgText;

    mainArtistName.innerText = artistNameText;
    headerArtistName.innerText = artistNameText;
}

applyStoredData();

// 화면 전환
startChatBtn.addEventListener('click', () => {
    screen1.classList.remove('active');
    screen2.classList.add('active');
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

backBtn.addEventListener('click', () => {
    screen2.classList.remove('active');
    screen1.classList.add('active');
});

// 더보기(⋮) 클릭 시 비밀번호 확인 후 관리자 메뉴 오픈
moreBtn.addEventListener('click', () => {
    if (isAdmin) {
        updateArtistModeButtonText();
        menuSheet.classList.remove('hidden');
        return;
    }
    const password = prompt("암호는?");
    if (password === ADMIN_PASSWORD) {
        isAdmin = true; // 관리자 로그인 성공 처리
        updateArtistModeButtonText();
        menuSheet.classList.remove('hidden');
    } else if (password !== null) {
        alert("제 영역입니닷!");
    }
});

// 🟢 상태 메시지 변경 이벤트
btnChangeStatusMsg.addEventListener('click', () => {
    const newStatus = prompt("새로운 상태 메시지를 입력하세요:", statusMsgText);
    if (newStatus !== null) {
        statusMsgText = newStatus.trim();
        localStorage.setItem('user_status_msg', statusMsgText);
        applyStoredData();
        alert("상태 메시지가 변경되었습니다.");
    }
});

closeSheetBtn.addEventListener('click', () => {
    menuSheet.classList.add('hidden');
});

// 1️⃣ 아티스트 이름 설정
btnChangeArtistName.addEventListener('click', () => {
    const newName = prompt("새로운 이름을 입력하세요:", artistNameText);
    if (newName && newName.trim() !== '') {
        artistNameText = newName.trim();
        localStorage.setItem('user_artist_name', artistNameText);
        applyStoredData();
        alert("짠!");
    }
});

// 2️⃣ 프로필 이미지 직접 업로드 설정
btnChangeProfileImg.addEventListener('click', () => {
    menuSheet.classList.add('hidden');
    fileInputProfile.click();
});

fileInputProfile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            profileImgUrl = event.target.result;
            localStorage.setItem('user_profile_img', profileImgUrl);
            applyStoredData();
            alert("프로필 사진이 변경되었습니다.");
        };
        reader.readAsDataURL(file);
    }
});

// 3️⃣ 답장 모드 (아티스트 ↔ 일반) 전환
btnToggleArtist.addEventListener('click', () => {
    isArtistMode = !isArtistMode;
    if (isArtistMode) {
        alert("답장 모드로 전환되었습니다.");
        messageInput.placeholder = "답장을 입력해 주세요.";
        screen2.classList.add('artist-mode-bg'); // 배경화면 2로 변경
    } else {
        alert("일반 모드로 전환되었습니다.");
        messageInput.placeholder = "메시지를 입력해 주세요.";
        screen2.classList.remove('artist-mode-bg'); // 원래 배경화면으로 복구
    }
    updateArtistModeButtonText();
    menuSheet.classList.add('hidden');
});

function updateArtistModeButtonText() {
    btnToggleArtist.innerText = isArtistMode 
        ? "답장/삭제(현재: ON)" 
        : "답장/삭제(현재: OFF)";
}

// 4️⃣ 메시지 삭제 기능 안내
btnDeleteGuide.addEventListener('click', () => {
    alert("채팅창에 등록된 메시지를 터치/클릭하면 삭제 여부를 묻는 창이 뜨며 바로 삭제할 수 있습니다.");
    menuSheet.classList.add('hidden');
});

// 🟢 엔터 누를 때 전송 방지 및 줄바꿈 허용
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.stopPropagation(); 
    }
});

// 메시지 전송 (우측 버튼 클릭 시에만 단일 실행)
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    const senderType = isArtistMode ? 'artist' : 'user';

    socket.emit('chatMessage', { 
        text: text,
        senderType: senderType,
        senderName: myNickname,
        msgId: Date.now() + '_' + Math.random().toString(36).substr(2, 4)
    });

    messageInput.value = '';
});

// 수신 및 메시지 렌더링
socket.on('message', (data) => {
    const text = typeof data === 'object' ? data.text : data;
    const senderType = data.senderType || 'user';
    const msgId = data.msgId || Date.now();

    const groupDiv = document.createElement('div');
    groupDiv.setAttribute('data-id', msgId);

    if (senderType === 'artist') {
        groupDiv.classList.add('message-group', 'other');
        groupDiv.innerHTML = `
            <img src="${profileImgUrl}" class="msg-thumb" onerror="this.src='https://via.placeholder.com/32'">
            <div class="msg-content">
                <span class="msg-sender">${artistNameText}</span>
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

    // 클릭 시 메시지 삭제 기능 (관리자 전용)
    const msgBubble = groupDiv.querySelector('.message');
    msgBubble.addEventListener('click', () => {
        if (!isAdmin) return; // 관리자가 아니면 무시

        if (confirm("메시지를 삭제하시겠습니까?")) {
            groupDiv.remove();
        }
    });

    chatMessages.appendChild(groupDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// 이전 대화 기록 로드
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