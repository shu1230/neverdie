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

// 🟢 1) MongoDB 데이터베이스 연결
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://soyouth1229_db_user:fDpIk7tU9xvmDoDW@cluster0.9nxwegx.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ [DB] MongoDB 클라우드 연결 성공!'))
    .catch(err => console.error('❌ [DB] 연결 실패:', err));

// 🟢 2) 메시지 스키마 수정 (messageType 추가)
const MessageSchema = new mongoose.Schema({
    text: String,
    senderType: String,
    messageType: { type: String, default: 'text' },
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', MessageSchema);

// 🟢 3) 소켓 통신 처리
io.on('connection', async (socket) => {
    console.log('👤 [소켓] 새로운 사용자 접속! (ID:', socket.id, ')');

    // 1️⃣ 이전 대화 기록 불러오기 (DB의 _id를 msgId로 매핑하여 전송)
    try {
        const rawHistory = await Message.find().sort({ createdAt: 1 });
        const history = rawHistory.map(msg => ({
            msgId: msg._id.toString(),
            text: msg.text,
            senderType: msg.senderType,
            messageType: msg.messageType
        }));
        socket.emit('loadHistory', history);
    } catch (err) {
        console.error('❌ DB 기록 로드 에러:', err);
    }

    // 2️⃣ 메시지 수신 및 DB 저장
    socket.on('chatMessage', async (data) => {
        const text = typeof data === 'object' ? data.text : data;
        const senderType = (typeof data === 'object' && data.senderType) ? data.senderType : 'user';
        const messageType = (typeof data === 'object' && data.messageType) ? data.messageType : 'text';

        if (!text) return;

        try {
            const newMessage = new Message({ text, senderType, messageType });
            const savedMsg = await newMessage.save();

            // 생성된 MongoDB _id를 msgId에 담아 브로드캐스트
            io.emit('message', { 
                msgId: savedMsg._id.toString(),
                text: savedMsg.text, 
                senderType: savedMsg.senderType,
                messageType: savedMsg.messageType
            });
        } catch (err) {
            console.error('❌ 메시지 DB 저장 에러:', err);
        }
    });

    // 3️⃣ 🟢 [추가됨] 메시지 DB 영구 삭제 및 브로드캐스트
    socket.on('deleteMessage', async (data) => {
        const msgId = typeof data === 'object' ? data.msgId : data;

        if (!msgId) return;

        try {
            // DB에서 해당 ID 데이터 완전 삭제
            await Message.findByIdAndDelete(msgId);
            console.log(`🗑️ [DB] 메시지 영구 삭제 완료 (ID: ${msgId})`);

            // 모든 사용자 클라이언트 화면에서 지우도록 이원 전달
            io.emit('messageDeleted', msgId);
        } catch (err) {
            console.error('❌ 메시지 삭제 에러:', err);
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