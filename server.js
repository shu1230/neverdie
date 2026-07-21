const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
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

// 🟢 1) MongoDB 데이터베이스 연결 (아까 복사한 본인 주소로 교체하세요!)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://soyouth1229_db_user:fDpIk7tU9xvmDoDW@cluster0.9nxwegx.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ [DB] MongoDB 클라우드 연결 성공!'))
    .catch(err => console.error('❌ [DB] 연결 실패:', err));

// 🟢 2) 메시지 저장용 스키마(틀) 정의
const MessageSchema = new mongoose.Schema({
    text: String,
    senderType: String,
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', MessageSchema);

// 🟢 3) 소켓 통신 처리
io.on('connection', async (socket) => {
    console.log('👤 [소켓] 새로운 사용자 접속! (ID:', socket.id, ')');

    // 1️⃣ 접속하자마자 DB에서 이전 대화 기록 싹 다 가져와서 뿌려주기!
    try {
        const history = await Message.find().sort({ createdAt: 1 });
        socket.emit('loadHistory', history);
    } catch (err) {
        console.error('❌ DB 기록 로드 에러:', err);
    }

    // 2️⃣ 메시지 수신 시 DB에 영구 저장 후 브로드캐스트
    socket.on('chatMessage', async (data) => {
        const text = typeof data === 'string' ? data : data.text;
        const senderType = data.senderType || 'user';

        if (!text) return;

        // DB에 진짜 저장하기!
        try {
            const newMessage = new Message({ text, senderType });
            await newMessage.save();

            // 모든 연결된 사용자에게 전송
            io.emit('message', { text, senderType });
        } catch (err) {
            console.error('❌ 메시지 DB 저장 에러:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('👋 사용자 접속 종료');
    });
});

// 🟢 Render 포트 설정
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});