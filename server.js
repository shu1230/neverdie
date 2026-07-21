const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🟢 CORS 설정
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 메모리 기반 채팅 기록 저장 (임시)
const messageHistory = [];

io.on('connection', (socket) => {
    console.log('👤 [소켓] 새로운 사용자 접속! (ID:', socket.id, ')');

    // 1️⃣ 이전 채팅 기록 보내기
    socket.emit('loadHistory', messageHistory);

    // 2️⃣ 메시지 수신 이벤트
    socket.on('chatMessage', (data) => {
        console.log('📩 [소켓] 받은 메시지:', data);

        const text = typeof data === 'string' ? data : data.text;
        const senderType = data.senderType || 'user';

        if (!text) return;

        const msgObj = { text, senderType };
        messageHistory.push(msgObj);

        // 모든 사용자에게 메시지 전송
        io.emit('message', msgObj);
    });

    socket.on('disconnect', () => {
        console.log('👋 사용자 접속 종료');
    });
});

// 🟢 Render 포트 반영
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});