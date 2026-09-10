// main.js

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

// 채팅용 이미지 관련 DOM
const chatImageInput = document.getElementById('chat-image-input');
const sendOptionSheet = document.getElementById('send-option-sheet');
const btnSendText = document.getElementById('btn-send-text');
const btnSendImage = document.getElementById('btn-send-image');
const closeSendOptionBtn = document.getElementById('close-send-option-btn');

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
const ADMIN_PASSWORD = "12301995";

let myNickname = localStorage.getItem('user_nickname') || '나';
let profileImgUrl = localStorage.getItem('user_profile_img') || 'profile.png';

// 🟢 상태 메시지를 '맘모스~🐘'로 변경
let statusMsgText = localStorage.getItem('user_status_msg') || '맘모스~🐘';
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
        isAdmin = true;
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
        statusMsgText = newStatus.trim() || '맘모스~🐘';
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

// 2️⃣ 프로필 이미지 업로드
btnChangeProfileImg.addEventListener('click', () => {
    menuSheet.classList.add('hidden');
    fileInputProfile.click();
});

fileInputProfile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        compressImage(file, 400, 0.7, (compressedDataUrl) => {
            profileImgUrl = compressedDataUrl;
            localStorage.setItem('user_profile_img', profileImgUrl);
            applyStoredData();
            alert("프로필 사진이 변경되었습니다.");
        });
    }
});

// 3️⃣ 답장 모드 (아티스트 ↔ 일반) 전환
btnToggleArtist.addEventListener('click', () => {
    isArtistMode = !isArtistMode;
    if (isArtistMode) {
        alert("답장 모드로 전환되었습니다.");
        messageInput.placeholder = "답장을 입력해 주세요.";
        screen2.classList.add('artist-mode-bg');
    } else {
        alert("일반 모드로 전환되었습니다.");
        messageInput.placeholder = "메시지를 입력해 주세요.";
        screen2.classList.remove('artist-mode-bg');
    }
    updateArtistModeButtonText();
    menuSheet.classList.add('hidden');
});

function updateArtistModeButtonText() {
    btnToggleArtist.innerText = isArtistMode 
        ? "답장/삭제(현재: ON)" 
        : "답장/삭제(현재: OFF)";
}

// 4️⃣ 메시지 삭제 안내
btnDeleteGuide.addEventListener('click', () => {
    alert("채팅창에 등록된 메시지를 터치/클릭하면 삭제 여부를 묻는 창이 뜨며 바로 삭제할 수 있습니다.");
    menuSheet.classList.add('hidden');
});

// 🟢 [수정완료] 엔터 키 입력 시 전송하지 않고 기본 동작(줄바꿈) 실행
// (키 다운 이벤트 방지/전송 연동 로직을 완전히 제거하였습니다)

// 🟢 메시지 전송 이벤트 (관리자 모드 분기)
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (isAdmin) {
        sendOptionSheet.classList.remove('hidden');
    } else {
        executeTextSend();
    }
});

// 옵션 팝업 버튼 처리
btnSendText.addEventListener('click', () => {
    sendOptionSheet.classList.add('hidden');
    executeTextSend();
});

btnSendImage.addEventListener('click', () => {
    sendOptionSheet.classList.add('hidden');
    
    if (!isAdmin) {
        alert("이미지 전송은 관리자만 가능합니다.");
        return;
    }
    chatImageInput.click();
});

closeSendOptionBtn.addEventListener('click', () => {
    sendOptionSheet.classList.add('hidden');
});

// 🟢 이미지 용량 압축 헬퍼 함수
function compressImage(file, maxWidth, quality, callback) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 이미지 파일 선택 후 전송
chatImageInput.addEventListener('change', (e) => {
    if (!isAdmin) {
        alert("이미지는 관리자만 전송할 수 있습니다.");
        chatImageInput.value = '';
        return;
    }

    const file = e.target.files[0];
    if (file) {
        compressImage(file, 600, 0.7, (compressedDataUrl) => {
            const senderType = isArtistMode ? 'artist' : 'user';

            socket.emit('chatMessage', { 
                messageType: 'image',
                text: compressedDataUrl,
                senderType: senderType,
                senderName: myNickname,
                msgId: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
            });

            chatImageInput.value = '';
        });
    }
});

// 텍스트 메시지 전송 로직
function executeTextSend() {
    const text = messageInput.value.trim();
    if (!text) return;

    const senderType = isArtistMode ? 'artist' : 'user';

    socket.emit('chatMessage', { 
        messageType: 'text',
        text: text,
        senderType: senderType,
        senderName: myNickname,
        msgId: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
    });

    messageInput.value = '';
}

// 🟢 메시지 HTML 생성 및 렌더링
function renderMessage(data) {
    if (!data) return;

    const isObject = typeof data === 'object';
    let text = isObject ? data.text : data;
    let senderType = isObject ? (data.senderType || 'user') : 'user';
    let messageType = isObject ? (data.messageType || 'text') : 'text';
    const msgId = isObject ? data.msgId : null;

    if (typeof text === 'string' && text.startsWith('data:image/')) {
        messageType = 'image';
    }

    const groupDiv = document.createElement('div');
    if (msgId) {
        groupDiv.setAttribute('data-id', msgId);
    }

    let contentHtml = '';
    
    if (messageType === 'image') {
        const imgClass = senderType === 'artist' ? 'other-img-msg' : 'my-img-msg';
        contentHtml = `
            <div class="msg-img-container ${imgClass} delete-target">
                <img src="${text}" class="msg-img" alt="shared photo">
            </div>
        `;
    } else {
        const bubbleClass = senderType === 'artist' ? 'other-msg' : 'my-msg';
        contentHtml = `<div class="message ${bubbleClass} delete-target">${escapeHtml(text)}</div>`;
    }

    if (senderType === 'artist') {
        groupDiv.classList.add('message-group', 'other');
        groupDiv.innerHTML = `
            <img src="${profileImgUrl}" class="msg-thumb" onerror="this.src='profile.png'">
            <div class="msg-content">
                <span class="msg-sender">${artistNameText}</span>
                <div class="other-msg-container">
                    ${contentHtml}
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
                    ${contentHtml}
                </div>
            </div>
        `;
    }

    const clickableArea = groupDiv.querySelector('.delete-target');
    if (clickableArea) {
        clickableArea.addEventListener('click', () => {
            if (!isAdmin) return;

            if (confirm("해당 항목을 영구 삭제하시겠습니까?")) {
                if (msgId) {
                    socket.emit('deleteMessage', { msgId: msgId });
                } else {
                    groupDiv.remove();
                }
            }
        });
    }

    chatMessages.appendChild(groupDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 실시간 수신 이벤트
socket.on('message', (data) => {
    renderMessage(data);
});

// 이전 대화 기록 로드
socket.on('loadHistory', (history) => {
    chatMessages.innerHTML = '';
    if (Array.isArray(history)) {
        history.forEach(data => renderMessage(data));
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('messageDeleted', (deletedMsgId) => {
    const targetEl = document.querySelector(`[data-id="${deletedMsgId}"]`);
    if (targetEl) {
        targetEl.remove();
    }
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
